import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';

// ==================== TYPES & INTERFACES ====================

export interface SessionNotification {
  id: string;
  session_id: number;
  therapist_id: number;
  student_name: string;
  message: string;
  notification_type: 'upcoming' | 'starting' | 'ending' | 'status_change';
  session_start_time: string;
  created_at: string;
  is_read: boolean;
  is_popup_shown: boolean;
}

export interface NotificationState {
  notifications: SessionNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  showPopup: boolean;
  currentPopup: SessionNotification | null;
}

export interface NotificationContextType extends NotificationState {
  // Notification management
  addNotification: (notification: Omit<SessionNotification, 'id' | 'created_at' | 'is_read' | 'is_popup_shown'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (notificationId: string) => void;

  // Session-based notification logic
  checkSessionsOnLogin: () => Promise<void>;
  scheduleSessionNotifications: (sessions: SessionData[]) => void;
  getNextSession: (currentSessionId?: number) => Promise<void>;

  // Notification UI helpers
  refreshNotifications: () => Promise<void>;
  hideNotificationPopup: () => void;
}

// ==================== LOCAL STORAGE UTILITIES ====================

const NOTIFICATION_STORAGE_KEY = 'thrivepath_notifications';
const STORAGE_VERSION = '1.0';

interface StoredNotificationData {
  version: string;
  notifications: SessionNotification[];
  lastUpdated: string;
}

const saveNotificationsToStorage = (notifications: SessionNotification[]): void => {
  try {
    const storageData: StoredNotificationData = {
      version: STORAGE_VERSION,
      notifications,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
};

const loadNotificationsFromStorage = (): SessionNotification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) return [];

    const storageData: StoredNotificationData = JSON.parse(stored);

    // Check version compatibility
    if (storageData.version !== STORAGE_VERSION) {
      console.warn('Notification storage version mismatch, clearing stored data');
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      return [];
    }

    // Filter out old notifications (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentNotifications = storageData.notifications.filter(
      notification => notification.created_at > twentyFourHoursAgo
    );

    // Save back filtered notifications
    if (recentNotifications.length !== storageData.notifications.length) {
      saveNotificationsToStorage(recentNotifications);
    }

    return recentNotifications;
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
    return [];
  }
};


// ==================== API UTILITIES ====================

// Session interface for today's sessions
interface SessionData {
  id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  student_name: string;
  child_id: number;
  therapist_id: number;
  sent_notification: boolean;
}

// Fetch today's sessions from backend
const fetchTodaysSessions = async (): Promise<SessionData[]> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(buildApiUrl(API_ENDPOINTS.SESSIONS_TODAY), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch today's sessions: ${response.status}`);
    }

    const sessions = await response.json();
    return sessions || [];
  } catch (error) {
    console.error('Error fetching today\'s sessions:', error);
    throw error;
  }
};

// Update session status (for marking as ongoing when late)
const updateSessionStatus = async (sessionId: number, newStatus: string): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(buildApiUrl(API_ENDPOINTS.SESSION_STATUS(sessionId)), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        new_status: newStatus.toLowerCase()
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update session status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
};

// Update notification sent status
const updateNotificationSentStatus = async (sessionId: number): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(buildApiUrl(API_ENDPOINTS.SESSION_NOTIFICATION_SENT(sessionId)), {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to update notification sent status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating notification sent status:', error);
    throw error;
  }
};


