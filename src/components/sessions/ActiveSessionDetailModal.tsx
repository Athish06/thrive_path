import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Target, ClipboardList, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { formatDateForDisplay, formatTimeForDisplay } from '../../utils/dateUtils';
import { getSessionDurationMinutes, statusDisplayLabel } from '../../utils/sessionUtils';

interface SessionActivity {
  id: number;
  child_goal_id: number;
  actual_duration: number;
  performance_notes?: string;
  child_goal?: {
    activity?: {
      activity_name: string;
      description?: string;
      domain?: string;
      estimated_duration?: number;
    };
  };
}

interface BackendSession {
  id: number;
  child_id: number;
  student_name?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_planned_activities: number;
  completed_activities: number;
  therapist_notes?: string;
}

interface ActiveSessionDetailModalProps {
  session: BackendSession;
  isCompleting: boolean;
  onComplete: () => void;
  onManageActivities: () => void;
  onClose: () => void;
}

export const ActiveSessionDetailModal: React.FC<ActiveSessionDetailModalProps> = ({
  session,
  isCompleting,
  onComplete,
  onManageActivities,
  onClose
}) => {
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Missing access token. Please log in again.');
        }

        const response = await fetch(`http://localhost:8000/api/sessions/${session.id}/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
    };

    void fetchActivities();
  }, [session.id]);

  const durationMinutes = getSessionDurationMinutes(session);
  const statusLabel = statusDisplayLabel(session.status);
  const plannedActivities = session.total_planned_activities ?? 0;
  const completedActivities = session.completed_activities ?? 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="active-session-detail"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500/80">Active Session</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {session.student_name || 'Unknown Learner'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {statusLabel} • {formatDateForDisplay(session.session_date, { weekday: 'long', month: 'short', day: 'numeric' })} at {formatTimeForDisplay(session.start_time)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200/50 bg-white/80 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close active session details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/50 px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-violet-500/15 p-3 text-violet-600 dark:text-violet-300">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Schedule</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {formatDateForDisplay(session.session_date, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeForDisplay(session.start_time)} – {formatTimeForDisplay(session.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/50 px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-500/15 p-3 text-blue-600 dark:text-blue-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{durationMinutes} minutes</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {completedActivities} of {plannedActivities} activities completed
                    </p>
                  </div>
                </div>
              </div>

              {session.therapist_notes && (
                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/50 px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-300">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Therapist Notes</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {session.therapist_notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Assigned Activities
                </h3>
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <Target className="h-3.5 w-3.5" />
                  {activities.length} total
                </span>
              </div>

              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200/70 dark:border-slate-800/70 py-8 text-sm text-slate-500 dark:text-slate-400">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading activities...
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-3 rounded-xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 dark:border-rose-800/70 dark:bg-rose-900/20 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-400">
                    <AlertTriangle className="h-4 w-4" />
                    No activities have been assigned to this session yet.
                  </div>
                ) : (
                  activities.map(activity => {
                    const activityName = activity.child_goal?.activity?.activity_name || 'Activity';
                    const activityDomain = activity.child_goal?.activity?.domain;
                    const estimatedDuration = activity.child_goal?.activity?.estimated_duration;

                    return (
                      <div
                        key={activity.id}
                        className="rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
                      >
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activityName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {activityDomain && <span>Domain: {activityDomain}</span>}
                          <span>Planned: {estimatedDuration ?? 30} mins</span>
                          <span>Actual: {activity.actual_duration} mins</span>
                        </div>
                        {activity.performance_notes && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Notes: {activity.performance_notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/60 bg-slate-50/70 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Stay aligned with your session goals by reviewing activities and progress before closing the session.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onManageActivities}
                className="rounded-xl border border-violet-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-violet-600 shadow-sm transition hover:bg-violet-50 dark:border-violet-800/70 dark:bg-slate-900/80 dark:text-violet-300 dark:hover:bg-violet-900/30"
              >
                Manage Activities
              </button>
              <button
                onClick={onComplete}
                disabled={isCompleting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCompleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark Completed
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
