import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Search,
  User,
  Plus,
  Brain,
  Clock,
  AlertCircle,
  RefreshCw,
  Heart,
  MessageCircle,
  Users,
  Zap,
  Target,
  ChevronDown,
  ClipboardList,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FilterDropdown, FilterOption } from '../shared/FilterDropdown';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { StudentEnrollmentModal } from './StudentEnrollmentModal';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { LittleLearner } from '../../types';

export const LearnersList: React.FC = () => {
  const { littleLearners, loading, error, refreshLearners, refreshLearnersPage } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LittleLearner | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [expandedMedicalSections, setExpandedMedicalSections] = useState<Record<string, boolean>>({});
  const [selectedAssessmentTool, setSelectedAssessmentTool] = useState<string | null>(null);
  const [activeDetailSection, setActiveDetailSection] = useState<'medical' | 'assessment'>('medical');
  const navigate = useNavigate();
  const openDetailsModal = (learner: LittleLearner) => {
    setSelectedLearner(learner);
    setActiveDetailSection('medical');
    setIsDetailsModalOpen(true);
  };

  // Refresh data every time the component mounts
  useEffect(() => {
    refreshLearners();
  }, [refreshLearners]);

  useEffect(() => {
    if (!isDetailsModalOpen) {
      setExpandedMedicalSections({});
      setSelectedAssessmentTool(null);
      setActiveDetailSection('medical');
    }
  }, [isDetailsModalOpen]);

  const filteredLearners = littleLearners.filter(learner => {
    const matchesSearch = learner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || learner.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleMedicalSection = (sectionKey: string) => {
    setExpandedMedicalSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const formatMedicalDiagnosisValue = (value: any, level: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">Not specified</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="font-medium">{value ? 'Yes' : 'No'}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-500 italic">None</span>;
      }
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, idx) => (
            <li key={idx} className="text-slate-700 dark:text-slate-300">
              {typeof item === 'object' && item !== null
                ? formatMedicalDiagnosisValue(item, level + 1)
                : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-slate-500 italic">No data</span>;
      }

      return (
        <div className={`space-y-3 ${level > 0 ? 'pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
          {entries.map(([subKey, subValue]) => (
            <div key={subKey} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {subKey.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-sm pl-3">
                {formatMedicalDiagnosisValue(subValue, level + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-slate-700 dark:text-slate-300">{String(value)}</span>;
  };

  const getAssessmentTools = (learner: LittleLearner | null) => {
    if (!learner?.assessmentDetails || typeof learner.assessmentDetails !== 'object') return [];

    return Object.keys(learner.assessmentDetails).map((toolName) => {
      const toolData = learner.assessmentDetails[toolName];
      const normalized = toolName.toLowerCase();
      const icon = (() => {
        if (normalized.includes('isaa') || normalized.includes('autism') || normalized.includes('social')) return <Users className="h-5 w-5" />;
        if (normalized.includes('adhd') || normalized.includes('attention')) return <Brain className="h-5 w-5" />;
        if (normalized.includes('speech') || normalized.includes('language')) return <MessageCircle className="h-5 w-5" />;
        if (normalized.includes('motor')) return <Zap className="h-5 w-5" />;
        if (normalized.includes('cognitive')) return <Target className="h-5 w-5" />;
        if (normalized.includes('sensory')) return <Heart className="h-5 w-5" />;
        return <ClipboardList className="h-5 w-5" />;
      })();
      const color = (() => {
        if (normalized.includes('isaa') || normalized.includes('autism')) return 'blue';
        if (normalized.includes('adhd')) return 'purple';
        if (normalized.includes('speech') || normalized.includes('language')) return 'green';
        if (normalized.includes('motor')) return 'orange';
        if (normalized.includes('cognitive')) return 'indigo';
        if (normalized.includes('sensory')) return 'red';
        return 'gray';
      })();

      return {
        id: toolName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
        name: toolName.toUpperCase(),
        icon,
        color,
        data: toolData
      };
    });
  };

  const formatAssessmentValue = (value: any, level: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">Not specified</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="font-medium">{value ? 'Yes' : 'No'}</span>;
    }

    if (typeof value === 'number') {
      return <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-500 italic">No entries</span>;
      }
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, idx) => (
            <li key={idx} className="text-slate-700 dark:text-slate-300">
              {typeof item === 'object' && item !== null
                ? formatAssessmentValue(item, level + 1)
                : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-slate-500 italic">No data</span>;
      }

      return (
        <div className={`space-y-3 ${level > 0 ? 'pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
          {entries.map(([subKey, subValue]) => (
            <div key={subKey} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {subKey.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-sm pl-3">
                {formatAssessmentValue(subValue, level + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-slate-700 dark:text-slate-300">{String(value)}</span>;
  };

  const learnerFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status', icon: <Users className="h-4 w-4" />, color: 'slate' },
    { value: 'active', label: 'Active', icon: <Zap className="h-4 w-4" />, color: 'emerald' },
    { value: 'new', label: 'New Enrollments', icon: <Plus className="h-4 w-4" />, color: 'blue' },
    { value: 'assessment_due', label: 'Assessment Due', icon: <ClipboardList className="h-4 w-4" />, color: 'amber' },
    { value: 'inactive', label: 'Inactive', icon: <AlertCircle className="h-4 w-4" />, color: 'slate' },
  ];

  const assessmentTools = useMemo(() => getAssessmentTools(selectedLearner), [selectedLearner]);
  const selectedAssessmentToolData = assessmentTools.find(tool => tool.id === selectedAssessmentTool) ?? null;

  useEffect(() => {
    if (!isDetailsModalOpen) {
      setExpandedMedicalSections({});
      setSelectedAssessmentTool(null);
      return;
    }

    if (assessmentTools.length > 0) {
      setSelectedAssessmentTool((previous) => {
        if (previous && assessmentTools.some(tool => tool.id === previous)) {
          return previous;
        }
        return assessmentTools[0].id;
      });
    } else {
      setSelectedAssessmentTool(null);
    }
  }, [assessmentTools, isDetailsModalOpen, selectedLearner?.id]);

  const getToolAccent = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          tile: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
          icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
        };
      case 'purple':
        return {
          tile: 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
          icon: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
        };
      case 'green':
        return {
          tile: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700',
          icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
        };
      case 'orange':
        return {
          tile: 'border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700',
          icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
        };
      case 'indigo':
        return {
          tile: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700',
          icon: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
        };
      case 'red':
        return {
          tile: 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
          icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
        };
      default:
        return {
          tile: 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600',
          icon: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
        };
    }
  };

  const getDetailButtonClasses = (section: 'medical' | 'assessment') =>
    cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
      'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
      activeDetailSection === section &&
      'border-transparent bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
    );

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
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
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

      <div className="relative z-10 space-y-8 p-6">
        {/* Add New Learner Button and Refresh Button */}
        <div className="flex justify-end items-center gap-3">
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshLearnersPage}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEnrollmentModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Enroll New Learner
          </motion.button>
        </div>

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
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent backdrop-blur-sm transition-all text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
            <div className="w-full md:w-auto">
              <FilterDropdown
                options={learnerFilterOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filter by status"
                className="w-full md:w-[220px]"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3 mt-6">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-slate-800/80 dark:to-slate-700/80 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-md"
            >
              Ages 5-7
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-md"
            >
              High Progress
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-md"
            >
              Needs Attention
            </motion.span>
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
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
                    onClick={() => openDetailsModal(learner)}
                    className="glass-card rounded-2xl p-6 cursor-pointer group hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600"
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      {learner.photo ? (
                        <img
                          src={learner.photo}
                          alt={learner.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-blue-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-violet-600 dark:text-violet-400" />
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
                            learner.status === 'active' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                            learner.status === 'new' && 'bg-blue-100 dark:bg-slate-800/70 text-blue-700 dark:text-blue-300',
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
                        <ClipboardList className="h-4 w-4 mr-2 text-violet-600 dark:text-violet-400" />
                        <span>
                          {learner.goals.length > 0
                            ? `${learner.goals.length} active goal${learner.goals.length === 1 ? '' : 's'}`
                            : 'Goals pending assignment'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetailsModal(learner);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          View Details
                        </button>
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
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-blue-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Brain className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">No Students Found</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {searchTerm || selectedStatus !== 'all'
                        ? 'Try adjusting your search criteria'
                        : 'Enroll new students to get started'}
                    </p>
                    {(!searchTerm && selectedStatus === 'all') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/learners')}
                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
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

        {/* This empty state is removed since it's now handled within the grid */}
      </div>

      <Dialog
        open={isDetailsModalOpen}
        onOpenChange={(open: boolean) => {
          setIsDetailsModalOpen(open);
          if (!open) {
            setSelectedLearner(null);
          }
        }}
      >
        <DialogContent className="w-full max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLearner ? `${selectedLearner.name}'s Profile Details` : 'Learner Details'}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={() => setActiveDetailSection('medical')}
                className={getDetailButtonClasses('medical')}
              >
                <Heart className="h-4 w-4" />
                Medical Diagnosis
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailSection('assessment')}
                className={getDetailButtonClasses('assessment')}
              >
                <Brain className="h-4 w-4" />
                Assessment Records
              </button>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {activeDetailSection === 'medical' && (
                  <motion.section
                    key="medical"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60">
                        <Heart className="h-5 w-5 text-red-600 dark:text-red-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Medical Diagnosis</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Comprehensive health information captured for this learner.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {selectedLearner?.medicalDiagnosis ? (
                        typeof selectedLearner.medicalDiagnosis === 'object' && selectedLearner.medicalDiagnosis !== null ? (
                          <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {Object.entries(selectedLearner.medicalDiagnosis).map(([key, value]) => {
                              const label = key.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ');
                              const isExpanded = expandedMedicalSections[key] ?? false;
                              return (
                                <div key={key} className="py-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleMedicalSection(key)}
                                    className="w-full flex items-center justify-between gap-3 text-left"
                                    aria-expanded={isExpanded}
                                    aria-controls={`medical-section-${key}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500"></div>
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                        {label}
                                      </span>
                                    </div>
                                    <motion.span
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex-shrink-0 text-slate-500 dark:text-slate-400"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </motion.span>
                                  </button>
                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        id={`medical-section-${key}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pl-4 pt-3 text-sm text-slate-700 dark:text-slate-300">
                                          {formatMedicalDiagnosisValue(value)}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-700 dark:text-slate-300">
                            {String(selectedLearner.medicalDiagnosis)}
                          </div>
                        )
                      ) : (
                        <div className="text-center py-10">
                          <Heart className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No medical diagnosis information available yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.section>
                )}

                {activeDetailSection === 'assessment' && (
                  <motion.section
                    key="assessment"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60">
                          <Brain className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Assessment Records</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {selectedAssessmentToolData
                              ? `Detailed assessment snapshot for ${selectedLearner?.name ?? 'this learner'}.`
                              : 'Select an assessment tool to examine detailed results.'}
                          </p>
                        </div>
                      </div>
                      {selectedAssessmentToolData && (
                        <button
                          type="button"
                          onClick={() => setSelectedAssessmentTool(null)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to tools
                        </button>
                      )}
                    </div>

                    <div className="mt-4">
                      {selectedAssessmentToolData ? (
                        selectedAssessmentToolData.data ? (
                          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            {formatAssessmentValue(selectedAssessmentToolData.data)}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <ClipboardList className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">No data captured for this tool yet.</p>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assessmentTools.map((tool) => {
                              const accent = getToolAccent(tool.color);
                              return (
                                <motion.button
                                  key={`assessment-${tool.id}`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setSelectedAssessmentTool(tool.id)}
                                  className={`rounded-xl border px-4 py-4 text-left transition-all duration-300 ${accent.tile}`}
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${accent.icon}`}>
                                      {tool.icon}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{tool.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Tap to explore detailed scores.</p>
                                    </div>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                          {assessmentTools.length === 0 && (
                            <div className="text-center py-10">
                              <ClipboardList className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                              <p className="text-sm text-slate-500 dark:text-slate-400">No assessment details captured yet.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Enrollment Modal */}
      <StudentEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        onSuccess={() => {
          // Optional: Show success message
          console.log('Student enrolled successfully!');
        }}
      />
    </div>
  );
};