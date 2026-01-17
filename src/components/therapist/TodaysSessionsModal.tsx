import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { X, Clock, User, Play, AlertCircle, RefreshCw } from 'lucide-react';

interface TodaysSessionsModalProps {
  onClose: () => void;
}

export const TodaysSessionsModal: React.FC<TodaysSessionsModalProps> = ({ onClose }) => {
  const {
    todaysSessions,
    littleLearners,
    sessionsLoading,
    sessionsError,
    refreshTodaysSessions
  } = useData();

  const navigate = useNavigate();

  useEffect(() => {
    refreshTodaysSessions().catch(() => {
      /* errors are surfaced via sessionsError state */
    });
  }, [refreshTodaysSessions]);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  const sessionsForToday = useMemo(() => {
    const list = todaysSessions ?? [];
    return list.filter(session => session.session_date === todayKey);
  }, [todaysSessions, todayKey]);

  const formatTime = (time?: string | null) => {
    if (!time) return 'Time TBD';
    const [hour = '0', minute = '00'] = time.split(':');
    const hourNum = Number.parseInt(hour, 10);
    if (Number.isNaN(hourNum)) return time;
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
  };

  const handleRefresh = () => {
    refreshTodaysSessions().catch(() => {
      /* handled via sessionsError */
    });
  };

  const handleOpenSession = (sessionId: number) => {
    navigate(`/session-planning/${sessionId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Today's Sessions</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={sessionsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Refresh today's sessions"
            >
              <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-300"
              aria-label="Close today's sessions"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-100">Need a deeper dive?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200/80">
                  Open each learner’s plan to review goals, medical details, and previous assessment highlights.
                </p>
              </div>
            </div>
          </div>

          {sessionsError && !sessionsLoading ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
              <p className="mb-3 text-sm font-semibold text-red-700 dark:text-red-200">
                We couldn’t load today’s sessions.
              </p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : null}

          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Syncing today’s schedule…</p>
            </div>
          ) : sessionsForToday.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-slate-500" />
              <p className="text-lg text-gray-600 dark:text-slate-300">No sessions scheduled for today</p>
              <p className="text-sm text-gray-500 dark:text-slate-500">Enjoy your day off!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionsForToday.map((session) => {
                const learner = littleLearners.find(
                  (l) => l.id === session.child_id?.toString()
                );
                const learnerName = learner?.name ?? session.student_name ?? 'Learner unavailable';
                const therapistName = session.therapist_name ?? '';
                const activitiesPlanned = session.total_planned_activities ?? 0;

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-900 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {learner?.photo ? (
                        <img
                          src={learner.photo}
                          alt={learnerName}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-800"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 dark:bg-slate-700">
                          <User className="h-6 w-6 text-gray-600 dark:text-slate-300" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{learnerName}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(session.start_time)}</span>
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                              session.status === 'planned'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                                : session.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            }`}
                          >
                            {session.status.replace('_', ' ')}
                          </span>
                          {learner?.age ? (
                            <span className="text-xs text-gray-500 dark:text-slate-500">Age {learner.age}</span>
                          ) : null}
                          {therapistName ? (
                            <span className="text-xs text-gray-500 dark:text-slate-500">Therapist: {therapistName}</span>
                          ) : null}
                          {activitiesPlanned > 0 ? (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {activitiesPlanned} planned activit{activitiesPlanned === 1 ? 'y' : 'ies'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenSession(session.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4" />
                      <span>Open Session Plan</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};