import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChildGoal, LittleLearner, Session } from '../types';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';

interface Student {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  status?: string;
  priorDiagnosis?: boolean;
  assessmentDetails?: Record<string, unknown> | null;
}

export interface RecentActivity {
  id: string;
  message: string;
  time: string;
  timestamp: number;
  color: string;
  type: 'session' | 'assessment' | 'learner' | 'report' | 'login';
}

interface BackendSession {
  id: number;
  therapist_id: number;
  child_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_planned_activities: number;
  completed_activities: number;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  prerequisite_completion_required: boolean;
  therapist_notes?: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  therapist_name?: string;
  sent_notification: boolean;
}

interface DataContextType {
  // Existing data
  littleLearners: LittleLearner[];
  sessions: Session[];

  // New commonly fetched data
  myStudents: Student[];
  tempStudents: Student[];
  backendSessions: BackendSession[];
  todaysSessions: BackendSession[];

  // Goal data per learner
  childGoalsByLearner: Record<string, ChildGoal[]>;
  childGoalsLoading: Record<string, boolean>;
  childGoalsError: Record<string, string | null>;

  // Loading states
  loading: boolean;
  studentsLoading: boolean;
  sessionsLoading: boolean;

  // Error states
  error: string | null;
  studentsError: string | null;
  sessionsError: string | null;

  // Actions
  addSession: (session: Omit<Session, 'id'>) => void;
  getLearnerById: (id: string) => LittleLearner | undefined;
  refreshLearners: () => Promise<void>;

  // Individual refresh functions for specific pages
  refreshLearnersPage: () => Promise<void>;
  refreshMyStudentsPage: () => Promise<void>;
  refreshTempStudentsPage: () => Promise<void>;
  refreshSessionsPage: () => Promise<void>;

  // New data refresh functions
  refreshMyStudents: () => Promise<void>;
  refreshTempStudents: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshTodaysSessions: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Goal helpers
  getChildGoalsForLearner: (learnerId: string, options?: { force?: boolean }) => Promise<ChildGoal[]>;

  // Recent activities tracking
  recentActivities: RecentActivity[];
  addActivity: (message: string, type: RecentActivity['type']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [littleLearners, setLittleLearners] = useState<LittleLearner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New state for commonly fetched data
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [tempStudents, setTempStudents] = useState<Student[]>([]);
  const [backendSessions, setBackendSessions] = useState<BackendSession[]>([]);
  const [todaysSessions, setTodaysSessions] = useState<BackendSession[]>([]);
  const [childGoalsByLearner, setChildGoalsByLearner] = useState<Record<string, ChildGoal[]>>({});
  const [childGoalsLoading, setChildGoalsLoading] = useState<Record<string, boolean>>({});
  const [childGoalsError, setChildGoalsError] = useState<Record<string, string | null>>({});

  // New loading states
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);

  // New error states
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Recent activities state
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() => {
    try {
      const stored = localStorage.getItem('recent_activities');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Add activity helper function
  const addActivity = useCallback((message: string, type: RecentActivity['type']) => {
    const colors = {
      session: 'bg-green-500',
      assessment: 'bg-blue-500',
      learner: 'bg-purple-500',
      report: 'bg-orange-500',
      login: 'bg-teal-500',
    };

    const now = Date.now();
    const newActivity: RecentActivity = {
      id: `${now}-${Math.random()}`,
      message,
      time: 'Just now',
      timestamp: now,
      color: colors[type],
      type,
    };

    setRecentActivities((prev) => {
      const updated = [newActivity, ...prev].slice(0, 10); // Keep only last 10 activities
      localStorage.setItem('recent_activities', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Listen for activity events from other components
  useEffect(() => {
    const handleActivityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: RecentActivity['type'] }>;
      if (customEvent.detail) {
        addActivity(customEvent.detail.message, customEvent.detail.type);
      }
    };

    window.addEventListener('activityAdded', handleActivityEvent);
    return () => window.removeEventListener('activityAdded', handleActivityEvent);
  }, [addActivity]);

  // Update activity times periodically
  useEffect(() => {
    const updateTimes = () => {
      setRecentActivities((prev) => {
        const updated = prev.map((activity) => {
          const diff = Date.now() - activity.timestamp;
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          let timeStr = 'Just now';
          if (days > 0) {
            timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
          } else if (hours > 0) {
            timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
          } else if (minutes > 0) {
            timeStr = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
          }

          return { ...activity, time: timeStr };
        });

        // Only update localStorage if times actually changed
        const timesChanged = updated.some((act, idx) => act.time !== prev[idx]?.time);
        if (timesChanged) {
          localStorage.setItem('recent_activities', JSON.stringify(updated));
        }

        return updated;
      });
    };

    // Update times every minute
    const interval = setInterval(updateTimes, 60000);
    updateTimes(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Transform backend student data to frontend LittleLearner format
  const transformStudentData = (student: any): LittleLearner => {
    return {
      id: student.id.toString(),
      name: student.name, // API already provides formatted name
      age: student.age || 0,
      photo: student.photo,
      status: student.status || 'active',
      nextSession: student.nextSession,
      progressPercentage: student.progressPercentage || 0,
      parentId: undefined, // Not provided by current API
      therapistId: student.primaryTherapistId?.toString() || '',
      goals: student.goals || [],
      achievements: [], // Can be added later when available
      // New fields from backend
      medicalDiagnosis: student.medicalDiagnosis,
      assessmentDetails: student.assessmentDetails || student.assessment_details, // Handle both camelCase and snake_case
      driveUrl: student.driveUrl,
      priorDiagnosis: student.priorDiagnosis,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      enrollmentDate: student.enrollmentDate,
      diagnosis: student.diagnosis,
      primaryTherapist: student.primaryTherapist,
      primaryTherapistId: student.primaryTherapistId,
      profileDetails: student.profileDetails,
    };
  };

  // Fetch students from API
  const fetchLearners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.statusText}`);
      }

      const data = await response.json();
      const transformedLearners = data.map(transformStudentData);
      setLittleLearners(transformedLearners);
    } catch (err) {
      console.error('Error fetching learners:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh learners function
  const refreshLearners = useCallback(async () => {
    await fetchLearners();
  }, [fetchLearners]);

  // New data fetch functions
  const fetchMyStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      setStudentsError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MY_STUDENTS), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch my students: ${response.statusText}`);
      const data = await response.json();
      setMyStudents(data);
    } catch (err) {
      console.error('Error fetching my students:', err);
      setStudentsError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const fetchTempStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      setStudentsError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.TEMP_STUDENTS), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch temp students: ${response.statusText}`);
      const data = await response.json();
      setTempStudents(data);
    } catch (err) {
      console.error('Error fetching temp students:', err);
      setStudentsError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const fetchBackendSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SESSIONS), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      const data = await response.json();
      setBackendSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setSessionsError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchTodaysSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SESSIONS_TODAY), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch today's sessions: ${response.statusText}`);
      const data = await response.json();
      setTodaysSessions(data);
    } catch (err) {
      console.error("Error fetching today's sessions:", err);
      setSessionsError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const getChildGoalsForLearner = useCallback(async (learnerId: string, options?: { force?: boolean }) => {
    if (!learnerId) {
      return [];
    }

    if (!options?.force && childGoalsByLearner[learnerId]) {
      return childGoalsByLearner[learnerId];
    }

    setChildGoalsLoading(prev => ({ ...prev, [learnerId]: true }));
    setChildGoalsError(prev => ({ ...prev, [learnerId]: null }));

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENT_ACTIVITIES(parseInt(learnerId))), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.statusText}`);
      }

      const data: ChildGoal[] = await response.json();
      setChildGoalsByLearner(prev => ({ ...prev, [learnerId]: data }));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Error fetching goals for learner ${learnerId}:`, err);
      setChildGoalsError(prev => ({ ...prev, [learnerId]: message }));
      return [];
    } finally {
      setChildGoalsLoading(prev => ({ ...prev, [learnerId]: false }));
    }
  }, [childGoalsByLearner]);

