import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Repeat, X, Clock, User } from 'lucide-react';

interface RescheduleTypeModalProps {
    open: boolean;
    onClose: () => void;
    onManualReschedule: () => void;
    onCascadeReschedule: () => void;
    sessionInfo?: {
        studentName?: string;
        sessionDate?: string;
        startTime?: string;
        endTime?: string;
    };
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return timeStr;
    }
};

export const RescheduleTypeModal: React.FC<RescheduleTypeModalProps> = ({
    open,
    onClose,
    onManualReschedule,
    onCascadeReschedule,
    sessionInfo
}) => {
    if (!open) return null;

    const content = (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="reschedule-type-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Reschedule Session
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Session Info */}
                        {sessionInfo && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {sessionInfo.studentName || 'Learner'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>{formatDate(sessionInfo.sessionDate)}</span>
                                            <Clock className="h-3.5 w-3.5 ml-1" />
                                            <span>
                                                {formatTime(sessionInfo.startTime)} - {formatTime(sessionInfo.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        <div className="p-6 space-y-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                How would you like to reschedule this session?
                            </p>

                            {/* Manual Reschedule Option */}
                            <button
                                onClick={onManualReschedule}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                    <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Manual Reschedule
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Pick a specific date and time for this session
                                    </p>
                                </div>
                            </button>

                            {/* Cascade Reschedule Option */}
                            <button
                                onClick={onCascadeReschedule}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                                    <Repeat className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Cascade Reschedule
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Push this and all following sessions forward by one day
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};

export default RescheduleTypeModal;
