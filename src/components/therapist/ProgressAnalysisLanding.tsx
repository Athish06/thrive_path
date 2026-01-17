import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Search,
  RefreshCw,
  AlertCircle,
  User,
  ClipboardList,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { LittleLearner } from '../../types';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const formatNextSession = (nextSession?: string) => {
  if (!nextSession) return 'No upcoming session scheduled';
  const date = new Date(nextSession);
  if (Number.isNaN(date.getTime())) {
    return 'No upcoming session scheduled';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getStatusStyling = (status?: string | null) => {
  switch (status) {
    case 'active':
      return {
        tile: 'border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-400/80',
        badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
      };
    case 'assessment_due':
      return {
        tile: 'border-amber-200/60 dark:border-amber-800/40 hover:border-amber-400/80',
        badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
      };
    case 'new':
      return {
        tile: 'border-blue-200/60 dark:border-blue-800/40 hover:border-blue-400/80',
        badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
      };
    case 'inactive':
      return {
        tile: 'border-slate-200/60 dark:border-slate-700/40 hover:border-slate-400/80',
        badge: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
      };
    default:
      return {
        tile: 'border-slate-200/60 dark:border-slate-800/50 hover:border-violet-300/80',
        badge: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
      };
  }
};

const ProgressAnalysisLanding: React.FC = () => {
  const { littleLearners, loading, error, refreshLearners } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const navigate = useNavigate();

  const statusFilters = useMemo(() => {
    const statuses = new Set<string>();
    littleLearners.forEach((learner) => {
      if (learner.status) {
        statuses.add(learner.status);
      }
    });
    return ['all', ...Array.from(statuses)];
  }, [littleLearners]);

  const filteredLearners = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return littleLearners.filter((learner) => {
      const matchesSearch =
        !normalizedSearch ||
        learner.name.toLowerCase().includes(normalizedSearch) ||
        learner.firstName?.toLowerCase().includes(normalizedSearch) ||
        learner.lastName?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === 'all' || learner.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [littleLearners, searchTerm, selectedStatus]);

  const handleCardClick = (learner: LittleLearner) => {
    navigate(`/progress-analysis/${learner.id}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-12 right-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-16 left-16 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Progress Analysis
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
              Review every learner in your caseload, understand their engagement levels, and jump into detailed analytics in one click.
            </p>
          </div>

          <div className="flex flex-col gap-4 border border-slate-200/70 dark:border-slate-800/70 rounded-3xl bg-white/80 dark:bg-slate-950/70 shadow-lg p-6 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search learners by name"
                className="h-11 rounded-xl border-slate-400/20 bg-white pl-10 pr-3 text-sm shadow-sm focus-visible:ring-violet-500 dark:border-slate-700/60 dark:bg-slate-900"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => {
                const isActive = selectedStatus === status;
                const label = status === 'all' ? 'All statuses' : status.replace(/_/g, ' ');
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-200',
                      'border-slate-200/70 text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700/60 dark:text-slate-300 dark:hover:text-white',
                      isActive && 'border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void refreshLearners()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <LoadingSpinner />
            <p className="text-slate-600 dark:text-slate-400"></p>
          </div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-red-200/70 bg-red-50/80 p-8 text-center dark:border-red-900/60 dark:bg-red-950/40"
          >
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-300">Unable to fetch learners</h3>
              <p className="text-sm text-red-500/80 dark:text-red-200/80">{error}</p>
              <button
                type="button"
                onClick={() => void refreshLearners()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence>
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner, index) => {
                  const statusClasses = getStatusStyling(learner.status);
                  return (
                    <motion.button
                      key={learner.id}
                      type="button"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      whileHover={{ y: -4 }}
                      onClick={() => handleCardClick(learner)}
                      className={cn(
                        'group flex h-full flex-col justify-between rounded-2xl border bg-white/90 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-slate-950/70',
                        statusClasses.tile
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {learner.photo ? (
                          <img
                            src={learner.photo}
                            alt={learner.name}
                            className="h-16 w-16 rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-slate-800/70 dark:to-slate-700/70">
                            <User className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
                            {learner.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Age {learner.age ?? '—'}</p>
                          <span className={cn('mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize', statusClasses.badge)}>
                            {(learner.status ?? 'unknown').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-violet-500" />
                          <span>
                            {learner.goals.length > 0
                              ? `${learner.goals.length} active goal${learner.goals.length === 1 ? '' : 's'}`
                              : 'Goals pending assignment'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatNextSession(learner.nextSession)}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="col-span-full rounded-3xl border border-dashed border-slate-300/70 bg-white/60 p-12 text-center dark:border-slate-700/60 dark:bg-slate-950/40"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-slate-800/60 dark:to-slate-700/60">
                    <Brain className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-800 dark:text-white">No learners match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Try adjusting your search term or status filters.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProgressAnalysisLanding;
