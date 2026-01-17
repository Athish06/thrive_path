import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, subMonths } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Calendar as CalendarIcon,
  Activity,
  TrendingUp,
  ClipboardList,
  Stethoscope,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  Loader2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar as DateSelectionCalendar } from '../ui/calendar';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { cn } from '../../lib/utils';
import { LittleLearner, ChildGoal } from '../../types';

type BackendSession = {
  id: number;
  child_id: number;
  therapist_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_planned_activities: number;
  completed_activities: number;
  estimated_duration_minutes: number;
  therapist_notes?: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
};

type MonthlySummary = {
  monthLabel: string;
  monthKey: string;
  totalSessions: number;
  completedSessions: number;
  plannedActivities: number;
  completedActivities: number;
  attendanceRate: number;
};

type GoalSummary = {
  total: number;
  toDo: number;
  inProgress: number;
  mastered: number;
  successRate: number;
};

interface GoalStatusPillProps {
  label: string;
  value: number;
  accent: string;
}

const GoalStatusPill: React.FC<GoalStatusPillProps> = ({ label, value, accent }) => (
  <div className={cn(
    'flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm',
    accent
  )}>
    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
    <span className="text-lg font-semibold text-slate-900 dark:text-white">{value}</span>
  </div>
);

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  icon,
  iconClassName,
  isOpen,
  onToggle,
  children,
  className
}) => (
  <div className={cn(
    'rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/70 shadow-sm',
    className
  )}>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn('rounded-xl p-3 text-slate-700 dark:text-slate-200', iconClassName)}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-slate-500">
        <ChevronDown className="h-5 w-5" />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="px-6 pb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          <div className="space-y-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const buildEmptyMonthlySummary = (referenceDate: Date) => {
  const base = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const result: MonthlySummary[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = subMonths(base, index);
    const monthKey = format(monthDate, 'yyyy-MM');
    result.push({
      monthKey,
      monthLabel: format(monthDate, 'MMM yyyy'),
      totalSessions: 0,
      completedSessions: 0,
      plannedActivities: 0,
      completedActivities: 0,
      attendanceRate: 0
    });
  }
  return result;
};

const getMonthStart = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1);

const formatDateDisplay = (value?: string) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, 'MMMM dd, yyyy');
};

