import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  RefreshCw,
  Target,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { completeSessionRequest } from '../../utils/sessionActions';
import { isSessionOngoing, statusDisplayLabel, getSessionDurationMinutes } from '../../utils/sessionUtils';
import { formatDateForDisplay, formatTimeForDisplay } from '../../utils/dateUtils';
import { SessionActivitiesModal } from './SessionActivitiesModal';
import { SingleActivityAssessmentModal } from './SingleActivityAssessmentModal';
import { isAssessmentSession } from '../../utils/assessmentApi';

interface TherapistNotesModalProps {
  isOpen: boolean;
  session: BackendSession;
  onClose: () => void;
  onComplete: (notes: string) => void;
  isCompleting?: boolean;
}

const TherapistNotesModal: React.FC<TherapistNotesModalProps> = ({
  isOpen,
  session,
  onClose,
  onComplete,
  isCompleting = false
}) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onComplete(notes.trim());
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-8 pb-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-white">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Complete Session
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Add notes for {session.student_name || 'this learner'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Therapist Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-800 dark:text-white resize-none"
                placeholder="Add any observations, progress notes, challenges faced, or recommendations for future sessions..."
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                These notes will be saved with the session and can help track the learner's progress over time.
              </p>
            </div>

            {/* Session Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-4">Session Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Student:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {session.student_name || 'Unknown Learner'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Date:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {session.session_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Time:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {session.start_time} - {session.end_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Activities:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {session.completed_activities}/{session.total_planned_activities} completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-8 pb-8">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCompleting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCompleting ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Completing...
                </div>
              ) : (
                'Complete Session'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  therapist_notes?: string;
  student_name?: string;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

interface SessionActivity {
  id: number;
  child_goal_id: number;
  actual_duration: number;
  performance_notes?: string;
  child_id?: number;
  activity_id?: number;
  current_status?: string; // Status from child_goals table
  activity_name?: string;
  activity_description?: string;
  domain?: string;
  difficulty_level?: number;
  estimated_duration?: number;
}

const ActiveSessions: React.FC = () => {
  const {
    backendSessions,
    sessionsLoading,
    sessionsError,
    refreshSessions
  } = useData();
  const [selectedSession, setSelectedSession] = useState<BackendSession | null>(null);
  const [isManagingActivities, setIsManagingActivities] = useState(false);
  const [activitiesDirty, setActivitiesDirty] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [processingSessionId, setProcessingSessionId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<FeedbackState | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<BackendSession | null>(null);
  const [assessmentScoresToSave, setAssessmentScoresToSave] = useState<Record<number, Record<string, number>>>({});
  const [activitiesForCompletion, setActivitiesForCompletion] = useState<SessionActivity[]>([]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (!actionFeedback) return;

    const timeoutId = window.setTimeout(() => setActionFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setSelectedSession((previous) => {
      if (!previous) {
        return previous;
      }

      const updated = backendSessions.find((session) => session.id === previous.id);
      if (!updated) {
        return previous;
      }

      if (
        updated.completed_activities === previous.completed_activities &&
        updated.total_planned_activities === previous.total_planned_activities &&
        updated.status === previous.status &&
        updated.therapist_notes === previous.therapist_notes
      ) {
        return previous;
      }

      return { ...previous, ...updated };
    });
  }, [backendSessions, selectedSession]);

  const activeSessions = useMemo(
    () => backendSessions.filter(session => isSessionOngoing(session.status)),
    [backendSessions]
  );

  const handleOpenDetail = (session: BackendSession) => {
    setSelectedSession(session);
    setIsManagingActivities(false);
    setDetailRefreshKey((prev) => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
    setIsManagingActivities(false);
  };

  const handleCompleteSession = (session: BackendSession, assessmentScores?: Record<number, Record<string, number>>, activities?: SessionActivity[]) => {
    setSessionToComplete(session);
    if (assessmentScores) {
      setAssessmentScoresToSave(assessmentScores);
    }
    if (activities) {
      setActivitiesForCompletion(activities);
    }
    setShowNotesModal(true);
  };

  const handleCompleteSessionWithNotes = async (notes: string) => {
    if (!sessionToComplete) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Missing access token. Please log in again.' });
      return;
    }

    setProcessingSessionId(sessionToComplete.id);

    try {
      // Check if this is an assessment session and we have scores to save
      const isAssessment = activitiesForCompletion.length > 0 &&
        Object.keys(assessmentScoresToSave).length > 0;

      if (isAssessment) {
        // Build assessment_details in the format: { toolId: { items: {}, average: number } }
        const assessmentDetails: Record<string, { items: Record<string, number>; average: number }> = {};

        // Hardcoded assessment items mapping
        const assessmentItems: Record<number, { toolId: string }> = {
          1: { toolId: 'isaa' },
          10: { toolId: 'indt-adhd' },
          11: { toolId: 'clinical-snapshots' }
        };

        for (const activity of activitiesForCompletion) {
          const activityScores = assessmentScoresToSave[activity.id];
          if (!activityScores || !activity.activity_id) continue;

          const toolInfo = assessmentItems[activity.activity_id];
          if (!toolInfo) continue;

          // Calculate average score
          const scoreValues = Object.values(activityScores);
          const average = scoreValues.length > 0
            ? Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 100) / 100
            : 0;

          assessmentDetails[toolInfo.toolId] = {
            items: activityScores,
            average
          };
        }

        // Update children table with assessment_details
        const updateResponse = await fetch(
          `http://localhost:8000/api/students/${sessionToComplete.child_id}/assessment-details`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assessment_details: assessmentDetails })
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => null);
          throw new Error(errorData?.detail || 'Failed to update assessment details');
        }
      }

      // Complete the session with notes
      await completeSessionRequest(sessionToComplete.id, token, notes);

      setActionFeedback({
        type: 'success',
        message: isAssessment
          ? `Assessment completed! Child promoted from temporary enrollment.`
          : `Marked session with ${sessionToComplete.student_name || 'learner'} as completed.`
      });

      // Track activity for assessment completion
      if (isAssessment) {
        window.dispatchEvent(new CustomEvent('activityAdded', {
          detail: {
            message: `Completed assessment for ${sessionToComplete.student_name}`,
            type: 'assessment'
          }
        }));
      }

      window.dispatchEvent(new CustomEvent('scheduleChanged'));
      await refreshSessions();
      handleBackToList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete session';
      setActionFeedback({ type: 'error', message });
    } finally {
      setProcessingSessionId(null);
      setShowNotesModal(false);
      setSessionToComplete(null);
      setAssessmentScoresToSave({});
      setActivitiesForCompletion([]);
    }
  };

  const handleManageActivities = () => {
    setActivitiesDirty(false);
    setIsManagingActivities(true);
  };

  const handleActivitiesUpdated = useCallback(() => {
    setActivitiesDirty(true);
  }, []);

  const handleActivitiesModalClose = useCallback(() => {
    setIsManagingActivities(false);

    if (!activitiesDirty) {
      return;
    }

    void (async () => {
      window.dispatchEvent(new CustomEvent('scheduleChanged'));
      await refreshSessions();
      setDetailRefreshKey((prev) => prev + 1);
      setActivitiesDirty(false);
    })();
  }, [activitiesDirty, refreshSessions]);

  const isProcessingSession = (sessionId: number) => processingSessionId === sessionId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow ${actionFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200'
              }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{actionFeedback.message}</span>
          </motion.div>
        )}

        {selectedSession ? (
          <ActiveSessionDetailView
            session={selectedSession}
            isCompleting={processingSessionId === selectedSession.id}
            onComplete={(assessmentScores, activities) => handleCompleteSession(selectedSession, assessmentScores, activities)}
            onManageActivities={handleManageActivities}
            onBack={handleBackToList}
            refreshKey={detailRefreshKey}
            refreshSessions={refreshSessions}
          />
        ) : (
          <div>
            <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-violet-500/80">Active Sessions</p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Live Session Management</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Monitor and complete sessions that are currently in progress.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void refreshSessions()}
                disabled={sessionsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800/70 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
            </div>

            {sessionsError ? (
              <div className="rounded-3xl border border-rose-200/70 bg-rose-50/80 px-6 py-16 text-center text-rose-600 shadow-lg dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200">
                <AlertTriangle className="mx-auto mb-4 h-10 w-10" />
                <p className="text-lg font-semibold">We couldn’t load active sessions.</p>
                <p className="mt-2 text-sm">{sessionsError}</p>
              </div>
            ) : sessionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/70 bg-white px-6 py-16 text-center shadow-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                <Layers className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  No active sessions right now
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Sessions will appear here once they are started.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {activeSessions.map((session) => {
                  const statusLabel = statusDisplayLabel(session.status);
                  const isProcessing = isProcessingSession(session.id);
                  const isOngoing = isSessionOngoing(session.status);

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-900/80"
                      onClick={() => handleOpenDetail(session)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          handleOpenDetail(session);
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />

                      <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-500/80">
                              {isOngoing ? 'Ongoing Session' : `${statusLabel} Session`}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                              {session.student_name || 'Unknown Learner'}
                            </h3>
                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <CalendarClock className="h-4 w-4 text-violet-500" />
                              {session.session_date} • {session.start_time} – {session.end_time}
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${session.status === 'completed'
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200'
                            : session.status === 'cancelled'
                              ? 'border-red-200 bg-red-100 text-red-700 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-200'
                              : session.status === 'scheduled'
                                ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-200'
                                : 'border-emerald-200/70 bg-emerald-100 px-3 py-1 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200'
                            }`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>{session.completed_activities}/{session.total_planned_activities} activities completed</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Tap to review session details and activity plan.
                          </p>
                          {isOngoing && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleCompleteSession(session);
                              }}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSession && isManagingActivities && (
        <SessionActivitiesModal
          session={selectedSession}
          onClose={handleActivitiesModalClose}
          onUpdate={handleActivitiesUpdated}
        />
      )}

      {showNotesModal && sessionToComplete && (
        <TherapistNotesModal
          isOpen={showNotesModal}
          session={sessionToComplete}
          onClose={() => {
            setShowNotesModal(false);
            setSessionToComplete(null);
          }}
          onComplete={handleCompleteSessionWithNotes}
          isCompleting={processingSessionId === sessionToComplete.id}
        />
      )}
    </div>
  );
};

export default ActiveSessions;

interface ActiveSessionDetailViewProps {
  session: BackendSession;
  isCompleting: boolean;
  onComplete: (assessmentScores?: Record<number, Record<string, number>>, activities?: SessionActivity[]) => void;
  onManageActivities: () => void;
  onBack: () => void;
  refreshKey: number;
  refreshSessions: () => Promise<void>;
}

const ActiveSessionDetailView: React.FC<ActiveSessionDetailViewProps> = ({
  session,
  isCompleting,
  onComplete,
  onManageActivities,
  onBack,
  refreshKey,
  refreshSessions
}) => {
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingActivityId, setCompletingActivityId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<number>>(new Set());
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  // Assessment session state
  const [selectedAssessmentActivity, setSelectedAssessmentActivity] = useState<SessionActivity | null>(null);
  const [assessmentScores, setAssessmentScores] = useState<Record<number, Record<string, number>>>({});

  // Activity notes state
  const [activityNotesModalOpen, setActivityNotesModalOpen] = useState(false);
  const [selectedActivityForNotes, setSelectedActivityForNotes] = useState<SessionActivity | null>(null);
  const [activityNote, setActivityNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Hardcoded assessment items (ISAA, INDT, Clinical Snapshots)
  const assessmentItems = useMemo((): Record<number, { name: string; toolId: string; items: string[] }> => ({
    1: { // ISAA
      name: 'ISAA (Indian Scale for Assessment of Autism)',
      toolId: 'isaa',
      items: [
        "Makes eye contact during interaction", "Responds to name being called", "Smiles back when smiled at",
        "Shows interest in other children", "Shares toys or objects with others", "Participates in group activities",
        "Understands social cues and gestures", "Takes turns in conversation", "Shows empathy or concern for others",
        "Engages in pretend play with others", "Uses single words to communicate", "Combines words into simple sentences",
        "Uses gestures to communicate needs", "Follows simple instructions", "Asks questions appropriately",
        "Describes daily activities", "Uses appropriate tone of voice", "Maintains topic in conversation",
        "Understands jokes and sarcasm", "Uses language for social purposes", "Follows routines and schedules",
        "Handles transitions between activities", "Shows flexibility in thinking", "Accepts changes in environment",
        "Manages frustration appropriately", "Controls impulses and emotions", "Waits for turn in activities",
        "Follows classroom rules", "Adapts to new situations", "Shows self-control in challenging situations",
        "Responds appropriately to sensory input", "Tolerates different textures", "Handles loud noises without distress",
        "Adapts to different lighting conditions", "Processes sensory information accurately", "Uses fine motor skills for writing/drawing",
        "Demonstrates gross motor coordination", "Maintains balance during movement", "Coordinates both sides of body",
        "Uses motor skills for daily activities"
      ]
    },
    10: { // INDT
      name: 'INDT-ADHD (Indian Scale for ADHD)',
      toolId: 'indt-adhd',
      items: [
        "Has difficulty sustaining attention in tasks", "Often leaves seat when expected to remain seated",
        "Runs about or climbs excessively in inappropriate situations", "Has difficulty playing quietly",
        "Is often 'on the go' as if driven by a motor", "Talks excessively",
        "Blurts out answers before questions are completed", "Has difficulty awaiting turn",
        "Interrupts or intrudes on others", "Often loses things necessary for tasks",
        "Engages in dangerous activities without considering consequences", "Has difficulty organizing tasks and activities",
        "Avoids tasks requiring sustained mental effort", "Is easily distracted by extraneous stimuli",
        "Is forgetful in daily activities"
      ]
    },
    11: { // Clinical Snapshots
      name: 'Clinical Snapshots',
      toolId: 'clinical-snapshots',
      items: [
        "Maintains eye contact during interaction", "Responds to social overtures from others",
        "Initiates social interactions appropriately", "Uses nonverbal communication effectively",
        "Demonstrates appropriate facial expressions", "Shows awareness of personal space",
        "Engages in reciprocal conversation", "Demonstrates theory of mind skills",
        "Shows interest in peer activities", "Adapts behavior based on social context",
        "Demonstrates self-awareness", "Shows appropriate emotional responses",
        "Uses communication for various purposes", "Demonstrates problem-solving skills",
        "Shows independence in daily activities"
      ]
    }
  }), []);

  // Session timer - counts elapsed time from session start
  useEffect(() => {
    const startTime = new Date(`${session.session_date}T${session.start_time}`).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setSessionElapsedSeconds(elapsed > 0 ? elapsed : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session.session_date, session.start_time]);

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      const response = await fetch(`http://localhost:8000/api/sessions/${session.id}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load session activities.');
      }

      const data: SessionActivity[] = await response.json();
      setActivities(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load session activities.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities, refreshKey]);

  useEffect(() => {
    if (successMessage) {
      const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [successMessage]);

  const handleMarkActivityCompleted = async (activity: SessionActivity) => {
    const activityId = activity.activity_id;
    if (!activityId) {
      setError('Activity ID not found');
      return;
    }

    // Check if already completed
    if (completedActivityIds.has(activity.id)) {
      setError('Activity already marked as completed');
      return;
    }

    setCompletingActivityId(activity.id);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      // Calculate activity duration based on session flow
      let activityDurationMinutes = 0;

      // Get session planned duration
      const sessionDurationMinutes = getSessionDurationMinutes(session);
      const sessionStart = new Date(`${session.session_date}T${session.start_time}`).getTime();
      const now = Date.now();

      // Calculate total duration of all completed activities
      let totalCompletedDuration = 0;
      for (const act of activities) {
        if (act.id !== activity.id && act.actual_duration && act.actual_duration > 0) {
          totalCompletedDuration += act.actual_duration;
        }
      }

      // Calculate remaining time for current activity
      const remainingSessionMinutes = sessionDurationMinutes - totalCompletedDuration;

      const currentIndex = activities.findIndex(a => a.id === activity.id);

      if (currentIndex === 0) {
        // First activity - calculate from session start time
        activityDurationMinutes = Math.round((now - sessionStart) / 60000);
      } else {
        // Find the last completed activity before this one
        let previousCompletedIndex = -1;
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (activities[i].actual_duration && activities[i].actual_duration > 0) {
            previousCompletedIndex = i;
            break;
          }
        }

        if (previousCompletedIndex >= 0) {
          // Calculate from end of previous activity
          const elapsedSinceStart = Math.round((now - sessionStart) / 60000);
          activityDurationMinutes = elapsedSinceStart - totalCompletedDuration;
        } else {
          // No previous completed activities, calculate from session start
          activityDurationMinutes = Math.round((now - sessionStart) / 60000);
        }
      }

      // Ensure minimum 1 minute and don't exceed session duration
      activityDurationMinutes = Math.max(1, Math.min(activityDurationMinutes, remainingSessionMinutes));

      // Check if session time is exceeded
      const willExceedSession = (totalCompletedDuration + activityDurationMinutes) >= sessionDurationMinutes;

      // Update the session activity with actual duration
      const updateResponse = await fetch(
        `http://localhost:8000/api/sessions/${session.id}/activities/${activity.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            actual_duration: activityDurationMinutes
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to update activity duration');
      }

      // Mark the goal as completed in child_goals table
      const completeResponse = await fetch(
        `http://localhost:8000/api/students/${session.child_id}/activities/${activityId}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to mark activity as completed');
      }

      await completeResponse.json();

      // Mark as completed in local state
      setCompletedActivityIds(prev => new Set(prev).add(activity.id));
      setSuccessMessage(`Marked "${activity.activity_name}" as completed! (${activityDurationMinutes} min)`);

      // Refresh activities list
      await loadActivities();

      // Trigger global refresh for session counters
      window.dispatchEvent(new CustomEvent('scheduleChanged'));

      // Check if session should be auto-completed
      if (willExceedSession) {
        // Auto-complete the session
        const completedCount = activities.filter(a => a.current_status === 'completed' || completedActivityIds.has(a.id)).length + 1;
        const sessionSummary = `Session completed! Activities: ${completedCount}/${activities.length}. Duration: ${totalCompletedDuration + activityDurationMinutes}/${sessionDurationMinutes} min.`;

        try {
          const completeSessionResponse = await fetch(
            `http://localhost:8000/api/sessions/${session.id}/complete`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (completeSessionResponse.ok) {
            setSuccessMessage(sessionSummary);
            // Refresh to show completed status
            await refreshSessions();
            // Give user time to see the message before navigating away
            setTimeout(() => {
              onBack();
            }, 3000);
          }
        } catch (sessionErr) {
          console.error('Failed to auto-complete session:', sessionErr);
          setSuccessMessage(`Activity completed. ${sessionSummary} (Note: Session status not updated)`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark activity as completed';
      setError(message);
    } finally {
      setCompletingActivityId(null);
    }
  };

  // Handle storing scores for a single assessment activity
  const handleActivityScoresComplete = (activityId: number, scores: Record<string, number>) => {
    setAssessmentScores(prev => ({
      ...prev,
      [activityId]: scores
    }));

    // Mark this activity as completed
    setCompletedActivityIds(prev => new Set([...prev, activityId]));
    setSelectedAssessmentActivity(null);
    setSuccessMessage(`Assessment scores saved for ${selectedAssessmentActivity?.activity_name || 'activity'}`);

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleOpenActivityNotes = (activity: SessionActivity) => {
    setSelectedActivityForNotes(activity);
    setActivityNote(activity.performance_notes || '');
    setActivityNotesModalOpen(true);
  };

  const handleSaveActivityNote = async () => {
    if (!selectedActivityForNotes) return;

    setSavingNote(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      // Update the session activity with performance notes
      const updateResponse = await fetch(
        `http://localhost:8000/api/sessions/${session.id}/activities/${selectedActivityForNotes.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            performance_notes: activityNote.trim() || null
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to save activity notes');
      }

      setSuccessMessage(`Notes saved for "${selectedActivityForNotes.activity_name}"`);

      // Refresh activities list
      await loadActivities();

      // Close modal
      setActivityNotesModalOpen(false);
      setSelectedActivityForNotes(null);
      setActivityNote('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save activity notes';
      setError(message);
    } finally {
      setSavingNote(false);
    }
  }; const statusLabel = statusDisplayLabel(session.status);
  const plannedActivities = session.total_planned_activities ?? 0;
  const completedActivities = session.completed_activities ?? 0;
  const isAssessment = isAssessmentSession(activities);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Row with Back Button and Action Buttons */}
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void loadActivities()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onManageActivities}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/60 px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-100 dark:border-violet-800/70 dark:bg-violet-900/30 dark:text-violet-200"
          >
            Manage Activities
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onComplete(assessmentScores, activities)}
            disabled={isCompleting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCompleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Mark Completed
          </motion.button>
        </div>
      </div>

      {/* Page Title Section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500/80">Active Session</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          {session.student_name || 'Unknown Learner'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {statusLabel} • {formatDateForDisplay(session.session_date, { weekday: 'long', month: 'short', day: 'numeric' })} at {formatTimeForDisplay(session.start_time)}
        </p>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200"
        >
          <CheckCircle className="h-4 w-4" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Schedule and Duration Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-600 dark:text-violet-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Schedule</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {formatDateForDisplay(session.session_date, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatTimeForDisplay(session.start_time)} – {formatTimeForDisplay(session.end_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3 text-blue-600 dark:text-blue-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Session Timer</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatElapsedTime(sessionElapsedSeconds)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {completedActivities} of {plannedActivities} activities completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Notes (if any) */}
      {session.therapist_notes && (
        <div className="rounded-2xl border border-slate-200/70 bg-amber-50/80 px-5 py-4 shadow-sm dark:border-amber-800/70 dark:bg-amber-900/25">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/20 p-3 text-amber-600 dark:text-amber-300">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">Therapist Notes</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-100">
                {session.therapist_notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Activities Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assigned Activities</h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
            <Target className="h-3.5 w-3.5" />
            {activities.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200/70 bg-white py-12 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading activities…
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-8 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400">
            <AlertTriangle className="h-5 w-5" />
            <span>No activities have been added to this session yet.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const activityName = activity.activity_name || 'Activity';
              const activityDomain = activity.domain;
              const estimatedDuration = activity.estimated_duration;
              const isCompleting = completingActivityId === activity.id;
              const isCompleted = completedActivityIds.has(activity.id) || activity.current_status === 'completed';

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative overflow-hidden rounded-xl border px-4 py-4 shadow-sm transition ${isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20'
                    : 'border-slate-200/70 bg-white hover:border-violet-200 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/70'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <div className="rounded-full bg-emerald-500 p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <h3 className={`text-base font-semibold ${isCompleted ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'}`}>
                          {activityName}
                        </h3>
                        {activityDomain && (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                            {activityDomain}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Planned: {estimatedDuration ?? 30} mins
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Actual: {activity.actual_duration} mins
                          </span>
                        )}
                      </div>
                      {activity.performance_notes && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Notes:</span> {activity.performance_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Activity Notes Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenActivityNotes(activity)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 shadow-sm transition"
                        title="Add or edit activity notes"
                      >
                        <FileText className="h-4 w-4" />
                        {activity.performance_notes ? 'Edit Note' : 'Add Note'}
                      </motion.button>

                      {/* Complete/Score Button */}
                      {!isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (isAssessment && activity.activity_id) {
                              // Open single-activity assessment modal for this activity
                              setSelectedAssessmentActivity(activity);
                            } else {
                              // Regular activity - mark as completed
                              void handleMarkActivityCompleted(activity);
                            }
                          }}
                          disabled={isCompleting}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${isAssessment
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                            }`}
                        >
                          {isCompleting ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              {isAssessment ? 'Saving...' : 'Marking...'}
                            </>
                          ) : isAssessment ? (
                            <>
                              <ClipboardList className="h-4 w-4" />
                              Score Items
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Mark Complete
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          {isAssessment
            ? 'Click "Score Items" on each assessment to enter scores for that specific tool.'
            : 'Mark activities as complete during the session to keep accurate progress records.'}
        </p>
      </div>

      {/* Single Activity Assessment Modal */}
      {selectedAssessmentActivity && selectedAssessmentActivity.activity_id && assessmentItems[selectedAssessmentActivity.activity_id] && (
        <SingleActivityAssessmentModal
          isOpen={true}
          activityId={selectedAssessmentActivity.activity_id}
          activityName={assessmentItems[selectedAssessmentActivity.activity_id].name}
          toolId={assessmentItems[selectedAssessmentActivity.activity_id].toolId}
          items={assessmentItems[selectedAssessmentActivity.activity_id].items}
          onClose={() => setSelectedAssessmentActivity(null)}
          onComplete={(scores) => handleActivityScoresComplete(selectedAssessmentActivity.id, scores)}
          existingScores={assessmentScores[selectedAssessmentActivity.id]}
        />
      )}

      {/* Activity Notes Modal */}
      {activityNotesModalOpen && selectedActivityForNotes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Activity Notes
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedActivityForNotes.activity_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActivityNotesModalOpen(false);
                    setSelectedActivityForNotes(null);
                    setActivityNote('');
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Performance Notes (Optional)
                </label>
                <textarea
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 dark:text-white resize-none"
                  placeholder="Add observations about the learner's performance during this activity, engagement level, challenges faced, or any notable achievements..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  These notes will help track progress and inform future session planning.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActivityNotesModalOpen(false);
                    setSelectedActivityForNotes(null);
                    setActivityNote('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveActivityNote}
                  disabled={savingNote}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingNote ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    'Save Notes'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
