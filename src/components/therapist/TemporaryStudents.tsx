import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Search, User, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FilterDropdown, FilterOption } from '../shared/FilterDropdown';

export const TemporaryStudents: React.FC = () => {
  useAuth();
  const { tempStudents, studentsLoading, studentsError, refreshTempStudentsPage } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const tempStudentFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status', icon: <User className="h-4 w-4" />, color: 'slate' },
    { value: 'active', label: 'Active', icon: <AlertCircle className="h-4 w-4" />, color: 'emerald' },
    { value: 'new', label: 'New Enrollments', icon: <FileText className="h-4 w-4" />, color: 'blue' },
    { value: 'assessment_due', label: 'Assessment Due', icon: <Clock className="h-4 w-4" />, color: 'amber' },
    { value: 'inactive', label: 'Inactive', icon: <RefreshCw className="h-4 w-4" />, color: 'slate' },
  ];

  // Data is automatically loaded by DataContext

  const filteredStudents = tempStudents.filter((student: any) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/3 h-20 w-20 rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-start mb-8"
        >
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Temporary Enrollment
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Students whose enrollments stay in Temporary status until assessments or clinical snapshots are completed
            </p>
          </div>
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshTempStudentsPage}
            disabled={studentsLoading}
            className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
          >
            <RefreshCw className={`h-4 w-4 ${studentsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search temporary students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm transition-all text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
            <div className="w-full md:w-auto">
              <FilterDropdown
                options={tempStudentFilterOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filter by status"
                className="w-full md:w-[220px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {tempStudents.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Temporary</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {tempStudents.filter((s: any) => s.status === 'active').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tempStudents.filter((s: any) => s.status === 'new').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">New</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {tempStudents.filter((s: any) => s.priorDiagnosis).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Prior Diagnosis</div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {studentsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <LoadingSpinner />
            <p className="text-slate-600 dark:text-slate-400">Loading temporary students...</p>
          </motion.div>
        )}

        {/* Error State */}
        {studentsError && !studentsLoading && (
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
                  Failed to load temporary students
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{studentsError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Students Grid */}
        {!studentsLoading && !studentsError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student: any, index: number) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="glass-card rounded-2xl p-6 group hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-amber-300 dark:hover:border-amber-600"
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-200 dark:ring-amber-800"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">Age {student.age}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "inline-block px-3 py-1 rounded-full text-xs font-medium transition-all",
                            student.status === 'active' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                            student.status === 'new' && "bg-blue-100 dark:bg-slate-800/70 text-blue-700 dark:text-blue-300",
                            student.status === 'assessment_due' && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
                            student.status === 'inactive' && "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                          )}>
                            {student.status.replace('_', ' ')}
                          </span>
                          {student.priorDiagnosis && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                              Prior Diagnosis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                        <span>
                          {student.goals?.length
                            ? `${student.goals.length} active goal${student.goals.length === 1 ? '' : 's'}`
                            : 'Goals pending assignment'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Temporary enrollment - awaiting full processing
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Empty state when no temporary students found
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                      No temporary students found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Students with prior diagnosis will appear here when they are temporarily enrolled and assigned to you.
                    </p>
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