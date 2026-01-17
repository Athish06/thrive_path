import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar as CalendarIcon, BookOpen, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import Stepper, { Step } from '../ui/Stepper';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import AnalogClock from '../ui/AnalogClock';
import { ChildGoal } from '../../types';
import { useTherapistSettings } from '../../hooks/useTherapistSettings';
import { checkTimeConflicts, TimeConflict, getAvailableTimeSlots, formatTimeToAMPM } from '../../utils/sessionScheduling';
import { resolveLearnerType } from '../../utils/learnerUtils';

interface BackendSession {
  id: number;
  therapist_id: number;
  child_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_planned_activities: number;
  completed_activities: number;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  prerequisite_completion_required: boolean;
  therapist_notes?: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  therapist_name?: string;
}

export const ASSESSMENT_TOOL_LABELS: Record<string, string> = {
  'isaa': 'ISAA (Indian Scale for Assessment of Autism)',
  'indt-adhd': 'INDT-ADHD (Indian Scale for ADHD)',
  'clinical-snapshots': 'Clinical Snapshots'
};

// Mock learners for selection (removed - will use real data from props)

export interface SessionAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (session: any) => void;
  students: Student[];
  allSessions?: BackendSession[];
  learnerType?: 'general' | 'temporary';
}

interface Student {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  priorDiagnosis?: boolean;
  status?: string;
}

interface SessionData {
  learnerId: string;
  date: string;
  startTime: string;
  endTime: string;
  childGoals: number[]; // Array of child_goal_ids instead of activity names
  assessmentTools: string[];
}

interface StudentSelectorModalProps {
  isOpen: boolean;
  students: Student[];
  selectedLearnerId: string;
  onSelect: (learnerId: string) => void;
  onClose: () => void;
}