  // Individual refresh functions for specific pages
  const refreshLearnersPage = useCallback(async () => { await fetchLearners(); }, [fetchLearners]);
  const refreshMyStudentsPage = useCallback(async () => { await fetchMyStudents(); }, [fetchMyStudents]);
  const refreshTempStudentsPage = useCallback(async () => { await fetchTempStudents(); }, [fetchTempStudents]);
  const refreshSessionsPage = useCallback(async () => { await fetchBackendSessions(); }, [fetchBackendSessions]);

  // Refresh functions
  const refreshMyStudents = useCallback(async () => { await fetchMyStudents(); }, [fetchMyStudents]);
  const refreshTempStudents = useCallback(async () => { await fetchTempStudents(); }, [fetchTempStudents]);
  const refreshSessions = useCallback(async () => { await fetchBackendSessions(); }, [fetchBackendSessions]);
  const refreshTodaysSessions = useCallback(async () => { await fetchTodaysSessions(); }, [fetchTodaysSessions]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchLearners(),
      fetchMyStudents(),
      fetchTempStudents(),
      fetchBackendSessions(),
      fetchTodaysSessions()
    ]);
  }, [fetchLearners, fetchMyStudents, fetchTempStudents, fetchBackendSessions, fetchTodaysSessions]);

  // Initial data fetch and event listener setup
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshAllData();
    }

    const handleScheduleChange = () => {
      console.log('🔄 DataContext: scheduleChanged event received, refreshing all data.');
      refreshAllData();
    };

    window.addEventListener('scheduleChanged', handleScheduleChange);

    return () => {
      window.removeEventListener('scheduleChanged', handleScheduleChange);
    };
  }, [refreshAllData]);

  const [sessions, setSessions] = useState<Session[]>([]);
  // Removed unused mock data for activities, homework, and progressData

  const addSession = (sessionData: Omit<Session, 'id'>) => {
    const newSession: Session = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setSessions(prev => [...prev, newSession]);
  };

  // Removed updateHomework since homework state is removed

  const getLearnerById = (id: string) => littleLearners.find(learner => learner.id === id);

  return (
    <DataContext.Provider value={{
      // Existing data
      littleLearners,
      sessions,
      // Removed activities, homework, progressData from context value

      // New commonly fetched data
      myStudents,
      tempStudents,
      backendSessions,
      todaysSessions,
      childGoalsByLearner,
      childGoalsLoading,
      childGoalsError,

      // Loading states
      loading,
      studentsLoading,
      sessionsLoading,

      // Error states
      error,
      studentsError,
      sessionsError,

      // Actions
      addSession,
      getLearnerById,
      refreshLearners,

      // Individual refresh functions for specific pages
      refreshLearnersPage,
      refreshMyStudentsPage,
      refreshTempStudentsPage,
      refreshSessionsPage,

      // New data refresh functions
      refreshMyStudents,
      refreshTempStudents,
      refreshSessions,
      refreshTodaysSessions,
      refreshAllData,

      // Goal helpers
      getChildGoalsForLearner,

      // Recent activities
      recentActivities,
      addActivity
    }}>
      {children}
    </DataContext.Provider>
  );
};