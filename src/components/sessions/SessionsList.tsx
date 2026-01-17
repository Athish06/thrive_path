import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarClock,
  CalendarPlus,
  CalendarDays,
  Clock,
  Layers,
  User,
  Plus,
  BookOpen,
  Settings,
  RefreshCw,
  CheckCircle,
  Ban,
  Copy,
  PlayCircle,
  Search,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SessionActivitiesModal } from './SessionActivitiesModal';
import { SessionAddModal } from './SessionAddModal';
import { LearnerTypeSelectionModal } from './LearnerTypeSelectionModal';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/dropdown';
import { SessionRescheduleModal } from './SessionRescheduleModal';
import { SessionRescheduleStepperModal } from './SessionRescheduleStepperModal';
import { RescheduleTypeModal } from './RescheduleTypeModal';
import {
  startSessionRequest,
  completeSessionRequest,
  SessionNeedsRescheduleError,
  cascadeRescheduleRequest,
  SessionRescheduleDetail,
  CascadeRescheduleResponse
} from '../../utils/sessionActions';
import {
  deriveEndTimeFromDuration,
  getSessionDurationMinutes,
  isSessionOngoing,
  isSessionStartable,
  normalizeTimeValue,
  statusDisplayLabel
} from '../../utils/sessionUtils';
import { FilterDropdown, FilterOption } from '../shared/FilterDropdown';
import { API_BASE_URL } from '../../config/api';

interface Session {
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
}

