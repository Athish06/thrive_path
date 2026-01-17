import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface SingleActivityAssessmentModalProps {
  isOpen: boolean;
  activityId: number;
  activityName: string;
  toolId: string;
  items: string[];
  onClose: () => void;
  onComplete: (scores: Record<string, number>) => void;
  existingScores?: Record<string, number>;
}

export const SingleActivityAssessmentModal: React.FC<SingleActivityAssessmentModalProps> = ({
  isOpen,
  activityName,
  toolId,
  items,
  onClose,
  onComplete,
  existingScores = {}
}) => {
  const [scores, setScores] = useState<Record<string, number>>(existingScores);

  const handleScoreChange = (itemIndex: number, score: number) => {
    // Use format: toolId_index (e.g., "isaa_0", "clinical-snapshots_14")
    const itemId = `${toolId}_${itemIndex}`;
    setScores(prev => ({
      ...prev,
      [itemId]: score
    }));
  };

  const handleSubmit = () => {
    onComplete(scores);
    onClose();
  };

  const allItemsScored = items.every((_, index) => scores[`${toolId}_${index}`] !== undefined);
  const scoredCount = Object.keys(scores).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1002] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {activityName}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Score each item from 0 to 5
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>Progress</span>
                <span>{scoredCount} / {items.length} items scored</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-violet-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(scoredCount / items.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {items.map((itemText, index) => {
                const itemId = `${toolId}_${index}`;
                const currentScore = scores[itemId];
                const isScored = currentScore !== undefined;

                return (
                  <div
                    key={itemId}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isScored
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isScored
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-slate-800 dark:text-white font-medium mb-3">
                          {itemText}
                        </p>
                        
                        {/* Score buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {[0, 1, 2, 3, 4, 5].map(score => (
                            <button
                              key={score}
                              onClick={() => handleScoreChange(index, score)}
                              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                currentScore === score
                                  ? 'bg-violet-600 text-white scale-110 shadow-lg'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-4">
                {!allItemsScored && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Please score all items to complete
                  </p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!allItemsScored}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    allItemsScored
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Save Scores</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