export const StudentSelectorModal: React.FC<StudentSelectorModalProps> = ({ isOpen, students, selectedLearnerId, onSelect, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        key="session-student-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                    Select Student
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Choose who this session is for
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

            <div className="space-y-3">
              {students.map(student => {
                const isSelected = selectedLearnerId === student.id.toString();
                const initials = student.name.split(' ').map((n: string) => n[0]).join('');

                return (
                  <button
                    key={student.id}
                    onClick={() => onSelect(student.id.toString())}
                    className={`w-full p-4 rounded-xl transition-all border-2 text-left ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 text-blue-700 dark:text-blue-300'
                      }`}>
                        {initials}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white">{student.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const SessionAddModal: React.FC<SessionAddModalProps> = ({ open, onClose, onAdd, students, allSessions = [], learnerType = 'general' }) => {
  const { workingHours, freeHours } = useTherapistSettings();
  const [sessionData, setSessionData] = useState<SessionData>({
    learnerId: '',
    date: '',
    startTime: '',
    endTime: '',
    childGoals: [],
    assessmentTools: []
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [availableChildGoals, setAvailableChildGoals] = useState<ChildGoal[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [timeConflict, setTimeConflict] = useState<TimeConflict>({ type: 'none', message: '', severity: 'none' });
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showFreeSlotsModal, setShowFreeSlotsModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const selectedStudent = useMemo(
    () => students.find(s => s.id.toString() === sessionData.learnerId) || null,
    [students, sessionData.learnerId]
  );
  const resolvedLearnerType = useMemo(
    () => resolveLearnerType(selectedStudent, learnerType),
    [selectedStudent, learnerType]
  );
  const isTemporaryFlow = resolvedLearnerType === 'temporary';
  const hasExistingSessions = useMemo(
    () => (selectedStudent ? allSessions.some(session => session.child_id === selectedStudent.id) : false),
    [selectedStudent, allSessions]
  );
  const useAssessmentFlow = isTemporaryFlow && !hasExistingSessions;
  const priorDiagnosis = Boolean(selectedStudent?.priorDiagnosis);
  const selectedAssessmentToolLabels = useMemo(
    () => sessionData.assessmentTools.map(toolId => ASSESSMENT_TOOL_LABELS[toolId] || toolId),
    [sessionData.assessmentTools]
  );
  const assessmentToolOptions = useMemo(() => {
    const baseOptions = [
      { id: 'isaa', name: 'ISAA', description: 'Indian Scale for Assessment of Autism' },
      { id: 'indt-adhd', name: 'INDT-ADHD', description: 'Indian Scale for ADHD' }
    ];
    if (priorDiagnosis) {
      return [
        { id: 'clinical-snapshots', name: 'Clinical Snapshots', description: 'Clinical observation snapshots for learners with prior diagnosis' },
        ...baseOptions
      ];
    }
    return baseOptions;
  }, [priorDiagnosis]);

  // Fetch child goals when a student is selected
  useEffect(() => {
    const fetchChildGoals = async () => {
      if (!sessionData.learnerId || !selectedStudent) {
        setAvailableChildGoals([]);
        setLoadingActivities(false);
        return;
      }

      if (useAssessmentFlow) {
        setAvailableChildGoals([]);
        setLoadingActivities(false);
        return;
      }

      setLoadingActivities(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/students/${sessionData.learnerId}/activities`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableChildGoals(data);
        } else {
          console.error('Failed to fetch child goals:', response.status);
          // Fallback to mock data if API fails
          setAvailableChildGoals([]);
        }
      } catch (error) {
        console.error('Error fetching child goals:', error);
        // Fallback to mock data
        setAvailableChildGoals([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchChildGoals();
  }, [sessionData.learnerId, selectedStudent, useAssessmentFlow]);

  useEffect(() => {
    if (!useAssessmentFlow || !priorDiagnosis) {
      return;
    }

    setSessionData(prev => {
      if (prev.assessmentTools.includes('clinical-snapshots')) {
        return prev;
      }
      return {
        ...prev,
        assessmentTools: [...prev.assessmentTools, 'clinical-snapshots']
      };
    });
  }, [useAssessmentFlow, priorDiagnosis]);

  const handleInputChange = (field: keyof SessionData, value: string | string[]) => {
    setFormError(null);

    setSessionData(prev => {
      const updated: SessionData = field === 'learnerId'
        ? {
            ...prev,
            learnerId: value as string,
            childGoals: [],
            assessmentTools: [],
          }
        : {
            ...prev,
            [field]: value,
          } as SessionData;

      if (field === 'date' || field === 'startTime') {
        if (updated.date && updated.startTime) {
          const conflict = checkTimeConflicts(updated.date, updated.startTime, workingHours, freeHours, allSessions);
          setTimeConflict(conflict);
        } else {
          setTimeConflict({ type: 'none', message: '', severity: 'none' });
        }
      }

      return updated;
    });

    if (field === 'learnerId') {
      setAvailableChildGoals([]);
    }
  };

  const toggleChildGoal = (childGoalId: number) => {
    setFormError(null);
    setSessionData(prev => ({
      ...prev,
      childGoals: prev.childGoals.includes(childGoalId)
        ? prev.childGoals.filter(id => id !== childGoalId)
        : [...prev.childGoals, childGoalId]
    }));
  };

  const toggleAssessmentTool = (toolId: string) => {
    setSessionData(prev => {
      const alreadySelected = prev.assessmentTools.includes(toolId);
      if (alreadySelected && priorDiagnosis && toolId === 'clinical-snapshots') {
        return prev; // Preserve required tool for prior diagnosis learners
      }
      return {
        ...prev,
        assessmentTools: alreadySelected
          ? prev.assessmentTools.filter(id => id !== toolId)
          : [...prev.assessmentTools, toolId]
      };
    });
    setFormError(null);
  };

  const resetFormState = () => {
    setSessionData({
      learnerId: '',
      date: '',
      startTime: '',
      endTime: '',
      childGoals: [],
      assessmentTools: []
    });
    setAvailableChildGoals([]);
    setTimeConflict({ type: 'none', message: '', severity: 'none' });
    setShowConflictDialog(false);
    setShowStudentSelector(false);
    setShowFreeSlotsModal(false);
    setAvailableSlots([]);
    setLoadingActivities(false);
    setFormError(null);
    setCurrentStep(1);
  };

  const handleModalClose = () => {
    resetFormState();
    onClose();
  };

  const finalizeSessionCreation = (learner: Student) => {
    const toolSummary = selectedAssessmentToolLabels.join(', ');
    const assessmentNote = useAssessmentFlow && toolSummary
      ? `Assessment tools planned${learner.priorDiagnosis ? ' (prior diagnosis)' : ''}: ${toolSummary}`
      : null;

    onAdd({
      learner: learner.name,
      learnerId: learner.id,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      childGoals: useAssessmentFlow ? [] : sessionData.childGoals,
      assessmentTools: useAssessmentFlow ? sessionData.assessmentTools : [],
      isAssessmentSession: useAssessmentFlow,
      notes: assessmentNote || '',
    });

    handleModalClose();
  };

  const validateBeforeSubmit = () => {
    if (!selectedStudent) {
      setFormError('Please select a student to continue.');
      setCurrentStep(1);
      return false;
    }

    if (!sessionData.date || !sessionData.startTime || !sessionData.endTime) {
      setFormError('Please choose a session date, start time, and end time.');
      setCurrentStep(2);
      return false;
    }
    
    // Validate end time is after start time
    if (sessionData.startTime && sessionData.endTime && sessionData.endTime <= sessionData.startTime) {
      setFormError('End time must be after start time.');
      setCurrentStep(2);
      return false;
    }

    if (useAssessmentFlow) {
      if (sessionData.assessmentTools.length === 0) {
        setFormError('Select at least one assessment tool for this session.');
        setCurrentStep(3);
        return false;
      }
      if (priorDiagnosis && !sessionData.assessmentTools.includes('clinical-snapshots')) {
        setFormError('Clinical Snapshots are required for learners with a prior diagnosis.');
        setCurrentStep(3);
        return false;
      }
    } else if (sessionData.childGoals.length === 0) {
      setFormError('Select at least one activity for this session.');
      setCurrentStep(3);
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!validateBeforeSubmit()) {
      return;
    }

    if (sessionData.date && sessionData.startTime) {
      const conflict = checkTimeConflicts(sessionData.date, sessionData.startTime, workingHours, freeHours, allSessions);
      setTimeConflict(conflict);

      if (conflict.type !== 'none') {
        if (conflict.severity === 'error') {
          return;
        }
        setShowConflictDialog(true);
        return;
      }
    }

    if (selectedStudent) {
      finalizeSessionCreation(selectedStudent);
    }
  };

  const handleConflictConfirm = () => {
    setShowConflictDialog(false);
    if (!validateBeforeSubmit()) {
      return;
    }

    if (selectedStudent) {
      finalizeSessionCreation(selectedStudent);
    }
  };

  const calculateFreeSlots = () => {
    if (!sessionData.date) return;
    
    const slots = getAvailableTimeSlots(
      sessionData.date,
      workingHours,
      freeHours,
      allSessions,
      60, // session duration
      30  // interval
    );
    setAvailableSlots(slots);
    setShowFreeSlotsModal(true);
  };

  if (!open) return null;

  // Student Selector Popup Component
  const handleStudentSelect = (learnerId: string) => {
    handleInputChange('learnerId', learnerId);
    setShowStudentSelector(false);
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  onClick={handleModalClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-8 pb-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Schedule New Session
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Create a new therapy session for your learners
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <Stepper
              initialStep={1}
              currentStep={currentStep}
              onStepChange={(step) => {
                setCurrentStep(step);
                setFormError(null);
              }}
              onFinalStepCompleted={handleSubmit}
              backButtonText="Previous"
              nextButtonText="Next"
              disabled={timeConflict.severity === 'error'}
            >
              {/* Step 1: Select Learner */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Select Student
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Choose who this session is for
                    </p>
                  </div>

                  {selectedStudent ? (
                    <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-semibold">
                            {selectedStudent.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white">
                              {selectedStudent.name}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Selected Student
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!showStudentSelector) {
                              setShowStudentSelector(true);
                            }
                          }}
                          className="px-4 py-2 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20 rounded-lg transition-colors font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={() => {
                          if (!showStudentSelector) {
                            setShowStudentSelector(true);
                          }
                        }}
                        className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-violet-400 dark:hover:border-violet-500 transition-colors group"
                      >
                        <Users className="h-12 w-12 text-slate-400 group-hover:text-violet-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 font-medium">
                          Click to select a student
                        </p>
                      </button>
                    </div>
                  )}

                  {formError && currentStep === 1 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {formError}
                    </div>
                  )}
                </div>
              </Step>

              {/* Step 2: Schedule Session */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Schedule Session
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Pick the date and time for the session
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Session Date
                    </label>
                    <CustomDatePicker
                      value={sessionData.date}
                      onChange={(date) => handleInputChange('date', date)}
                      placeholder="Select session date"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                        Start Time
                      </label>
                      <div className="flex justify-center">
                        <AnalogClock
                          value={sessionData.startTime}
                          onChange={(time) => handleInputChange('startTime', time)}
                          size={220}
                          className="max-w-fit"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                        End Time
                      </label>
                      <div className="flex justify-center">
                        <AnalogClock
                          value={sessionData.endTime}
                          onChange={(time) => handleInputChange('endTime', time)}
                          size={220}
                          className="max-w-fit"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Find Free Session Button */}
                  {sessionData.date && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={calculateFreeSlots}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Find Free Session
                      </button>
                    </div>
                  )}

                  {/* Time Conflict Warning */}
                  {timeConflict.type !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${
                        timeConflict.severity === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : timeConflict.severity === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {timeConflict.severity === 'error' ? (
                          <X className={`h-5 w-5 mt-0.5 ${
                            timeConflict.severity === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : timeConflict.severity === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        ) : timeConflict.severity === 'warning' ? (
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            timeConflict.severity === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        ) : (
                          <Info className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            timeConflict.severity === 'error'
                              ? 'text-red-800 dark:text-red-200'
                              : timeConflict.severity === 'warning'
                              ? 'text-amber-800 dark:text-amber-200'
                              : 'text-blue-800 dark:text-blue-200'
                          }`}>
                            {timeConflict.type === 'session-conflict'
                              ? 'Session Time Conflict'
                              : timeConflict.type === 'non-working-hours'
                              ? 'Outside Working Hours'
                              : 'Free Time Conflict'}
                          </p>
                          <p className={`text-sm mt-1 ${
                            timeConflict.severity === 'error'
                              ? 'text-red-700 dark:text-red-300'
                              : timeConflict.severity === 'warning'
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-blue-700 dark:text-blue-300'
                          }`}>
                            {timeConflict.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {formError && currentStep === 2 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {formError}
                    </div>
                  )}
                </div>
              </Step>

              {/* Step 3: Plan Session Focus */}
              <Step>
                <div className="space-y-6">
                  {useAssessmentFlow ? (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                          Select Assessment Tools
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Temporary enrollments begin with a structured assessment session. Choose the tools you plan to administer.
                        </p>
                        {priorDiagnosis && (
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                            Clinical Snapshots must be included for learners with a prior diagnosis.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {assessmentToolOptions.map(option => {
                          const selected = sessionData.assessmentTools.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleAssessmentTool(option.id)}
                              className={`p-4 rounded-xl transition-all border-2 text-left ${
                                selected
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${
                                      selected
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-slate-700 dark:to-slate-600 text-purple-700 dark:text-purple-300'
                                    }`}>
                                      {option.name[0]}
                                    </span>
                                    <span className="font-medium text-slate-800 dark:text-white">
                                      {ASSESSMENT_TOOL_LABELS[option.id] || option.name}
                                    </span>
                                    {option.id === 'clinical-snapshots' && priorDiagnosis && (
                                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    {option.description}
                                  </p>
                                </div>
                                {selected && <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {sessionData.assessmentTools.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                            {sessionData.assessmentTools.length} tool{sessionData.assessmentTools.length === 1 ? '' : 's'} selected
                          </p>
                        </div>
                      )}

                      {formError && currentStep === 3 && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                          {formError}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                          Choose Activities
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Select the therapy activities for this session
                        </p>
                      </div>

                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading activities...</span>
                        </div>
                      ) : availableChildGoals.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {availableChildGoals.map(childGoal => (
                            <button
                              key={childGoal.id}
                              onClick={() => toggleChildGoal(childGoal.id)}
                              className={`p-4 rounded-xl transition-all border-2 text-left ${
                                sessionData.childGoals.includes(childGoal.id)
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    sessionData.childGoals.includes(childGoal.id)
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-slate-700 dark:to-slate-600 text-green-700 dark:text-green-300'
                                  }`}>
                                    <BookOpen className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-800 dark:text-white block">
                                      {childGoal.activity_name || 'Unknown Activity'}
                                    </span>
                                    {childGoal.activity_description && (
                                      <span className="text-sm text-slate-500 dark:text-slate-400">{childGoal.activity_description}</span>
                                    )}
                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                      Target: {childGoal.target_frequency}x per week
                                    </div>
                                  </div>
                                </div>
                                {sessionData.childGoals.includes(childGoal.id) && (
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : sessionData.learnerId ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">No activities assigned to this student.</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">Please select a student first to see available activities.</p>
                        </div>
                      )}

                      {sessionData.childGoals.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            {sessionData.childGoals.length} activit{sessionData.childGoals.length === 1 ? 'y' : 'ies'} selected
                          </p>
                        </div>
                      )}

                      {formError && currentStep === 3 && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                          {formError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Step>

              {/* Step 4: Review Session */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Review Session
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Review your session details before creating
                    </p>
                  </div>

                  {/* Session Summary */}
                  <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4">Session Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Student:</span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {selectedStudent?.name || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Date:</span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {sessionData.date || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Start Time:</span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {sessionData.startTime || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">End Time:</span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {sessionData.endTime || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          {useAssessmentFlow ? 'Session Type:' : 'Activities:'}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {useAssessmentFlow
                            ? 'Assessment session'
                            : `${sessionData.childGoals.length} selected`}
                        </span>
                      </div>
                      {useAssessmentFlow && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                          <span className="text-slate-600 dark:text-slate-400 block mb-1">Assessment Tools:</span>
                          <span className="text-slate-800 dark:text-white text-xs">
                            {selectedAssessmentToolLabels.length > 0
                              ? selectedAssessmentToolLabels.join(', ')
                              : 'No tools selected'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Step>
            </Stepper>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Conflict Confirmation Dialog */}
      <AnimatePresence>
        {showConflictDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1001] p-4"
            onClick={() => setShowConflictDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    timeConflict.severity === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/50'
                      : 'bg-blue-100 dark:bg-blue-900/50'
                  }`}>
                    {timeConflict.severity === 'warning' ? (
                      <AlertTriangle className={`h-6 w-6 ${
                        timeConflict.severity === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    ) : (
                      <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      {timeConflict.type === 'non-working-hours' ? 'Outside Working Hours' : 'Free Time Conflict'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Please confirm your scheduling choice
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 mb-6">
                  {timeConflict.message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConflictDialog(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
                  >
                    Edit Time
                  </button>
                  <button
                    onClick={handleConflictConfirm}
                    className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-medium ${
                      timeConflict.severity === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Student Selector Popup */}
      <StudentSelectorModal
        isOpen={showStudentSelector}
        students={students}
        selectedLearnerId={sessionData.learnerId}
        onSelect={handleStudentSelect}
        onClose={() => setShowStudentSelector(false)}
      />

      {/* Free Slots Modal */}
      <AnimatePresence>
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
                        Free slots for {sessionData.date}
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

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          handleInputChange('startTime', slot);
                          setShowFreeSlotsModal(false);
                        }}
                        className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-center group"
                      >
                        <div className="text-lg font-medium text-slate-800 dark:text-white group-hover:text-slate-900 dark:group-hover:text-slate-100">
                          {formatTimeToAMPM(slot)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Available
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
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                      Check your working hours and existing sessions.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