export const SessionsList: React.FC = () => {
  const { user } = useAuth();
  const { myStudents, tempStudents, backendSessions, sessionsLoading, refreshSessionsPage } = useData();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showLearnerTypeModal, setShowLearnerTypeModal] = useState(false);
  const [selectedLearnerType, setSelectedLearnerType] = useState<'general' | 'temporary' | null>(null);
  const [activeOptionsSessionId, setActiveOptionsSessionId] = useState<number | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(null);
  const [pendingRescheduleSession, setPendingRescheduleSession] = useState<Session | null>(null);
  const [rescheduleValidationDetail, setRescheduleValidationDetail] = useState<SessionRescheduleDetail | null>(null);
  const [showRescheduleStepper, setShowRescheduleStepper] = useState(false);
  const [isCascadeSubmitting, setIsCascadeSubmitting] = useState(false);
  const [isUpdatingSessionId, setIsUpdatingSessionId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Reschedule type selection modal state
  const [showRescheduleTypeModal, setShowRescheduleTypeModal] = useState(false);
  const [rescheduleTypeSession, setRescheduleTypeSession] = useState<Session | null>(null);

  // Cancel with reschedule modal state
  const [showCancelRescheduleModal, setShowCancelRescheduleModal] = useState(false);
  const [cancelledSession, setCancelledSession] = useState<Session | null>(null);

  const sessionFilterOptions: FilterOption[] = [
    {
      value: 'all',
      label: 'All Sessions',
      icon: <Layers className="h-4 w-4" />
    },
    {
      value: 'scheduled',
      label: 'Scheduled',
      icon: <CalendarDays className="h-4 w-4 text-violet-500" />,
      color: 'violet'
    },
    {
      value: 'ongoing',
      label: 'Ongoing',
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      color: 'blue'
    },
    {
      value: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      color: 'emerald'
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      icon: <XCircle className="h-4 w-4 text-rose-500" />,
      color: 'rose'
    }
  ];


  // Load data on component mount - DataContext handles this automatically
  useEffect(() => {
    // DataContext automatically fetches data when user is available
    // No need for manual fetching here
  }, [user]);

  const handleLearnerTypeSelection = (type: 'general' | 'temporary') => {
    setSelectedLearnerType(type);
    setShowCreateModal(true);
  };

  const handleAddSessionClick = () => {
    setShowLearnerTypeModal(true);
  };

  const handleSessionAdd = async (sessionData: any) => {
    try {
      const token = localStorage.getItem('access_token');

      // Find the selected learner from the appropriate student list
      const learnerIdFromForm = sessionData.learnerId ?? sessionData.child_id;
      const combinedStudents = [...myStudents, ...tempStudents];
      const selectedLearner = combinedStudents.find((student: any) =>
        (learnerIdFromForm !== undefined && Number(student.id) === Number(learnerIdFromForm)) ||
        student.name === sessionData.learner
      );

      if (!selectedLearner) {
        setError('Selected learner not found');
        return;
      }

      const isAssessmentSession = Boolean(sessionData.isAssessmentSession);

      // Map assessment tool strings to activity IDs
      const ASSESSMENT_TOOL_TO_ACTIVITY_ID: Record<string, number> = {
        'isaa': 1,
        'indt-adhd': 2,
        'clinical-snapshots': 11
      };

      let sessionActivities = [];

      if (isAssessmentSession && Array.isArray(sessionData.assessmentTools)) {
        // For assessment sessions, send activity_id directly
        // Backend will create child_goals automatically
        sessionActivities = sessionData.assessmentTools
          .map((toolId: string) => {
            const activityId = ASSESSMENT_TOOL_TO_ACTIVITY_ID[toolId];
            if (!activityId) return null;

            return {
              activity_id: activityId,
              actual_duration: 0, // Will be filled during assessment
              performance_notes: ''
            };
          })
          .filter((item: any) => item !== null);
      } else if (Array.isArray(sessionData.childGoals)) {
        // Regular session with pre-selected child_goals
        sessionActivities = sessionData.childGoals.map((childGoalId: number) => ({
          child_goal_id: childGoalId,
          actual_duration: 30, // Default duration, can be updated later
          performance_notes: ''
        }));
      }

      // Convert the sessionData format to backend format
      const backendData = {
        child_id: parseInt(selectedLearner.id.toString()),  // Ensure it's a number
        session_date: sessionData.date,
        start_time: sessionData.startTime,
        end_time: sessionData.endTime,
        therapist_notes: sessionData.notes || '',
        session_activities: sessionActivities
      };

      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        try {
          const createdSession = await response.json();

          // Add activity tracking for session creation
          window.dispatchEvent(new CustomEvent('activityAdded', {
            detail: {
              message: `New session scheduled with ${sessionData.learner}`,
              type: 'session'
            }
          }));

          window.dispatchEvent(new CustomEvent('scheduleChanged', { detail: { session: createdSession } }));
        } catch (e) {
          window.dispatchEvent(new CustomEvent('scheduleChanged'));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create session');
      }
    } catch (err) {
      setError('Error creating session');
      console.error('Session creation error:', err);
    }
  };



  const buildCascadeSuccessMessage = (result: CascadeRescheduleResponse) => {
    const sessionSummaries = result.sessions.slice(0, 3).map((session) => {
      const learner = session.student_name || 'Learner';
      const newDate = formatDate(session.new_date);
      const start = formatTime(session.start_time);
      const end = formatTime(session.end_time);
      return `${learner}: ${newDate} • ${start} - ${end}`;
    });

    const additionalCount = Math.max(result.sessions.length - sessionSummaries.length, 0);
    const summaryTail = additionalCount > 0 ? `, +${additionalCount} more session${additionalCount === 1 ? '' : 's'}` : '';
    const detailText = sessionSummaries.length ? sessionSummaries.join('; ') : 'No sessions updated.';

    return `Shifted ${result.total_updated} session${result.total_updated === 1 ? '' : 's'} forward. ${detailText}${summaryTail}`;
  };

  const handleRescheduleSubmit = async ({ date, time }: { date: string; time: string }) => {
    if (!rescheduleTarget) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setIsUpdatingSessionId(rescheduleTarget.id);

    try {
      const durationMinutes = getSessionDurationMinutes(rescheduleTarget);
      const endTime = deriveEndTimeFromDuration(time, durationMinutes);

      // Check for time conflicts with other sessions on the same date
      const conflictingSession = backendSessions.find((s) => {
        if (s.id === rescheduleTarget.id) return false; // Skip current session
        if (s.session_date !== date) return false; // Different date
        if (s.status === 'cancelled') return false; // Ignore cancelled sessions

        // Check time overlap
        const existingStart = s.start_time;
        const existingEnd = s.end_time;

        // New session: time -> endTime
        // Existing session: existingStart -> existingEnd
        // Overlap if: new start < existing end AND new end > existing start
        const hasOverlap = time < existingEnd && endTime > existingStart;
        return hasOverlap;
      });

      if (conflictingSession) {
        setActionFeedback({
          type: 'error',
          message: `Time conflict: ${conflictingSession.student_name || 'Another session'} is scheduled at ${conflictingSession.start_time} - ${conflictingSession.end_time} on this date.`
        });
        setIsUpdatingSessionId(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/sessions/${rescheduleTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_date: date,
          start_time: time,
          end_time: endTime,
          // Update status to scheduled when rescheduling (handles cancelled sessions)
          status: 'scheduled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to reschedule session');
      }

      setActionFeedback({
        type: 'success',
        message: `Session with ${rescheduleTarget.student_name || 'learner'} rescheduled successfully.`
      });

      setRescheduleTarget(null);
      window.dispatchEvent(new CustomEvent('scheduleChanged'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule session';
      setActionFeedback({ type: 'error', message });
    } finally {
      setIsUpdatingSessionId(null);
      await refreshSessionsPage();
    }
  };

  const closeRescheduleFlow = () => {
    setShowRescheduleStepper(false);
    setRescheduleValidationDetail(null);
    setPendingRescheduleSession(null);
    setIsCascadeSubmitting(false);
  };

  const handleManualRescheduleSelect = () => {
    if (!rescheduleValidationDetail?.session?.id) {
      closeRescheduleFlow();
      return;
    }

    const sessionId = rescheduleValidationDetail.session.id;
    const existingSession = backendSessions.find((session) => session.id === sessionId);
    const fallbackSession = existingSession ?? pendingRescheduleSession;

    if (fallbackSession) {
      setRescheduleTarget(fallbackSession);
    } else {
      setActionFeedback({
        type: 'error',
        message: 'Unable to open reschedule modal for this session. Please try again from the sessions list.'
      });
    }

    closeRescheduleFlow();
  };

  const handleManualRescheduleFromCascade = (sessionId: number) => {
    const targetSession = backendSessions.find((session) => session.id === sessionId);

    if (!targetSession) {
      setActionFeedback({
        type: 'error',
        message: 'Unable to locate that session for manual editing. Please refresh and try again.'
      });
      return;
    }

    closeRescheduleFlow();
    window.setTimeout(() => {
      setRescheduleTarget(targetSession);
    }, 0);
  };

  const handleCascadeRescheduleConfirm = async (includeWeekends: boolean): Promise<CascadeRescheduleResponse> => {
    if (!rescheduleValidationDetail?.session?.id) {
      throw new Error('Missing session information for cascade rescheduling.');
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      throw new Error('Authentication required.');
    }

    setIsCascadeSubmitting(true);

    try {
      const response = await cascadeRescheduleRequest(
        rescheduleValidationDetail.session.id,
        token,
        includeWeekends
      );

      setActionFeedback({
        type: 'success',
        message: buildCascadeSuccessMessage(response)
      });

      window.dispatchEvent(new CustomEvent('scheduleChanged'));

      // Close the reschedule flow after showing success briefly
      setTimeout(() => {
        closeRescheduleFlow();
      }, 2000);

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cascade reschedule sessions';
      setActionFeedback({ type: 'error', message });
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsCascadeSubmitting(false);
      await refreshSessionsPage();
    }
  };

  // Handle reschedule button click - show type selection modal
  const handleRescheduleClick = (session: Session) => {
    setRescheduleTypeSession(session);
    setShowRescheduleTypeModal(true);
  };

  // User chose manual reschedule from type modal
  const handleRescheduleTypeManual = () => {
    if (rescheduleTypeSession) {
      setRescheduleTarget(rescheduleTypeSession);
    }
    setShowRescheduleTypeModal(false);
    setRescheduleTypeSession(null);
  };

  // User chose cascade reschedule from type modal
  const handleRescheduleTypeCascade = () => {
    if (rescheduleTypeSession) {
      // Create detail for the stepper modal
      const detail: SessionRescheduleDetail = {
        session: {
          id: rescheduleTypeSession.id,
          session_date: rescheduleTypeSession.session_date,
          start_time: rescheduleTypeSession.start_time,
          end_time: rescheduleTypeSession.end_time,
          student_name: rescheduleTypeSession.student_name
        },
        message: 'Cascade reschedule: Push all sessions forward',
        upcoming: { count: 0, sessions: [] }
      };
      setPendingRescheduleSession(rescheduleTypeSession);
      setRescheduleValidationDetail(detail);
      setShowRescheduleStepper(true);
    }
    setShowRescheduleTypeModal(false);
    setRescheduleTypeSession(null);
  };

  // Close reschedule type modal
  const closeRescheduleTypeModal = () => {
    setShowRescheduleTypeModal(false);
    setRescheduleTypeSession(null);
  };

  const handleStartSession = async (session: Session) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setIsUpdatingSessionId(session.id);

    try {
      await startSessionRequest(session.id, token);

      setActionFeedback({
        type: 'success',
        message: `Started session with ${session.student_name || 'learner'}.`
      });

      window.dispatchEvent(new CustomEvent('scheduleChanged'));
      navigate('/sessions/active');
    } catch (err) {
      if (err instanceof SessionNeedsRescheduleError) {
        const fallbackSummary = {
          id: session.id,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          student_name: session.student_name
        };

        setPendingRescheduleSession(session);
        setRescheduleValidationDetail({
          ...err.detail,
          session: err.detail?.session ?? fallbackSummary,
          message: err.message || err.detail?.message
        });
        setShowRescheduleStepper(true);
        setActionFeedback({ type: 'error', message: err.message });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to start session';
        setActionFeedback({ type: 'error', message });
      }
    } finally {
      setIsUpdatingSessionId(null);
      await refreshSessionsPage();
    }
  };

  const handleMarkCompleted = async (session: Session) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setIsUpdatingSessionId(session.id);

    try {
      await completeSessionRequest(session.id, token);

      setActionFeedback({
        type: 'success',
        message: `Marked session with ${session.student_name || 'learner'} as completed.`
      });

      // Add activity tracking
      window.dispatchEvent(new CustomEvent('activityAdded', {
        detail: {
          message: `Session completed with ${session.student_name || 'learner'}`,
          type: 'session'
        }
      }));

      window.dispatchEvent(new CustomEvent('scheduleChanged'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark session as completed';
      setActionFeedback({ type: 'error', message });
    } finally {
      setIsUpdatingSessionId(null);
      await refreshSessionsPage();
    }
  };

  const handleCancelSession = async (session: Session) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setIsUpdatingSessionId(session.id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session.id,
          new_status: 'cancelled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to cancel session');
      }

      setActionFeedback({
        type: 'success',
        message: `Cancelled session with ${session.student_name || 'learner'}. Would you like to reschedule remaining sessions?`
      });

      // Store cancelled session for potential reschedule and show modal
      setCancelledSession(session);
      setShowCancelRescheduleModal(true);

      window.dispatchEvent(new CustomEvent('scheduleChanged'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel session';
      setActionFeedback({ type: 'error', message });
    } finally {
      setIsUpdatingSessionId(null);
      await refreshSessionsPage();
    }
  };

  const buildSessionSummary = (session: Session) => {
    const learnerName = session.student_name || 'Learner';
    const date = formatDate(session.session_date);
    const timeRange = `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;
    const status = session.status.replace('_', ' ').toUpperCase();
    const activitiesSummary = `${session.completed_activities}/${session.total_planned_activities} activities completed`;

    return `Session Summary\nLearner: ${learnerName}\nStatus: ${status}\nWhen: ${date} at ${timeRange}\nProgress: ${activitiesSummary}`;
  };

  const handleCopySessionSummary = async (session: Session) => {
    const summary = buildSessionSummary(session);

    try {
      await navigator.clipboard.writeText(summary);
      setActionFeedback({
        type: 'success',
        message: `Copied session summary for ${session.student_name || 'learner'}.`
      });
    } catch (error) {
      console.error('Clipboard copy failed', error);
      setActionFeedback({
        type: 'error',
        message: 'Unable to copy summary. Please try again.'
      });
    }
  };

  const formatDateTimeForICS = (date: string, time: string) => {
    const normalizedTime = normalizeTimeValue(time);
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);
    const parts = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0];
    return `${parts}Z`;
  };

  const handleDownloadCalendarInvite = (session: Session) => {
    try {
      const dtStart = formatDateTimeForICS(session.session_date, session.start_time);
      const dtEnd = formatDateTimeForICS(session.session_date, session.end_time);
      const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `session-${session.id}@thrivepath`;
      const learnerName = session.student_name || 'Learner';
      const summary = `Therapy Session • ${learnerName}`;
      const description = buildSessionSummary(session).replace(/\n/g, '\\n');

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ThrivePath//Session Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-${session.id}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setActionFeedback({
        type: 'success',
        message: 'Downloaded calendar invite for the session.'
      });
    } catch (error) {
      console.error('ICS download failed', error);
      setActionFeedback({
        type: 'error',
        message: 'Unable to download calendar invite. Please try again.'
      });
    }
  };

  useEffect(() => {
    // DataContext automatically loads data when user is available
    // No need for manual data loading here
  }, [user]);

  useEffect(() => {
    if (!actionFeedback) return;

    const timeoutId = window.setTimeout(() => setActionFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  const filteredSessions = useMemo(() => {
    return backendSessions.filter((session) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        session.student_name?.toLowerCase().includes(normalizedSearch) ||
        session.status.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'ongoing' && isSessionOngoing(session.status)) ||
        (selectedStatus === 'scheduled' && session.status === 'scheduled') ||
        (selectedStatus === 'completed' && session.status === 'completed') ||
        (selectedStatus === 'cancelled' && session.status === 'cancelled');

      return matchesSearch && matchesStatus;
    });
  }, [backendSessions, searchTerm, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'ongoing':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'no_show':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/3 h-20 w-20 rounded-full bg-gradient-to-br from-pink-400/20 to-rose-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Therapy Sessions
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage and track your therapy sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshSessionsPage}
              disabled={sessionsLoading}
              className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSessionClick}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Session
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              key="session-action-feedback"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${actionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:text-emerald-200'
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-700/40 dark:text-rose-200'
                }`}
            >
              {actionFeedback.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              <span>{actionFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search sessions by learner or status..."
                className="w-full rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 pl-12 pr-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="w-full md:w-auto">
              <FilterDropdown
                options={sessionFilterOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filter by status"
                className="w-full md:w-[220px]"
              />
            </div>
          </div>

          {/* Sessions Grid */}
          {backendSessions.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 mb-6"
              >
                <Calendar className="h-10 w-10 text-violet-600 dark:text-violet-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                No sessions yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Create your first therapy session to get started with managing your learners' progress
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddSessionClick}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Create Session
              </motion.button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/40 dark:to-slate-700/40 mb-6"
              >
                <Layers className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                No sessions match your filters
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2 max-w-md mx-auto">
                Try adjusting your search or selecting a different status.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredSessions.map((session: Session, index: number) => {
                const isCompleted = session.status === 'completed';
                const isCancelled = session.status === 'cancelled';
                const isOngoingStatus = isSessionOngoing(session.status);
                const canStart = isSessionStartable(session);
                const canReschedule = (session.status === 'scheduled' || session.status === 'cancelled') && !isCompleted;
                const canCancel = !isCancelled && !isCompleted;
                const canMarkComplete = isOngoingStatus;
                const isProcessingThisSession = isUpdatingSessionId === session.id;
                const isOptionsOpen = activeOptionsSessionId === session.id;
                const statusLabel = statusDisplayLabel(session.status);
                const totalActivitiesPlanned = session.total_planned_activities ?? 0;
                const progressPercent = totalActivitiesPlanned > 0
                  ? Math.min(100, Math.round((session.completed_activities / totalActivitiesPlanned) * 100))
                  : 0;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="relative overflow-hidden rounded-3xl">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl p-6 md:p-8 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl group-hover:opacity-80 opacity-0 transition-opacity duration-500" />

                        <div className="relative z-10 space-y-6">
                          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
                                  <User className="h-7 w-7 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1">
                                  <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${isCompleted ? 'bg-green-500' :
                                    isOngoingStatus ? 'bg-yellow-500' :
                                      session.status === 'scheduled' ? 'bg-blue-500' :
                                        'bg-slate-400'
                                    }`} />
                                </div>
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {session.student_name || 'Unknown Student'}
                                  </h3>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm ${getStatusColor(session.status)}`}>
                                    {statusLabel.toUpperCase()}
                                  </span>
                                </div>
                                {session.therapist_name && (
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Guided by {session.therapist_name}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5">
                                <Calendar className="h-4 w-4 text-violet-600" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {formatDate(session.session_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 rounded-full bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 px-3 py-1.5">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                  {formatTime(session.start_time)} – {formatTime(session.end_time)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Estimated Duration</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {getSessionDurationMinutes(session)} minutes
                              </p>
                              <p className="mt-1 text-xs text-slate-500/70 dark:text-slate-400/70">Automatically calculated</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Activities</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {session.total_planned_activities} planned
                              </p>
                              <p className="mt-1 text-xs text-slate-500/70 dark:text-slate-400/70">{session.completed_activities} completed so far</p>
                            </div>
                          </div>

                          {session.therapist_notes && (
                            <div className="rounded-2xl border border-violet-200/60 dark:border-violet-800/60 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent px-5 py-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-violet-600/80 dark:text-violet-200/70 mb-1 font-medium">Therapist Notes</p>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                    {session.therapist_notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-4">
                              {session.total_planned_activities > 0 ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative h-14 w-14">
                                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-200 dark:text-slate-700"
                                        strokeWidth="3"
                                        d="M18 2.0845
                                           a 15.9155 15.9155 0 0 1 0 31.831
                                           a 15.9155 15.9155 0 0 1 0 -31.831"
                                        stroke="currentColor"
                                        fill="none"
                                      />
                                      <path
                                        className="text-violet-500"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        d="M18 2.0845
                                           a 15.9155 15.9155 0 0 1 0 31.831"
                                        strokeDasharray={`${progressPercent}, 100`}
                                        stroke="currentColor"
                                        fill="none"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {progressPercent}%
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                      {session.completed_activities}/{totalActivitiesPlanned} Activities
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  No activities assigned yet.
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedSession(session)}
                                className="flex items-center gap-2 rounded-xl border border-violet-200/70 dark:border-violet-800/60 bg-gradient-to-r from-violet-600/90 to-blue-600/90 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <BookOpen className="h-4 w-4" />
                                Activities
                              </motion.button>
                              {canStart && (
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  disabled={isProcessingThisSession}
                                  onClick={() => {
                                    setActiveOptionsSessionId(null);
                                    void handleStartSession(session);
                                  }}
                                  className="flex items-center gap-2 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-500/90 to-green-600/90 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isProcessingThisSession ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}
                                  Start Session
                                </motion.button>
                              )}
                              <Dropdown
                                align="right"
                                side="top"
                                isOpen={isOptionsOpen}
                                onToggle={(open) => {
                                  if (isUpdatingSessionId !== null && open) {
                                    return;
                                  }
                                  setActiveOptionsSessionId(open ? session.id : null);
                                }}
                                className="w-64 max-h-72 overflow-y-auto shadow-2xl ring-1 ring-black/10"
                                trigger={
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    disabled={isUpdatingSessionId !== null && isUpdatingSessionId !== session.id}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isProcessingThisSession ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Settings className="h-4 w-4" />
                                    )}
                                    {isProcessingThisSession ? 'Processing...' : 'Options'}
                                  </motion.button>
                                }
                              >
                                {canReschedule && (
                                  <DropdownItem
                                    icon={<CalendarClock className="h-4 w-4 text-violet-600 dark:text-violet-200" />}
                                    onClick={() => {
                                      setActiveOptionsSessionId(null);
                                      handleRescheduleClick(session);
                                    }}
                                  >
                                    Reschedule Session
                                  </DropdownItem>
                                )}
                                {canStart && (
                                  <DropdownItem
                                    icon={<PlayCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                                    onClick={() => {
                                      setActiveOptionsSessionId(null);
                                      void handleStartSession(session);
                                    }}
                                  >
                                    Start Session
                                  </DropdownItem>
                                )}
                                {canMarkComplete && (
                                  <DropdownItem
                                    icon={<CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                                    onClick={() => {
                                      setActiveOptionsSessionId(null);
                                      void handleMarkCompleted(session);
                                    }}
                                  >
                                    Mark as Completed
                                  </DropdownItem>
                                )}
                                {(canReschedule || canStart || canMarkComplete || canCancel) && (
                                  <DropdownSeparator />
                                )}
                                <DropdownItem
                                  icon={<Copy className="h-4 w-4 text-slate-500 dark:text-slate-300" />}
                                  onClick={() => {
                                    setActiveOptionsSessionId(null);
                                    void handleCopySessionSummary(session);
                                  }}
                                >
                                  Copy Session Summary
                                </DropdownItem>
                                <DropdownItem
                                  icon={<CalendarPlus className="h-4 w-4 text-blue-500 dark:text-blue-300" />}
                                  onClick={() => {
                                    setActiveOptionsSessionId(null);
                                    handleDownloadCalendarInvite(session);
                                  }}
                                >
                                  Download Calendar Invite
                                </DropdownItem>
                                {canCancel && (
                                  <>
                                    <DropdownSeparator />
                                    <DropdownItem
                                      variant="danger"
                                      icon={<Ban className="h-4 w-4" />}
                                      onClick={() => {
                                        setActiveOptionsSessionId(null);
                                        void handleCancelSession(session);
                                      }}
                                    >
                                      Cancel Session
                                    </DropdownItem>
                                  </>
                                )}
                              </Dropdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Create Session Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <SessionAddModal
              open={showCreateModal}
              onClose={() => {
                setShowCreateModal(false);
                setSelectedLearnerType(null);
              }}
              onAdd={handleSessionAdd}
              students={selectedLearnerType === 'temporary' ? tempStudents : myStudents}
              allSessions={backendSessions}
              learnerType={selectedLearnerType || 'general'}
            />
          )}
        </AnimatePresence>

        {/* Learner Type Selection Modal */}
        <AnimatePresence>
          {showLearnerTypeModal && (
            <LearnerTypeSelectionModal
              open={showLearnerTypeModal}
              onClose={() => setShowLearnerTypeModal(false)}
              onSelectType={handleLearnerTypeSelection}
            />
          )}
        </AnimatePresence>

        {/* Session Activities Modal */}
        <AnimatePresence>
          {selectedSession && (
            <SessionActivitiesModal
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
              onUpdate={() => window.dispatchEvent(new CustomEvent('scheduleChanged'))}
            />
          )}
        </AnimatePresence>

        <SessionRescheduleModal
          open={Boolean(rescheduleTarget)}
          session={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={handleRescheduleSubmit}
          isSubmitting={Boolean(rescheduleTarget && isUpdatingSessionId === rescheduleTarget.id)}
          existingSessions={backendSessions}
        />
        <SessionRescheduleStepperModal
          open={showRescheduleStepper}
          detail={rescheduleValidationDetail}
          onClose={closeRescheduleFlow}
          onManualReschedule={handleManualRescheduleSelect}
          onManualRescheduleSession={handleManualRescheduleFromCascade}
          onCascadeConfirm={handleCascadeRescheduleConfirm}
          isCascadeSubmitting={isCascadeSubmitting}
        />
        <RescheduleTypeModal
          open={showRescheduleTypeModal}
          onClose={closeRescheduleTypeModal}
          onManualReschedule={handleRescheduleTypeManual}
          onCascadeReschedule={handleRescheduleTypeCascade}
          sessionInfo={rescheduleTypeSession ? {
            studentName: rescheduleTypeSession.student_name,
            sessionDate: rescheduleTypeSession.session_date,
            startTime: rescheduleTypeSession.start_time,
            endTime: rescheduleTypeSession.end_time
          } : undefined}
        />

        {/* Cancel + Reschedule Confirmation Modal */}
        <AnimatePresence>
          {showCancelRescheduleModal && cancelledSession && (
            <motion.div
              key="cancel-reschedule-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => {
                setShowCancelRescheduleModal(false);
                setCancelledSession(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Session Cancelled
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Would you like to reschedule remaining sessions for {cancelledSession.student_name || 'this learner'}?
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        // Find next session for this student after the cancelled one
                        const nextSession = backendSessions.find(
                          (s) => s.child_id === cancelledSession.child_id &&
                            s.status === 'scheduled' &&
                            s.id !== cancelledSession.id
                        );
                        if (nextSession) {
                          handleRescheduleClick(nextSession);
                        } else {
                          setActionFeedback({ type: 'success', message: 'No remaining sessions to reschedule.' });
                        }
                        setShowCancelRescheduleModal(false);
                        setCancelledSession(null);
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all"
                    >
                      Yes, Reschedule Next Session
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelRescheduleModal(false);
                        setCancelledSession(null);
                      }}
                      className="w-full py-3 px-4 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      No, Just Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
