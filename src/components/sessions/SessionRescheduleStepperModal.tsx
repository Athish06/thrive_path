import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, MoveRight, PencilLine, Repeat, ShieldAlert, Sparkles, X } from 'lucide-react';
import Stepper, { Step } from '../ui/Stepper';
import type { CascadeRescheduleResponse, SessionRescheduleDetail } from '../../utils/sessionActions';
import { formatTimeToAMPM } from '../../utils/sessionScheduling';

interface SessionRescheduleStepperModalProps {
  open: boolean;
  detail: SessionRescheduleDetail | null;
  onClose: () => void;
  onManualReschedule: () => void;
  onCascadeConfirm: (includeWeekends: boolean) => Promise<CascadeRescheduleResponse>;
  onManualRescheduleSession: (sessionId: number) => void;
  isCascadeSubmitting?: boolean;
}

type RescheduleMode = 'manual' | 'cascade';

const defaultSessionName = 'this learner';

const formatDate = (isoDate?: string) => {
  if (!isoDate) {
    return 'Unknown date';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const sanitizeTime = (value?: string | null) => {
  if (!value) {
    return '--:--';
  }
  return value.length >= 5 ? value.slice(0, 5) : value;
};

export const SessionRescheduleStepperModal: React.FC<SessionRescheduleStepperModalProps> = ({
  open,
  detail,
  onClose,
  onManualReschedule,
  onCascadeConfirm,
  onManualRescheduleSession,
  isCascadeSubmitting = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<RescheduleMode | null>(null);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<CascadeRescheduleResponse | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setSelectedMode(null);
      setIncludeWeekends(false);
      setCascadeResult(null);
    }
  }, [open, detail?.session?.id]);

  useEffect(() => {
    if (cascadeResult) {
      setCurrentStep(4);
    }
  }, [cascadeResult]);

  const upcomingSessions = useMemo(() => {
    const sessions = detail?.upcoming?.sessions ?? [];
    if (!sessions.length) {
      return [];
    }
    // Sort by date/time for consistent display
    return [...sessions].sort((a, b) => {
      const aKey = `${a.session_date} ${a.start_time}`;
      const bKey = `${b.session_date} ${b.start_time}`;
      return aKey.localeCompare(bKey);
    });
  }, [detail?.upcoming?.sessions]);

  const selectedSession = detail?.session;
  const learnerName = selectedSession?.student_name || defaultSessionName;

  const primaryButtonDisabled = useMemo(() => {
    if (currentStep === 1) {
      return false;
    }
    if (currentStep === 2) {
      return !selectedMode;
    }
    if (currentStep === 3) {
      if (selectedMode !== 'cascade') {
        return true;
      }
      return !!isCascadeSubmitting;
    }

    if (currentStep === 4) {
      return false;
    }
    return false;
  }, [currentStep, isCascadeSubmitting, selectedMode]);

  const primaryButtonLabel = useMemo(() => {
    if (currentStep === 1) {
      return 'Continue';
    }
    if (currentStep === 2) {
      if (selectedMode === 'manual') {
        return 'Open manual reschedule';
      }
      if (selectedMode === 'cascade') {
        return 'Continue';
      }
      return 'Select an option';
    }
    if (currentStep === 3) {
      return isCascadeSubmitting ? 'Rescheduling...' : 'Confirm cascade reschedule';
    }

    if (currentStep === 4) {
      return 'Done';
    }
    return 'Continue';
  }, [currentStep, isCascadeSubmitting, selectedMode]);

  const handlePrimaryAction = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!selectedMode) {
        return;
      }

      if (selectedMode === 'manual') {
        onManualReschedule();
        onClose();
        return;
      }

      setCurrentStep(3);
      return;
    }

    if (currentStep === 3 && selectedMode === 'cascade') {
      try {
        const result = await onCascadeConfirm(includeWeekends);
        setCascadeResult(result);
      } catch (error) {
        // Parent handles error feedback; keep user on current step.
      }
      return;
    }

    if (currentStep === 4) {
      onClose();
      return;
    }
  };

  const handleBack = () => {
    if (isCascadeSubmitting) {
      return;
    }
    if (currentStep === 1) {
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(2);
      return;
    }
    setCurrentStep((previous) => Math.max(previous - 1, 1));
  };

  const handleStepChange = (nextStep: number) => {
    setCurrentStep((previous) => {
      const maxStep = cascadeResult ? 4 : 3;
      const clampedTarget = Math.min(Math.max(nextStep, 1), maxStep);

      if (clampedTarget < previous) {
        return clampedTarget;
      }

      if (clampedTarget === previous) {
        return previous;
      }

      if (previous === 1 && clampedTarget === 2) {
        return 2;
      }

      if (previous === 2 && clampedTarget === 3 && selectedMode === 'cascade') {
        return 3;
      }

      if (previous === 3 && clampedTarget === 4 && cascadeResult) {
        return 4;
      }

      return previous;
    });
  };

  const renderModeCard = (
    mode: RescheduleMode,
    title: string,
    description: string,
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    const isSelected = selectedMode === mode;
    return (
      <button
        type="button"
        className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:border-violet-400 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${isSelected
            ? 'border-violet-500 bg-violet-50/70 text-violet-900 shadow-md dark:bg-violet-900/20 dark:border-violet-400 dark:text-violet-100'
            : 'border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-800'
          }`}
        onClick={() => setSelectedMode(mode)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-lg font-semibold ${isSelected
                ? 'border-violet-500 bg-violet-500 text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-800 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  const footerRenderer = () => {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <button
          type="button"
          onClick={onClose}
          disabled={isCascadeSubmitting}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isCascadeSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => void handlePrimaryAction()}
            disabled={primaryButtonDisabled}
            className={`rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ${currentStep === 3 && selectedMode === 'cascade'
                ? 'min-w-[11rem]'
                : 'min-w-[9rem]'
              }`}
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderStepContent = () => (
    <Stepper
      currentStep={currentStep}
      onStepChange={handleStepChange}
      disabled={primaryButtonDisabled}
      renderFooter={footerRenderer}
    >
      <Step>
        <div className="flex h-full flex-col gap-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">This session needs attention before starting</h3>
                <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-200/90">
                  {detail?.message || 'Session timing must be corrected before you can begin.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Current session</p>
                <p className="text-base font-semibold text-slate-800 dark:text-white">
                  {learnerName} • {formatDate(selectedSession?.session_date)} • {formatTimeToAMPM(sanitizeTime(selectedSession?.start_time))}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 text-sm text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Why action is required:</p>
              <p className="leading-relaxed">{detail?.message || 'The session timing is invalid. Please reschedule to continue.'}</p>
            </div>
          </div>

          {upcomingSessions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Upcoming sessions that may shift
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {upcomingSessions.slice(0, 4).map((session) => (
                  <li key={session.id} className="flex items-center justify-between rounded-lg border border-slate-100/60 bg-slate-50/60 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/40">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{session.student_name || 'Learner'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(session.session_date)} • {formatTimeToAMPM(sanitizeTime(session.start_time))}
                    </span>
                  </li>
                ))}
              </ul>
              {detail?.upcoming && detail.upcoming.count > upcomingSessions.length && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  + {detail.upcoming.count - upcomingSessions.length} more scheduled session(s)
                </p>
              )}
            </div>
          )}
        </div>
      </Step>

      <Step>
        <div className="flex h-full flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/90">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Choose how you want to resolve this</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You can update just this session manually or shift all remaining sessions by one day.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderModeCard(
              'manual',
              'Manual reschedule',
              'Open the scheduling modal to pick a new start and end time for this session only.',
              AlertTriangle
            )}
            {renderModeCard(
              'cascade',
              'Cascade reschedule',
              'Automatically push this and all upcoming scheduled sessions forward by one day.',
              Repeat
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 via-violet-50 to-blue-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-100">Tip</p>
                <p className="leading-relaxed">
                  Cascade rescheduling keeps each session duration and time the same, just moves dates forward. You can include weekends in the cascade on the next step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Step>

      <Step>
        <div className="flex h-full flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/90">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Cascade rescheduling preview</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              We will shift {detail?.upcoming?.count ?? upcomingSessions.length} upcoming session(s) forward by one day. Confirm the settings below before applying.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                Include weekends when shifting?
              </span>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => !isCascadeSubmitting && setIncludeWeekends(false)}
                  disabled={isCascadeSubmitting}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${!includeWeekends
                      ? 'bg-violet-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                  Skip Weekends
                </button>
                <button
                  type="button"
                  onClick={() => !isCascadeSubmitting && setIncludeWeekends(true)}
                  disabled={isCascadeSubmitting}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${includeWeekends
                      ? 'bg-violet-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                  Include Weekends
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {includeWeekends
                ? 'Sessions can be scheduled on any day, including Saturday and Sunday.'
                : 'Sessions falling on Saturday or Sunday will roll forward to the next Monday.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <MoveRight className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sessions that will move</p>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No upcoming sessions found for this learner.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {upcomingSessions.slice(0, 5).map((session, index) => (
                  <li key={session.id} className="flex items-center justify-between rounded-lg border border-slate-100/60 bg-gradient-to-r from-slate-50 to-violet-50/30 px-3 py-2.5 dark:border-slate-700/70 dark:from-slate-900/40 dark:to-violet-900/20">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{session.student_name || 'Learner'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTimeToAMPM(sanitizeTime(session.start_time))} - {formatTimeToAMPM(sanitizeTime(session.end_time))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {formatDate(session.session_date)}
                      </span>
                      <MoveRight className="h-4 w-4 text-violet-500" />
                      <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-1 rounded font-medium">
                        +{index === 0 ? 1 : 1}+ day{index === 0 ? '' : 's'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {upcomingSessions.length > 5 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                + {upcomingSessions.length - 5} additional session(s)
              </p>
            )}
          </div>
        </div>
      </Step>

      {cascadeResult && (
        <Step>
          <div className="flex h-full flex-col gap-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-900/30">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Cascade reschedule completed</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-200/90">
                All selected sessions were shifted forward. Review the updated schedule below.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Updated sessions ({cascadeResult.total_updated})
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {cascadeResult.sessions.map((session) => (
                  <li
                    key={session.session_id}
                    className="flex flex-col rounded-lg border border-slate-100/60 bg-slate-50/60 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/40"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {session.student_name || 'Learner'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(session.previous_date)} • {formatTimeToAMPM(sanitizeTime(session.start_time))} - {formatTimeToAMPM(sanitizeTime(session.end_time))}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      → {formatDate(session.new_date)} • {formatTimeToAMPM(sanitizeTime(session.start_time))} - {formatTimeToAMPM(sanitizeTime(session.end_time))}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onManualRescheduleSession(session.session_id)}
                        className="inline-flex items-center gap-2 rounded-md border border-violet-500 px-3 py-1 text-xs font-semibold text-violet-600 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-white dark:border-violet-400 dark:text-violet-200 dark:hover:bg-violet-500/10 dark:focus:ring-offset-slate-900"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        Adjust manually
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                {cascadeResult.include_weekends
                  ? 'Weekend dates were included in this shift.'
                  : 'Weekend dates were skipped during this shift.'}
              </p>
            </div>
          </div>
        </Step>
      )}
    </Stepper>
  );

  if (!open || !detail) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (!isCascadeSubmitting) {
              onClose();
            }
          }}
        >
          <motion.div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Session needs rescheduling</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {learnerName} • {formatDate(selectedSession?.session_date)} at {formatTimeToAMPM(sanitizeTime(selectedSession?.start_time))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCascadeSubmitting) {
                    onClose();
                  }
                }}
                disabled={isCascadeSubmitting}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {renderStepContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SessionRescheduleStepperModal;
