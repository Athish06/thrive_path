import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock, Plus, ArrowRight, Calendar, PlayCircle, CheckCircle, Ban, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TodaySessionAddModal } from '../sessions/TodaySessionAddModal';
import { LearnerTypeSelectionModal } from '../sessions/LearnerTypeSelectionModal';
import { getTodayIso } from '../../utils/dateUtils';
import {
  startSessionRequest,
  completeSessionRequest,
  SessionNeedsRescheduleError,
  cascadeRescheduleRequest,
  SessionRescheduleDetail,
  CascadeRescheduleResponse
} from '../../utils/sessionActions';
import {
  isSessionOngoing,
  isSessionStartable,
  statusDisplayLabel,
  deriveEndTimeFromDuration,
  getSessionDurationMinutes
} from '../../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';
import { SessionRescheduleModal } from '../sessions/SessionRescheduleModal';
import { SessionRescheduleStepperModal } from '../sessions/SessionRescheduleStepperModal';
import { formatTimeToAMPM } from '../../utils/sessionScheduling';

const sanitizeTime = (time?: string | null) => {
  if (!time) {
    return '00:00';
  }
  return time.length >= 5 ? time.slice(0, 5) : time;
};

export const TodaysSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    myStudents,
    tempStudents,
    todaysSessions,
    backendSessions,
    sessionsLoading,
    sessionsError,
    refreshSessions,
    refreshTodaysSessions
  } = useData();

  // State for session creation
  const [showLearnerTypeModal, setShowLearnerTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedLearnerType, setSelectedLearnerType] = useState<'general' | 'temporary' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingSessionId, setProcessingSessionId] = useState<number | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [pendingRescheduleSession, setPendingRescheduleSession] = useState<any | null>(null);
  const [rescheduleValidationDetail, setRescheduleValidationDetail] = useState<SessionRescheduleDetail | null>(null);
  const [showRescheduleStepper, setShowRescheduleStepper] = useState(false);
  const [isCascadeSubmitting, setIsCascadeSubmitting] = useState(false);
  const [isManualRescheduleSubmitting, setIsManualRescheduleSubmitting] = useState(false);

  // Load data on component mount - DataContext handles this automatically
  useEffect(() => {
    // DataContext automatically fetches data when user is available
    // No need for manual fetching here
  }, [user]);

  useEffect(() => {
    if (!actionFeedback) return;

    const timeoutId = window.setTimeout(() => setActionFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  // Session creation handlers
  const handleLearnerTypeSelection = (type: 'general' | 'temporary') => {
    setSelectedLearnerType(type);
    setShowSessionModal(true);
  };

  const handleAddSessionClick = () => {
    setShowLearnerTypeModal(true);
  };

  // Custom SessionAddModal with today's date pre-filled
  const handleSessionAdd = async (sessionData: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const combinedStudents = [...myStudents, ...tempStudents];
      const studentList = selectedLearnerType === 'temporary'
        ? tempStudents
        : selectedLearnerType === 'general'
          ? myStudents
          : combinedStudents;
      const learnerIdFromForm = sessionData.learnerId ?? sessionData.child_id;
      const selectedLearner = studentList.find((student: any) =>
        (learnerIdFromForm !== undefined && Number(student.id) === Number(learnerIdFromForm)) ||
        student.name === sessionData.learner
      ) || combinedStudents.find((student: any) => Number(student.id) === Number(learnerIdFromForm));

      if (!selectedLearner) {
        console.error('Selected learner not found');
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

      // Ensure the session is for today using standardized date utility
      const today = getTodayIso();
      const backendData = {
        child_id: parseInt(selectedLearner.id.toString()),  // Ensure it's a number
        session_date: today, // Force today's date
        start_time: sessionData.startTime,
        end_time: sessionData.endTime,
        therapist_notes: sessionData.notes || '',
        session_activities: sessionActivities
      };

      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        setShowSessionModal(false);
        setSelectedLearnerType(null);
        try {
          const sessionData = await response.json();
          window.dispatchEvent(new CustomEvent('scheduleChanged', { detail: { session: sessionData } }));
        } catch (e) {
          console.log('Today\'s session created successfully');
          window.dispatchEvent(new CustomEvent('scheduleChanged'));
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to create session:', errorData.detail || 'Unknown error');
      }
    } catch (err) {
      console.error('Session creation error:', err);
    }
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

    setIsManualRescheduleSubmitting(true);

    try {
      const durationMinutes = getSessionDurationMinutes(rescheduleTarget);
      const endTime = deriveEndTimeFromDuration(time, durationMinutes);

      const response = await fetch(`http://localhost:8000/api/sessions/${rescheduleTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_date: date,
          start_time: time,
          end_time: endTime
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reschedule session';
      setActionFeedback({ type: 'error', message });
    } finally {
      setIsManualRescheduleSubmitting(false);
      await Promise.all([refreshSessions(), refreshTodaysSessions()]);
    }
  };

  const closeRescheduleFlow = () => {
    setShowRescheduleStepper(false);
    setRescheduleValidationDetail(null);
    setPendingRescheduleSession(null);
    setIsCascadeSubmitting(false);
  };

  const buildCascadeSuccessMessage = (result: CascadeRescheduleResponse) => {
    const sessionSummaries = result.sessions.slice(0, 3).map((session) => {
      const learner = session.student_name || 'Learner';
      const newDate = new Date(session.new_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const start = formatTimeToAMPM(sanitizeTime(session.start_time));
      const end = formatTimeToAMPM(sanitizeTime(session.end_time));
      return `${learner}: ${newDate} • ${start} - ${end}`;
    });

    const additionalCount = Math.max(result.sessions.length - sessionSummaries.length, 0);
    const summaryTail = additionalCount > 0 ? `, +${additionalCount} more session${additionalCount === 1 ? '' : 's'}` : '';
    const detailText = sessionSummaries.length ? sessionSummaries.join('; ') : 'No sessions updated.';

    return `Shifted ${result.total_updated} session${result.total_updated === 1 ? '' : 's'} forward. ${detailText}${summaryTail}`;
  };

  const handleManualRescheduleSelect = () => {
    if (!rescheduleValidationDetail?.session?.id) {
      closeRescheduleFlow();
      return;
    }

    const sessionId = rescheduleValidationDetail.session.id;
    const fromBackend = backendSessions.find((item) => item.id === sessionId);
    const fromToday = todaysSessions.find((item: any) => item.id === sessionId);
    const fallbackSession = fromBackend ?? fromToday ?? pendingRescheduleSession;

    if (fallbackSession) {
      setRescheduleTarget(fallbackSession);
    } else {
      setActionFeedback({
        type: 'error',
        message: 'Unable to open reschedule modal for this session from today view.'
      });
    }

    closeRescheduleFlow();
  };

  const handleManualRescheduleFromCascade = (sessionId: number) => {
    const fromBackend = backendSessions.find((item) => item.id === sessionId);
    const fromToday = todaysSessions.find((item: any) => item.id === sessionId);
    const targetSession = fromBackend ?? fromToday;

    if (!targetSession) {
      setActionFeedback({
        type: 'error',
        message: 'Unable to open manual reschedule for that session. Please refresh and try again.'
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
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cascade reschedule sessions';
      setActionFeedback({ type: 'error', message });
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsCascadeSubmitting(false);
      await Promise.all([refreshSessions(), refreshTodaysSessions()]);
    }
  };

  const handleStartExistingSession = async (session: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setProcessingSessionId(session.id);

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
      setProcessingSessionId(null);
      await Promise.all([refreshSessions(), refreshTodaysSessions()]);
    }
  };

  const handleCompleteExistingSession = async (session: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setProcessingSessionId(session.id);

    try {
      await completeSessionRequest(session.id, token);

      setActionFeedback({
        type: 'success',
        message: `Marked session with ${session.student_name || 'learner'} as completed.`
      });

      window.dispatchEvent(new CustomEvent('scheduleChanged'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete session';
      setActionFeedback({ type: 'error', message });
    } finally {
      setProcessingSessionId(null);
      await Promise.all([refreshSessions(), refreshTodaysSessions()]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Today's Sessions</CardTitle>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSessionClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:shadow-lg hover:from-violet-700 hover:to-blue-700 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              Add Session
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`mb-4 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
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
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : sessionsError ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{sessionsError}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // DataContext will handle refreshing
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </motion.button>
            </div>
          ) : todaysSessions.length > 0 ? (
            <div className="space-y-3">
              {todaysSessions.map((session: any, index: number) => {
                const canStart = isSessionStartable(session);
                const canComplete = isSessionOngoing(session.status);
                const statusLabel = statusDisplayLabel(session.status);
                const statusBarClass = session.status === 'completed'
                  ? 'bg-green-500'
                  : canComplete
                    ? 'bg-blue-500'
                    : 'bg-orange-500';
                const statusPillClass = session.status === 'completed'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : canComplete
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
                const isProcessing = processingSessionId === session.id;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    className="relative p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm transition-all cursor-default"
                  >
                    {/* Status indicator bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${statusBarClass}`} />

                    <div className="flex items-start justify-between">
                      <div className="flex-1 pl-2">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {session.student_name || 'Unknown Student'}
                          </h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {session.start_time} - {session.end_time}
                          </span>
                        </div>

                        {session.therapist_notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {session.therapist_notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusPillClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {(canStart || canComplete) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canStart && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isProcessing}
                                onClick={() => void handleStartExistingSession(session)}
                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <PlayCircle className="h-3.5 w-3.5" />
                                )}
                                Start
                              </motion.button>
                            )}
                            {canComplete && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isProcessing}
                                onClick={() => void handleCompleteExistingSession(session)}
                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Complete
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="text-center py-12"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">No sessions scheduled for today</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddSessionClick}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:shadow-lg hover:from-violet-700 hover:to-blue-700 transition-all duration-300"
              >
                Schedule Your First Session
              </motion.button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Learner Type Selection Modal */}
      {showLearnerTypeModal && (
        <LearnerTypeSelectionModal
          open={showLearnerTypeModal}
          onClose={() => setShowLearnerTypeModal(false)}
          onSelectType={handleLearnerTypeSelection}
        />
      )}

      {/* Session Add Modal - Restricted to Today's Date */}
      {showSessionModal && (
        <TodaySessionAddModal
          open={showSessionModal}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedLearnerType(null);
          }}
          onAdd={handleSessionAdd}
          students={selectedLearnerType === 'temporary' ? tempStudents : myStudents}
          todaysSessions={todaysSessions}
          allSessions={backendSessions}
          learnerType={selectedLearnerType ?? 'general'}
        />
      )}

      <SessionRescheduleModal
        open={Boolean(rescheduleTarget)}
        session={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleRescheduleSubmit}
        isSubmitting={isManualRescheduleSubmitting}
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
    </motion.div>
  );
};