// ==================== CONTEXT IMPLEMENTATION ====================

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ==================== PROVIDER COMPONENT ====================

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Core state
  const [notifications, setNotifications] = useState<SessionNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<SessionNotification | null>(null);

  // Add refreshNotifications implementation (must be after setNotifications is defined)
  const refreshNotifications = useCallback(async () => {
    const storedNotifications = loadNotificationsFromStorage();
    setNotifications(storedNotifications);
  }, []);

  const [scheduledTimers, setScheduledTimers] = useState<Map<number, number>>(new Map());
  const [lastSessionCheck, setLastSessionCheck] = useState<string | null>(null);

  // Computed values
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ==================== CORE SESSION NOTIFICATION LOGIC ====================

  // Check sessions on login - main entry point for notification logic
  const checkSessionsOnLogin = useCallback(async () => {
    console.log('🔄 checkSessionsOnLogin: Starting session check');

    // Avoid duplicate checks within a short time period
    if (lastSessionCheck) {
      const lastCheck = new Date(lastSessionCheck);
      const now = new Date();
      const timeDiff = now.getTime() - lastCheck.getTime();
      const oneMinute = 60 * 1000; // 1 minute in milliseconds

      if (timeDiff < oneMinute) {
        console.log('🔄 Session check performed recently, skipping duplicate check');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch today's sessions
      const sessions = await fetchTodaysSessions();
      console.log('📅 Fetched today\'s sessions:', sessions);
      setLastSessionCheck(new Date().toISOString());

      if (sessions.length === 0) {
        console.log('📅 No sessions scheduled for today');
        return;
      }

      // Filter out sessions that are not scheduled or have already been notified, then sort by start time
      const upcomingSessions = sessions
        .filter(session => session.status === 'scheduled' && !session.sent_notification)
        .sort((a, b) => new Date(`${a.session_date}T${a.start_time}`).getTime() - new Date(`${b.session_date}T${b.start_time}`).getTime());

      if (upcomingSessions.length === 0) {
        console.log('📅 No new sessions to notify for today');
        return;
      }

      const firstSession = upcomingSessions[0];
      const remainingSessions = upcomingSessions.slice(1);
      const now = new Date();
      const sessionStartTime = new Date(`${firstSession.session_date}T${firstSession.start_time}`);

      console.log('⏰ Current time:', now.toISOString());
      console.log('⏰ First session start time:', sessionStartTime.toISOString());

      // Check if user is late for the first upcoming session
      if (now > sessionStartTime) {
        console.log('🚨 User is late for session');

        // Show late notification
        addNotification({
          session_id: firstSession.id,
          therapist_id: firstSession.therapist_id,
          student_name: firstSession.student_name,
          message: `You are late to the session with ${firstSession.student_name}`,
          notification_type: 'status_change',
          session_start_time: sessionStartTime.toISOString()
        });

        // Mark session as notified and ongoing
        await updateNotificationSentStatus(firstSession.id);
        await updateSessionStatus(firstSession.id, 'ongoing');

        // Schedule notifications for the rest of the day's sessions
        if (remainingSessions.length > 0) {
          scheduleSessionNotifications(remainingSessions);
        }
      } else {
        // --- Handle First Session with Special Two-Part Notification ---
        console.log(`🔔 Handling special notification for first session: ${firstSession.id}`);

        // 1. Show immediate "time remaining" notification
        const timeUntilSession = sessionStartTime.getTime() - now.getTime();
        const minutesUntilSession = Math.floor(timeUntilSession / (1000 * 60));
        const hoursUntilSession = Math.floor(minutesUntilSession / 60);
        const remainingMinutes = minutesUntilSession % 60;
        let timeMessage = hoursUntilSession > 0 ? `${hoursUntilSession}h ${remainingMinutes}m` : `${minutesUntilSession}m`;

        addNotification({
          session_id: firstSession.id,
          therapist_id: firstSession.therapist_id,
          student_name: firstSession.student_name,
          message: `${timeMessage} left until your session with ${firstSession.student_name}`,
          notification_type: 'upcoming',
          session_start_time: sessionStartTime.toISOString()
        });

        // 2. Schedule the 5-minute reminder for the first session
        const fiveMinutesBefore = new Date(sessionStartTime.getTime() - 5 * 60 * 1000);
        if (fiveMinutesBefore > now) {
          const timeUntilWarning = fiveMinutesBefore.getTime() - now.getTime();
          window.setTimeout(() => {
            addNotification({
              session_id: firstSession.id,
              therapist_id: firstSession.therapist_id,
              student_name: firstSession.student_name,
              message: `Session with ${firstSession.student_name} starts in 5 minutes`,
              notification_type: 'upcoming',
              session_start_time: sessionStartTime.toISOString()
            });
          }, timeUntilWarning);
        }

        // 3. Mark the first session as notified in the database
        await updateNotificationSentStatus(firstSession.id);
        console.log(`✅ Marked first session ${firstSession.id} as notified.`);

        // --- Schedule Standard Notifications for Remaining Sessions ---
        if (remainingSessions.length > 0) {
          console.log(` scheduling ${remainingSessions.length} remaining sessions.`);
          scheduleSessionNotifications(remainingSessions);
        }
      }

    } catch (error) {
      console.error('❌ Error checking sessions on login:', error);
      setError(error instanceof Error ? error.message : 'Failed to check sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Schedule notifications for sessions
  const scheduleSessionNotifications = useCallback((sessions: SessionData[]) => {
    console.log('📅 scheduleSessionNotifications: Scheduling for', sessions.length, 'sessions');

    // Clear existing timers
    scheduledTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    setScheduledTimers(new Map());

    const now = new Date();
    const newTimers = new Map<number, number>();

    sessions
      .filter(session => !session.sent_notification)
      .forEach((session) => {
        const sessionStartTime = new Date(`${session.session_date}T${session.start_time}`);
        const fiveMinutesBefore = new Date(sessionStartTime.getTime() - 5 * 60 * 1000);

        // Schedule 5-minute warning
        if (fiveMinutesBefore > now) {
          const timeUntilWarning = fiveMinutesBefore.getTime() - now.getTime();
          console.log(`⏰ Scheduling 5-min warning for session ${session.id} in ${Math.floor(timeUntilWarning / 1000 / 60)} minutes`);

          const warningTimerId = window.setTimeout(() => {
            console.log('🔔 Showing 5-minute warning for session', session.id);
            addNotification({
              session_id: session.id,
              therapist_id: session.therapist_id,
              student_name: session.student_name,
              message: `Session with ${session.student_name} starts in 5 minutes`,
              notification_type: 'upcoming',
              session_start_time: sessionStartTime.toISOString()
            });
          }, timeUntilWarning);

          newTimers.set(session.id * 1000 + 1, warningTimerId);
          updateNotificationSentStatus(session.id);
        }

        // Schedule session start notification
        if (sessionStartTime > now) {
          const timeUntilStart = sessionStartTime.getTime() - now.getTime();
          console.log(`⏰ Scheduling session start for session ${session.id} in ${Math.floor(timeUntilStart / 1000 / 60)} minutes`);

          const startTimerId = window.setTimeout(() => {
            console.log('🔔 Session starting now:', session.id);
            addNotification({
              session_id: session.id,
              therapist_id: session.therapist_id,
              student_name: session.student_name,
              message: `Session with ${session.student_name} is starting now`,
              notification_type: 'starting',
              session_start_time: sessionStartTime.toISOString()
            });

            // After session starts, get next session
            setTimeout(() => {
              getNextSession(session.id);
            }, 1000);
          }, timeUntilStart);

          newTimers.set(session.id * 1000 + 2, startTimerId);
          updateNotificationSentStatus(session.id);
        }
      });

    setScheduledTimers(newTimers);
  }, [scheduledTimers]);

  // Get next session after current one starts
  const getNextSession = useCallback(async (currentSessionId?: number) => {
    console.log('🔄 getNextSession: Fetching next session after', currentSessionId);

    try {
      // Re-fetch today's sessions to get updated schedule
      const sessions = await fetchTodaysSessions();

      const now = new Date();
      const upcomingSessions = sessions
        .filter(session => {
          const sessionStartTime = new Date(`${session.session_date}T${session.start_time}`);
          return sessionStartTime > now && session.status === 'scheduled' && session.id !== currentSessionId;
        })
        .sort((a, b) => new Date(`${a.session_date}T${a.start_time}`).getTime() - new Date(`${b.session_date}T${b.start_time}`).getTime());

      if (upcomingSessions.length > 0) {
        console.log('📅 Found next sessions, scheduling notifications');
        scheduleSessionNotifications(upcomingSessions);
      } else {
        console.log('📅 No more sessions scheduled for today');
      }

    } catch (error) {
      console.error('❌ Error getting next session:', error);
    }
  }, [scheduleSessionNotifications]);

  // ==================== NOTIFICATION MANAGEMENT ====================

  const addNotification = useCallback((notificationData: Omit<SessionNotification, 'id' | 'created_at' | 'is_read' | 'is_popup_shown'>) => {
    console.log('🔔 addNotification called with:', notificationData);

    const newNotification: SessionNotification = {
      ...notificationData,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      is_read: false,
      is_popup_shown: false,
    };

    console.log('🔔 Creating new notification:', newNotification);

    setNotifications(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(existing =>
        existing.session_id === newNotification.session_id &&
        existing.message === newNotification.message &&
        existing.notification_type === newNotification.notification_type
      );

      if (isDuplicate) {
        console.log('🔔 Duplicate notification detected, skipping');
        return prev;
      }

      const updated = [newNotification, ...prev];
      saveNotificationsToStorage(updated);
      console.log('🔔 Notification added to list, total notifications:', updated.length);
      return updated;
    });

    // Show popup for new notification
    if (!newNotification.is_popup_shown) {
      console.log('🔔 Triggering popup for notification:', newNotification);
      setCurrentPopup(newNotification);
      setShowPopup(true);

      // Mark the notification as having its popup shown
      setNotifications(prev => {
        const updated = prev.map(n => n.id === newNotification.id ? { ...n, is_popup_shown: true } : n);
        saveNotificationsToStorage(updated);
        return updated;
      });

      // Auto-close popup after 5 seconds
      setTimeout(() => {
        setCurrentPopup(null);
        setShowPopup(false);
        console.log('🔔 Auto-closed popup after 5 seconds');
      }, 5000);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      );
      saveNotificationsToStorage(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({
        ...notification,
        is_read: true
      }));
      saveNotificationsToStorage(updated);
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotificationsToStorage(updated);
      return updated;
    });
  }, []);

  // ==================== EFFECTS ====================

  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = loadNotificationsFromStorage();
    setNotifications(storedNotifications);
  }, []);

  // When the user is authenticated, start the session check
  useEffect(() => {
    if (isAuthenticated) {
      checkSessionsOnLogin();
    }

    const handleScheduleChange = () => {
      console.log('📅 scheduleChanged event received, re-checking sessions.');
      checkSessionsOnLogin();
    };

    window.addEventListener('scheduleChanged', handleScheduleChange);

    return () => {
      window.removeEventListener('scheduleChanged', handleScheduleChange);
    };
  }, [isAuthenticated, checkSessionsOnLogin]);

  // Real-time listener for notifications and parent_feedback updates
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for new notifications
    const notificationChannel = supabase
      .channel('public:session_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_notifications' },
        (payload) => {
          console.log('🔔 Real-time notification received:', payload);
          const newNotification = payload.new as SessionNotification;
          addNotification(newNotification);
        }
      )
      .subscribe();

    // Listen for parent_feedback updates in sessions table
    const sessionsChannel = supabase
      .channel('sessions-parent-feedback')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions' },
        (payload) => {
          const oldFeedback = payload.old?.parent_feedback;
          const newFeedback = payload.new?.parent_feedback;
          if (oldFeedback !== newFeedback && newFeedback) {
            // Show popup for parent feedback update
            setCurrentPopup({
              id: `parent_feedback_${payload.new.id}`,
              session_id: payload.new.id,
              therapist_id: payload.new.therapist_id || 0,
              student_name: payload.new.student_name || '',
              message: 'Parent feedback has been updated!',
              notification_type: 'status_change',
              session_start_time: payload.new.session_start_time || '',
              created_at: new Date().toISOString(),
              is_read: false,
              is_popup_shown: false,
            });
            setShowPopup(true);
            setTimeout(() => {
              setCurrentPopup(null);
              setShowPopup(false);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [isAuthenticated, addNotification]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    showPopup,
    currentPopup,

    // Notification management
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,


    // Session-based notification logic
    checkSessionsOnLogin,
    scheduleSessionNotifications,
    getNextSession,

    // Add missing context values for NotificationIcon/Popup
    refreshNotifications,
    hideNotificationPopup: () => {
      setShowPopup(false);
      setCurrentPopup(null);
    },
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// ==================== CUSTOM HOOKS ====================

// Hook for notification statistics
export const useNotificationStats = () => {
  const { notifications } = useNotifications();

  return React.useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    today: notifications.filter(n => {
      const today = new Date().toDateString();
      const notificationDate = new Date(n.created_at).toDateString();
      return today === notificationDate;
    }).length,
    byType: notifications.reduce((acc, notification) => {
      acc[notification.notification_type] = (acc[notification.notification_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }), [notifications]);
};

// Hook for session-specific notifications
export const useSessionNotifications = (sessionId?: number) => {
  const { notifications } = useNotifications();

  return React.useMemo(() => {
    if (!sessionId) {
      return [];
    }
    return notifications.filter(n => n.session_id === sessionId);
  }, [notifications, sessionId]);
};