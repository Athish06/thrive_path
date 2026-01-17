import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import AnalogClock from '../ui/AnalogClock';
import { formatTimeToAMPM } from '../../utils/sessionScheduling';

interface SessionSummary {
  id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  student_name?: string;
}

interface ExistingSession {
  id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  student_name?: string;
}

interface TimeConflict {
  type: 'none' | 'session-conflict';
  message: string;
  severity: 'none' | 'error';
  conflictingSession?: ExistingSession;
}

interface SessionRescheduleModalProps {
  open: boolean;
  session: SessionSummary | null;
  onClose: () => void;
  onConfirm: (payload: { date: string; time: string }) => Promise<void> | void;
  isSubmitting?: boolean;
  existingSessions?: ExistingSession[];
}

const sanitizeTime = (time: string) => {
  if (!time) return '00:00';
  return time.length >= 5 ? time.slice(0, 5) : time;
};

const getDurationMinutes = (start: string, end: string) => {
  if (!start || !end) return 60;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startDate = new Date();
  const endDate = new Date();
  startDate.setHours(startH, startM, 0, 0);
  endDate.setHours(endH, endM, 0, 0);
  const diff = (endDate.getTime() - startDate.getTime()) / 60000;
  return diff > 0 ? diff : 60;
};

const deriveEndTime = (startTime: string, durationMinutes: number): string => {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  startDate.setMinutes(startDate.getMinutes() + durationMinutes);
  return `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
};

export const SessionRescheduleModal: React.FC<SessionRescheduleModalProps> = ({
  open,
  session,
  onClose,
  onConfirm,
  isSubmitting = false,
  existingSessions = []
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showFreeSlotsModal, setShowFreeSlotsModal] = useState(false);

  useEffect(() => {
    if (open && session) {
      setSelectedDate(session.session_date);
      setSelectedTime(sanitizeTime(session.start_time));
    }
  }, [open, session?.id]);

  const durationMinutes = session ? getDurationMinutes(session.start_time, session.end_time) : 60;
  const newEndTime = selectedTime ? deriveEndTime(selectedTime, durationMinutes) : '';
  const formattedTime = selectedTime ? formatTimeToAMPM(selectedTime) : '';

  // Check for time conflicts
  const timeConflict: TimeConflict = useMemo(() => {
    if (!selectedDate || !selectedTime || !session) {
      return { type: 'none', message: '', severity: 'none' };
    }

    const conflictingSession = existingSessions.find((s) => {
      if (s.id === session.id) return false;
      if (s.session_date !== selectedDate) return false;
      if (s.status === 'cancelled') return false;

      const existingStart = s.start_time;
      const existingEnd = s.end_time;
      const hasOverlap = selectedTime < existingEnd && newEndTime > existingStart;
      return hasOverlap;
    });

    if (conflictingSession) {
      return {
        type: 'session-conflict',
        message: `This time overlaps with ${conflictingSession.student_name || 'another session'}'s session from ${formatTimeToAMPM(conflictingSession.start_time)} to ${formatTimeToAMPM(conflictingSession.end_time)}.`,
        severity: 'error',
        conflictingSession
      };
    }

    return { type: 'none', message: '', severity: 'none' };
  }, [selectedDate, selectedTime, newEndTime, session, existingSessions]);

  // Calculate free slots
  const freeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const daysSessions = existingSessions.filter(
      (s) => s.session_date === selectedDate && s.status !== 'cancelled' && s.id !== session?.id
    );

    const slots: string[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const slotEnd = deriveEndTime(time, durationMinutes);

        const hasConflict = daysSessions.some((s) => {
          return time < s.end_time && slotEnd > s.start_time;
        });

        if (!hasConflict) {
          slots.push(time);
        }
      }
    }

    return slots;
  }, [selectedDate, existingSessions, session?.id, durationMinutes]);

  if (!open || !session) {
    return null;
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || isSubmitting || timeConflict.severity === 'error') {
      return;
    }
    onConfirm({ date: selectedDate, time: selectedTime });
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex-shrink-0 p-8 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reschedule Session</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Update the session timing for {session.student_name || 'this learner'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close reschedule modal"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Session Date
              </label>
              <CustomDatePicker value={selectedDate} onChange={setSelectedDate} placeholder="Select new date" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                New Session Time
              </label>
              <div className="flex justify-center">
                <AnalogClock value={selectedTime} onChange={setSelectedTime} size={240} className="max-w-fit" />
              </div>
            </div>

            {/* Find Free Session Button */}
            {selectedDate && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowFreeSlotsModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Find Free Slots
                </button>
              </div>
            )}

            {/* Time Conflict Warning */}
            {timeConflict.type !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Session Time Conflict
                    </p>
                    <p className="text-sm mt-1 text-red-700 dark:text-red-300">
                      {timeConflict.message}
                    </p>
                    <button
                      onClick={() => setShowFreeSlotsModal(true)}
                      className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline font-medium"
                    >
                      View available time slots →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Current schedule</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">
                  {session.session_date} • {formatTimeToAMPM(sanitizeTime(session.start_time))}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${timeConflict.severity === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200/40 dark:border-red-700/40'
                : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200/40 dark:border-violet-700/40'
                }`}>
                <div className={`flex items-center gap-2 text-sm ${timeConflict.severity === 'error'
                  ? 'text-red-700 dark:text-red-200'
                  : 'text-violet-700 dark:text-violet-200'
                  }`}>
                  <Clock className="h-4 w-4" />
                  <span>New schedule</span>
                </div>
                <p className={`mt-2 text-sm font-semibold ${timeConflict.severity === 'error'
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-violet-900 dark:text-violet-100'
                  }`}>
                  {selectedDate || 'Select a date'} • {formattedTime || 'Select a time'}
                </p>
                <p className={`mt-1 text-xs ${timeConflict.severity === 'error'
                  ? 'text-red-600/80 dark:text-red-200/70'
                  : 'text-violet-600/80 dark:text-violet-200/70'
                  }`}>
                  Duration: {durationMinutes} min
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 px-8 py-6 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isSubmitting || timeConflict.severity === 'error'}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl transition-all"
            >
              {isSubmitting ? 'Rescheduling...' : 'Confirm Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Free Slots Modal */}
      {showFreeSlotsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
          onClick={() => setShowFreeSlotsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      Available Time Slots
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Free slots for {selectedDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFreeSlotsModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {freeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {freeSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setShowFreeSlotsModal(false);
                      }}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600 text-center group"
                    >
                      <div className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300">
                        {formatTimeToAMPM(slot)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No available time slots found for this date.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default SessionRescheduleModal;

