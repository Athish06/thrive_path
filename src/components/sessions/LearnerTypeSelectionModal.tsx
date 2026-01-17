import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, GraduationCap, Clock, BookOpen } from 'lucide-react';

export interface LearnerTypeSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: 'general' | 'temporary') => void;
}

export const LearnerTypeSelectionModal: React.FC<LearnerTypeSelectionModalProps> = ({ 
  open, 
  onClose, 
  onSelectType 
}) => {
  if (!open) return null;

  const handleTypeSelection = (type: 'general' | 'temporary') => {
    onSelectType(type);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Create Session For
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Choose the type of learners for this session
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {/* General Learners Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('general')}
                className="w-full p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-800/70 dark:group-hover:to-blue-700/70 transition-colors">
                    <GraduationCap className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                      General Learners
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                      Regular students enrolled in your therapy programs. These are learners who have completed the full enrollment process.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Full Assessment</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Regular Sessions</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>

              {/* Temporary Students Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('temporary')}
                className="w-full p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-300 dark:group-hover:from-amber-800/70 dark:group-hover:to-amber-700/70 transition-colors">
                    <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                      Temporary Students
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                      Students with prior diagnosis who are temporarily enrolled while their full assessment is pending.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Prior Diagnosis</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Interim Sessions</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                💡 <strong>Tip:</strong> You can create sessions for both types of learners. The system will show the appropriate student list based on your selection.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};