const getAssessmentTools = (learner?: LittleLearner | null) => {
  if (!learner) {
    return [];
  }

  // Check both assessmentDetails and parse if it's a string
  let assessmentData = learner.assessmentDetails;
  
  // If it's a string, try to parse it as JSON
  if (typeof assessmentData === 'string') {
    try {
      assessmentData = JSON.parse(assessmentData);
    } catch (e) {
      console.error('Failed to parse assessment details:', e);
      return [];
    }
  }

  // If no assessment data or not an object, return empty
  if (!assessmentData || typeof assessmentData !== 'object') {
    return [];
  }

  // Handle both direct object and nested structures
  const dataToProcess = assessmentData.assessmentDetails || assessmentData;

  return Object.entries(dataToProcess).map(([toolName, data]) => {
    const normalized = toolName.toLowerCase();
    const meta = (() => {
      if (normalized.includes('isaa') || normalized.includes('autism')) {
        return { badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300', icon: <Sparkles className="h-4 w-4" /> };
      }
      if (normalized.includes('speech') || normalized.includes('language')) {
        return { badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <Activity className="h-4 w-4" /> };
      }
      if (normalized.includes('motor')) {
        return { badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', icon: <TrendingUp className="h-4 w-4" /> };
      }
      if (normalized.includes('sensory')) {
        return { badge: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300', icon: <AlertTriangle className="h-4 w-4" /> };
      }
      return { badge: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300', icon: <ClipboardList className="h-4 w-4" /> };
    })();

    return {
      id: toolName.toLowerCase().replace(/\s+/g, '_'),
      displayName: toolName.replace(/_/g, ' ').toUpperCase(),
      badgeClass: meta.badge,
      icon: meta.icon,
      data
    };
  });
};

const formatNestedValue = (value: unknown, depth = 0): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="italic text-slate-400">Not recorded</span>;
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }

  if (typeof value === 'number') {
    return <span>{value}</span>;
  }

  if (typeof value === 'string') {
    return <span>{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-slate-400">No entries</span>;
    }

    return (
      <ul className={cn('space-y-2', depth > 0 && 'mt-2 ml-4 list-disc')}>
        {value.map((item, index) => (
          <li key={index} className="text-sm text-slate-600 dark:text-slate-300">
            {formatNestedValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="italic text-slate-400">No data recorded</span>;
    }

    return (
      <div className={cn('space-y-2', depth > 0 && 'border-l border-slate-200 pl-4 dark:border-slate-800')}>
        {entries.map(([key, nested]) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {key.replace(/_/g, ' ')}
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {formatNestedValue(nested, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

const ProgressAnalysisDetail: React.FC = () => {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();
  const {
    littleLearners,
    backendSessions,
    childGoalsByLearner,
    childGoalsLoading,
    getChildGoalsForLearner
  } = useData();

  const selectedLearnerId = learnerId ?? '';
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [expandedAssessments, setExpandedAssessments] = useState<Record<string, boolean>>({});
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [chartReferenceDate, setChartReferenceDate] = useState<Date>(() => getMonthStart(new Date()));
  const [calendarSelection, setCalendarSelection] = useState<Date>(() => getMonthStart(new Date()));
  const [showMedicalDiagnosis, setShowMedicalDiagnosis] = useState(true);

  const selectedLearner = useMemo(() => {
    if (!selectedLearnerId) {
      return null;
    }
    return littleLearners.find((learner) => learner.id === selectedLearnerId) ?? null;
  }, [littleLearners, selectedLearnerId]);

  const sessionsForLearner = useMemo(() => {
    if (!selectedLearnerId) {
      return [] as BackendSession[];
    }
    return backendSessions
      .filter((session) => String(session.child_id) === selectedLearnerId)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  }, [backendSessions, selectedLearnerId]);

  const monthlySummary: MonthlySummary[] = useMemo(() => {
    const baseSummary = buildEmptyMonthlySummary(chartReferenceDate);
    const map = new Map(baseSummary.map((entry) => [entry.monthKey, { ...entry }]));

    sessionsForLearner.forEach((session) => {
      const sessionDate = parseISO(session.session_date);
      if (Number.isNaN(sessionDate.getTime())) {
        return;
      }
      const monthKey = format(sessionDate, 'yyyy-MM');
      const monthEntry = map.get(monthKey);
      if (!monthEntry) {
        return;
      }

      monthEntry.totalSessions += 1;
      if ((session.status ?? '').toLowerCase() === 'completed') {
        monthEntry.completedSessions += 1;
      }
      monthEntry.plannedActivities += Number(session.total_planned_activities ?? 0);
      monthEntry.completedActivities += Number(session.completed_activities ?? 0);
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      attendanceRate: entry.totalSessions > 0
        ? Math.round((entry.completedSessions / entry.totalSessions) * 100)
        : 0
    }));
  }, [chartReferenceDate, sessionsForLearner]);

  const goalSummary: GoalSummary = useMemo(() => {
    if (!selectedLearnerId) {
      return { total: 0, toDo: 0, inProgress: 0, mastered: 0, successRate: 0 };
    }
    const goals: ChildGoal[] = childGoalsByLearner[selectedLearnerId] ?? [];
    if (goals.length === 0) {
      return { total: 0, toDo: 0, inProgress: 0, mastered: 0, successRate: 0 };
    }

    const summary = goals.reduce(
      (acc, goal) => {
        const status = (goal.current_status ?? 'to_do').toLowerCase();
        if (status.includes('progress')) {
          acc.inProgress += 1;
        } else if (status.includes('master') || status.includes('complete')) {
          acc.mastered += 1;
        } else {
          acc.toDo += 1;
        }

        if (goal.total_attempts && goal.successful_attempts) {
          acc.successRef.totalAttempts += goal.total_attempts;
          acc.successRef.successfulAttempts += goal.successful_attempts;
        }
        return acc;
      },
      {
        toDo: 0,
        inProgress: 0,
        mastered: 0,
        successRef: { totalAttempts: 0, successfulAttempts: 0 }
      }
    );

    const total = goals.length;
    const successRate = summary.successRef.totalAttempts > 0
      ? Math.round((summary.successRef.successfulAttempts / summary.successRef.totalAttempts) * 100)
      : Math.round((summary.mastered / total) * 100);

    return {
      total,
      toDo: summary.toDo,
      inProgress: summary.inProgress,
      mastered: summary.mastered,
      successRate
    };
  }, [childGoalsByLearner, selectedLearnerId]);

  const aggregateActivities = useMemo(() => {
    if (sessionsForLearner.length === 0) {
      return { planned: 0, completed: 0 };
    }
    return sessionsForLearner.reduce(
      (acc, session) => {
        acc.planned += Number(session.total_planned_activities ?? 0);
        acc.completed += Number(session.completed_activities ?? 0);
        return acc;
      },
      { planned: 0, completed: 0 }
    );
  }, [sessionsForLearner]);

  const learnerSessionsStats = useMemo(() => {
    if (sessionsForLearner.length === 0) {
      return { total: 0, completed: 0, scheduled: 0 };
    }
    return sessionsForLearner.reduce(
      (acc, session) => {
        acc.total += 1;
        const status = (session.status ?? '').toLowerCase();
        if (status === 'completed') {
          acc.completed += 1;
        }
        if (status === 'scheduled' || status === 'upcoming' || status === 'pending') {
          acc.scheduled += 1;
        }
        return acc;
      },
      { total: 0, completed: 0, scheduled: 0 }
    );
  }, [sessionsForLearner]);

  const assessmentTools = useMemo(() => getAssessmentTools(selectedLearner ?? undefined), [selectedLearner]);
  const medicalDiagnosis = selectedLearner?.medicalDiagnosis;
  const isGoalsLoading = selectedLearnerId ? Boolean(childGoalsLoading[selectedLearnerId]) : false;
  const selectedLearnerStatusLabel = selectedLearner?.status
    ? selectedLearner.status.replace(/_/g, ' ')
    : 'Not specified';
  const activityCompletionRate = aggregateActivities.planned > 0
    ? Math.round((aggregateActivities.completed / aggregateActivities.planned) * 100)
    : 0;
  const generatedTimestamp = useMemo(
    () => (selectedLearner ? format(new Date(), 'MMMM dd, yyyy HH:mm') : ''),
    [selectedLearner]
  );

  useEffect(() => {
    if (!selectedLearnerId) {
      return;
    }
    void getChildGoalsForLearner(selectedLearnerId);
  }, [selectedLearnerId, getChildGoalsForLearner]);

  useEffect(() => {
    if (assessmentTools.length > 0) {
      setExpandedAssessments({ [assessmentTools[0].id]: true });
    } else {
      setExpandedAssessments({});
    }
  }, [assessmentTools]);

  useEffect(() => {
    setIsDiagnosisOpen(true);
  }, [selectedLearnerId]);

  useEffect(() => {
    if (selectedLearner && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedLearner]);

  useEffect(() => {
    const monthStart = getMonthStart(new Date());
    setChartReferenceDate(monthStart);
    setCalendarSelection(monthStart);
  }, [selectedLearnerId]);

  const handleRefreshGoals = () => {
    if (!selectedLearnerId) {
      return;
    }
    void getChildGoalsForLearner(selectedLearnerId, { force: true });
  };

  const handleAssessmentToggle = (id: string) => {
    setExpandedAssessments((previous) => ({
      ...previous,
      [id]: !previous[id]
    }));
  };

  const handleDownloadReport = async () => {
    if (!selectedLearner || !reportRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        ignoreElements: (element: Element) => (element as HTMLElement)?.getAttribute?.('data-exclude-from-pdf') === 'true'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.setProperties({
        title: `${selectedLearner.name} - ThrivePath Report`,
        author: 'ThrivePath',
        subject: 'Learner Progress Report'
      });

      const sanitizedName = selectedLearner.name.replace(/\s+/g, '_').toLowerCase();
      pdf.save(`${sanitizedName}_report.pdf`);

      // Track activity for report generation
      window.dispatchEvent(new CustomEvent('activityAdded', { 
        detail: { 
          message: `Downloaded progress report for ${selectedLearner.name}`,
          type: 'report'
        }
      }));
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenCalendar = () => {
    setCalendarSelection(new Date(chartReferenceDate));
    setIsCalendarDialogOpen(true);
  };

  const handleApplyCalendarSelection = () => {
    setChartReferenceDate(getMonthStart(calendarSelection));
    setIsCalendarDialogOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-10 top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/25 to-blue-500/25 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-16 left-12 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/25 to-cyan-400/25 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-6 xl:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3" data-exclude-from-pdf="true">
          <Button
            variant="ghost"
            onClick={() => navigate('/progress-analysis')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Progress Analysis
          </Button>
          <div className="flex flex-wrap gap-3">
            {selectedLearner && (
              <Button
                onClick={handleDownloadReport}
                disabled={isExporting}
                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg hover:from-violet-500 hover:to-blue-500"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleRefreshGoals}
              disabled={!selectedLearnerId}
              className="border-slate-300 dark:border-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {!selectedLearner && (
          <Card className="rounded-3xl border border-dashed border-slate-300/80 bg-white/90 shadow-none dark:border-slate-700/80 dark:bg-slate-950/70">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Select a learner to open their report</CardTitle>
              <CardDescription>
                Head back to the Progress Analysis roster to choose a learner and explore their sessions, activities, progress metrics, and clinical documentation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/progress-analysis')} variant="outline">
                Go to roster
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedLearner && (
          <>
            <div
              ref={reportRef}
              id="report-detail"
              className="space-y-8 rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-2xl dark:border-slate-800/70 dark:bg-slate-950/80"
            >
              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-100 via-white to-slate-100 p-6 shadow-sm dark:border-slate-800/70 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Progress Analysis</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Clinical Progress Report</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Comprehensive view of learner outcomes, engagement, and documentation.</p>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-300">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Generated on</p>
                    <p>{generatedTimestamp}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Report ID: TP-{selectedLearnerId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Learner overview</p>
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{selectedLearner.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Primary enrollment on {formatDateDisplay(selectedLearner.enrollmentDate)} · Status: {selectedLearnerStatusLabel}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-5 shadow-sm dark:border-slate-800/70">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Session Attendance</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{learnerSessionsStats.completed}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">of {learnerSessionsStats.total} completed</span>
                  </div>
                  <ProgressIndicator
                    value={learnerSessionsStats.completed}
                    max={Math.max(1, learnerSessionsStats.total)}
                    size="sm"
                    variant="linear"
                    color="purple"
                    showLabel={false}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Upcoming Sessions</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="text-xl font-semibold text-slate-900 dark:text-white">{learnerSessionsStats.scheduled}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Scheduled and ready to go</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Activity Completion</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{activityCompletionRate}%</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">completion rate</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{aggregateActivities.completed}/{aggregateActivities.planned} activities</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Goal Mastery</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xl font-semibold text-slate-900 dark:text-white">{goalSummary.mastered}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mastered goals to date</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2 rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>Monthly Session &amp; Activity Trend</CardTitle>
                        <CardDescription>Showing the six-month window anchored to your selected month.</CardDescription>
                      </div>
                      <Button
                        type="button"
                        onClick={handleOpenCalendar}
                        className="bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        data-exclude-from-pdf="true"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(chartReferenceDate, 'MMM yyyy')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[340px]">x  
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlySummary} margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid hsl(var(--border))',
                            backgroundColor: 'hsl(var(--background))'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="plannedActivities" name="Planned" fill="hsl(258 100% 70%)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="completedActivities" name="Completed" fill="hsl(221 83% 65%)" radius={[6, 6, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="attendanceRate"
                          name="Attendance %"
                          stroke="hsl(142 76% 45%)"
                          strokeWidth={3}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <CardHeader>
                    <CardTitle>Goal Progress Snapshot</CardTitle>
                    <CardDescription>Overview of goal statuses and success rates derived from child goals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isGoalsLoading ? (
                      <div className="flex h-48 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                        Loading goal insights...
                      </div>
                    ) : goalSummary.total === 0 ? (
                      <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
                        No goals have been assigned yet for this learner.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <ProgressIndicator
                          value={goalSummary.successRate}
                          label="Estimated success rate"
                          size="lg"
                          variant="circular"
                          color="green"
                        />
                        <div className="grid gap-3">
                          <GoalStatusPill label="To Do" value={goalSummary.toDo} accent="bg-slate-50 dark:bg-slate-900/60" />
                          <GoalStatusPill label="In Progress" value={goalSummary.inProgress} accent="bg-blue-50 dark:bg-blue-900/20" />
                          <GoalStatusPill label="Mastered" value={goalSummary.mastered} accent="bg-emerald-50 dark:bg-emerald-900/20" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                <CardHeader>
                  <CardTitle>Session Activity Log</CardTitle>
                  <CardDescription>Detailed view of session status, planned activities, and captured notes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionsForLearner.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                      This learner has no recorded sessions yet.
                    </div>
                  ) : (
                    sessionsForLearner.slice(0, 6).map((session) => {
                      const completionRate = session.total_planned_activities > 0
                        ? Math.round((session.completed_activities / session.total_planned_activities) * 100)
                        : 0;

                      return (
                        <div
                          key={session.id}
                          className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition-colors dark:border-slate-800/70 dark:bg-slate-950/70"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {formatDateDisplay(session.session_date)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{session.start_time} – {session.end_time}</p>
                            </div>
                            <Badge
                              className={cn(
                                'uppercase tracking-wide text-xs font-semibold px-3 py-1',
                                session.status === 'completed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                                session.status === 'scheduled' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                session.status !== 'completed' && session.status !== 'scheduled' && 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
                              )}
                            >
                              {(session.status ?? 'unknown').replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Activity Completion</p>
                              <ProgressIndicator
                                value={session.completed_activities}
                                max={Math.max(1, session.total_planned_activities)}
                                size="sm"
                                variant="linear"
                                color="blue"
                                label={`Completed ${session.completed_activities}/${session.total_planned_activities} (${completionRate}%)`}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {session.therapist_notes || 'No therapist notes recorded for this session.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Clinical Documentation</CardTitle>
                      <CardDescription>Medical diagnosis summaries and assessment records captured for this learner.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800" data-exclude-from-pdf="true">
                      <button
                        type="button"
                        onClick={() => setShowMedicalDiagnosis(true)}
                        className={cn(
                          'rounded-md px-4 py-2 text-sm font-medium transition-all',
                          showMedicalDiagnosis
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        )}
                      >
                        Medical Diagnosis
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMedicalDiagnosis(false)}
                        className={cn(
                          'rounded-md px-4 py-2 text-sm font-medium transition-all',
                          !showMedicalDiagnosis
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        )}
                      >
                        Assessment Details
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showMedicalDiagnosis ? (
                    <CollapsibleCard
                      title="Medical Diagnosis"
                      subtitle="Structured overview sourced from clinical intake."
                      icon={<Stethoscope className="h-4 w-4" />}
                      iconClassName="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                      isOpen={isDiagnosisOpen}
                      onToggle={() => setIsDiagnosisOpen((previous) => !previous)}
                    >
                      {medicalDiagnosis ? (
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">{formatNestedValue(medicalDiagnosis)}</div>
                      ) : (
                        <span className="italic text-slate-500">No medical diagnosis data has been recorded.</span>
                      )}
                    </CollapsibleCard>
                  ) : (
                    <>
                      {assessmentTools.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300/60 bg-white/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
                          No assessment data has been associated with this learner yet.
                        </div>
                      ) : (
                        assessmentTools.map((tool) => {
                          const isOpen = expandedAssessments[tool.id] ?? false;
                          return (
                            <CollapsibleCard
                              key={tool.id}
                              title={tool.displayName}
                              subtitle="Assessment insights"
                              icon={tool.icon}
                              iconClassName={cn(tool.badgeClass)}
                              isOpen={isOpen}
                              onToggle={() => handleAssessmentToggle(tool.id)}
                            >
                              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">{formatNestedValue(tool.data)}</div>
                            </CollapsibleCard>
                          );
                        })
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

          </>
        )}
      </div>

      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen} containerClassName="max-w-md">
        <DialogContent data-exclude-from-pdf="true">
          <DialogHeader>
            <DialogTitle>Select Chart Month</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <DateSelectionCalendar
              mode="single"
              selected={calendarSelection}
              onSelect={setCalendarSelection}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyCalendarSelection}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressAnalysisDetail;
