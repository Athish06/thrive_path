import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, User, Clock, AlertCircle, RefreshCw, Activity, Target, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FilterDropdown, FilterOption } from '../shared/FilterDropdown';

export const ActivitiesPage: React.FC = () => {
  const { littleLearners, loading, error, refreshLearners, refreshLearnersPage } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  const activityFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status', icon: <User className="h-4 w-4" />, color: 'slate' },
    { value: 'active', label: 'Active', icon: <Zap className="h-4 w-4" />, color: 'emerald' },
    { value: 'new', label: 'New Enrollments', icon: <Target className="h-4 w-4" />, color: 'blue' },
    { value: 'assessment_due', label: 'Assessment Due', icon: <AlertCircle className="h-4 w-4" />, color: 'amber' },
    { value: 'inactive', label: 'Inactive', icon: <Clock className="h-4 w-4" />, color: 'slate' },
  ];

  // Refresh data every time the component mounts
  useEffect(() => {
    refreshLearners();
  }, [refreshLearners]);

  const filteredLearners = littleLearners.filter(learner => {
    const matchesSearch = learner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || learner.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalLearners = littleLearners.length;
  const activeCount = littleLearners.filter((learner) => learner.status === 'active').length;
  const newCount = littleLearners.filter((learner) => learner.status === 'new').length;
  const assessmentDueCount = littleLearners.filter((learner) => learner.status === 'assessment_due').length;

  const formatNextSession = (nextSession?: string) => {
    if (!nextSession) return 'No upcoming session';
    const date = new Date(nextSession);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-violet-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/3 h-20 w-20 rounded-full bg-gradient-to-br from-pink-400/20 to-rose-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 space-y-8 p-6 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activities</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Assign therapeutic activities powered by AI to keep every learner on track.
                </p>
              </div>
            </div>
          </div>
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshLearnersPage}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Filters & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl p-6 md:p-8 shadow-lg"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search learners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 pl-12 pr-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="w-full md:w-auto">
              <FilterDropdown
                options={activityFilterOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filter by status"
                className="w-full md:w-[220px]"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-1">Total Learners</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{totalLearners}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-1">Active</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-1">New</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-300">{newCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-1">Assessment Due</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{assessmentDueCount}</p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <LoadingSpinner />
            <p className="text-slate-600 dark:text-slate-400">Loading your students...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Failed to load students
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={refreshLearners}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Learners Grid */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner, index) => (
                  <motion.div
                    key={learner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => navigate(`/activities/${learner.id}`)}
                    className="glass-card rounded-2xl p-6 cursor-pointer group hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600"
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      {learner.photo ? (
                        <img
                          src={learner.photo}
                          alt={learner.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-800"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {learner.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">Age {learner.age}</p>
                        <span
                          className={cn(
                            'inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 transition-all',
                            learner.status === 'active' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                            learner.status === 'new' && 'bg-violet-100 dark:bg-slate-800/70 text-violet-700 dark:text-violet-300',
                            learner.status === 'assessment_due' && 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
                            learner.status === 'inactive' && 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {learner.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Target className="h-4 w-4 mr-2 text-violet-600 dark:text-violet-400" />
                        <span>
                          {learner.goals.length > 0
                            ? `${learner.goals.length} goal${learner.goals.length === 1 ? '' : 's'} available`
                            : 'Goals not assigned yet'}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatNextSession(learner.nextSession)}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Goals:</p>
                      </div>
                      <div className="space-y-1">
                        {learner.goals.slice(0, 2).map((goal, goalIndex) => (
                          <p key={goalIndex} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                            <Zap className="h-3 w-3 mr-2 mt-0.5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
                            <span className="truncate">{goal}</span>
                          </p>
                        ))}
                        {learner.goals.length > 2 && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            +{learner.goals.length - 2} more therapeutic targets
                          </p>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                            Click to assign AI-recommended activities
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Empty state when no learners match filters
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">No Students Found</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {searchTerm || selectedStatus !== 'all'
                        ? 'Try adjusting your search criteria'
                        : 'Enroll students to start assigning activities'}
                    </p>
                    {(!searchTerm && selectedStatus === 'all') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      >
                        Enroll First Learner
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};