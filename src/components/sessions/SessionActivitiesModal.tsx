import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Loader2,
  Plus,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  X,
  XCircle,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { statusDisplayLabel } from '../../utils/sessionUtils';
import { API_BASE_URL } from '../../config/api';

interface SessionActivity {
  id: number;
  session_id: number;
  child_goal_id: number;
  actual_duration: number;
  performance_notes?: string;
  created_at: string;
  updated_at: string;
  child_id?: number;
  activity_id?: number;
  activity_name?: string;
  activity_description?: string;
  domain?: string;
  difficulty_level?: number;
  estimated_duration?: number;
  current_status?: string;
}

interface ChildGoal {
  id: number;
  child_id: number;
  activity_id: number;
  current_status?: string;
  total_attempts?: number;
  successful_attempts?: number;
  date_started?: string;
  date_mastered?: string;
  last_attempted?: string;
  created_at: string;
  updated_at: string;
  activity_name: string;
  activity_description?: string;
  domain?: string;
  difficulty_level?: number;
  estimated_duration?: number;
}

interface Session {
  id: number;
  child_id: number;
  student_name?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_planned_activities: number;
  completed_activities: number;
  therapist_notes?: string;
}

interface SessionActivitiesModalProps {
  session: Session;
  onClose: () => void;
  onUpdate?: () => void;
}


type AiMessageKind = 'text' | 'activities' | 'system';



interface ActivitySuggestion {
  id: string;
  activity_name: string;
  duration_minutes: number | null;
  detailed_description: string;
  reason_for_recommendation: string;
  category?: string;
  difficulty?: string;
  materials?: string[];
  goals?: string[];
  instructions?: string[];
  adaptations?: string[];
  safety_notes?: string[];
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  kind: AiMessageKind;
  content?: string;
  attachmentLabel?: string;
  attachmentSource?: string;
  attachedActivities?: FocusContextActivity[];
  instruction?: string;
  activities?: ActivitySuggestion[];
  status?: 'error';
  timestamp: Date;
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

interface FocusContextActivity {
  activity_id?: number;
  child_goal_id?: number;
  activity_name?: string;
  domain?: string;
  description?: string;
  estimated_duration?: number;
  actual_duration?: number;
  performance_notes?: string;
  difficulty_level?: number;
  status?: string;
}

interface PinnedFocusContext {
  label: string;
  source?: string;
  activities: FocusContextActivity[];
}

export const SessionActivitiesModal: React.FC<SessionActivitiesModalProps> = ({ session, onClose, onUpdate }) => {
  const { littleLearners, getChildGoalsForLearner } = useData();
  const [sessionActivities, setSessionActivities] = useState<SessionActivity[]>([]);
  const [availableChildGoals, setAvailableChildGoals] = useState<ChildGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageActivities, setShowManageActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiVisible, setIsAiVisible] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isInitializingAi, setIsInitializingAi] = useState(false);
  const [assigningSuggestionId, setAssigningSuggestionId] = useState<string | null>(null);
  const [aiWelcomeShown, setAiWelcomeShown] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [aiPanelWidth, setAiPanelWidth] = useState(520);
  const [isResizingAiPanel, setIsResizingAiPanel] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showCustomActivitySelector, setShowCustomActivitySelector] = useState(false);
  const [activityAttachmentError, setActivityAttachmentError] = useState<string | null>(null);
  const [focusContext, setFocusContext] = useState<PinnedFocusContext | null>(null);
  const [customActivitySelection, setCustomActivitySelection] = useState<Record<number, boolean>>({});
  const [activityInstruction, setActivityInstruction] = useState('');
  const [showActivityInstructionBox, setShowActivityInstructionBox] = useState(false);
  const [expandedAttachmentMessages, setExpandedAttachmentMessages] = useState<Record<string, boolean>>({});
  const [showAddCustomActivity, setShowAddCustomActivity] = useState(false);
  const [customActivityForm, setCustomActivityForm] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    duration: 30
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const learner = useMemo(
    () => littleLearners.find((candidate) => Number(candidate.id) === Number(session.child_id)),
    [littleLearners, session.child_id]
  );
  const learnerId = learner?.id ?? String(session.child_id);

  const handleClose = useCallback(() => {
    setIsAiVisible(false);
    setShowManageActivities(false);
    onClose();
  }, [onClose]);

  const handleOpenManageActivities = useCallback(() => {
    setShowManageActivities(true);
  }, []);

  const fetchSessionActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to load session activities.');
      }

      const data: SessionActivity[] = await response.json();
      setSessionActivities(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session activities.';
      setError(message);
    }
  }, [session.id]);

  const fetchAvailableChildGoals = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/students/${session.child_id}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to load learner goals.');
      }

      const data: ChildGoal[] = await response.json();
      setAvailableChildGoals(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load learner goals.';
      setError(message);
    }
  }, [session.child_id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSessionActivities(), fetchAvailableChildGoals()]).finally(() => {
      setLoading(false);
    });
  }, [fetchSessionActivities, fetchAvailableChildGoals]);

  const handleCloseManageActivities = useCallback(() => {
    setShowManageActivities(false);
    void loadData(); // Refresh data when closing manage activities
  }, [loadData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isAiVisible || !learnerId) {
      return;
    }

    void getChildGoalsForLearner(learnerId, { force: false }).catch(() => undefined);
  }, [getChildGoalsForLearner, isAiVisible, learnerId]);

  useEffect(() => {
    if (!isAiVisible || aiWelcomeShown) {
      return;
    }

    const learnerName = learner?.name || session.student_name || 'your learner';
    const welcomeMessage: AiMessage = {
      id: createMessageId(),
      role: 'assistant',
      kind: 'text',
      content: `Hi! I'm ready to help you plan this session for ${learnerName}. Ask me for fresh activity ideas or let me know what type of goals you'd like to focus on.`,
      timestamp: new Date()
    };

    setAiMessages((prev) => (prev.length === 0 ? [welcomeMessage] : prev));
    setAiWelcomeShown(true);
  }, [aiWelcomeShown, isAiVisible, learner?.name, session.student_name]);

  useEffect(() => {
    if (!isAiVisible) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const updateViewportFlag = () => setIsLargeScreen(window.innerWidth >= 1024);
    updateViewportFlag();
    window.addEventListener('resize', updateViewportFlag);
    return () => window.removeEventListener('resize', updateViewportFlag);
  }, []);

  useEffect(() => {
    if (!isResizingAiPanel || typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const candidateWidth = window.innerWidth - event.clientX;
      const clampedWidth = Math.min(Math.max(candidateWidth, 320), 560);
      setAiPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingAiPanel(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingAiPanel]);

  useEffect(() => {
    if (!isAiVisible) {
      setShowActivityPicker(false);
    }
  }, [isAiVisible]);

  useEffect(() => {
    setCustomActivitySelection((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((key) => {
        const id = Number(key);
        if (!sessionActivities.some((activity) => activity.id === id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [sessionActivities]);

  useEffect(() => {
    if (!showActivityPicker) {
      setActivityAttachmentError(null);
    }
  }, [showActivityPicker]);

  const addActivityToSession = useCallback(
    async (childGoalId: number, actualDuration?: number) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Missing access token. Please log in again.');
        }

        const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            child_goal_id: childGoalId,
            actual_duration: actualDuration ?? 30,
            performance_notes: ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Failed to add activity to session.');
        }

        await fetchSessionActivities();
        await fetchAvailableChildGoals();
        await onUpdate?.();
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add activity to session.';
        setError(message);
        throw new Error(message);
      }
    },
    [fetchAvailableChildGoals, fetchSessionActivities, onUpdate, session.id]
  );

  const removeActivityFromSession = useCallback(
    async (activityId: number) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Missing access token. Please log in again.');
        }

        const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/activities/${activityId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Failed to remove activity from session.');
        }

        await fetchSessionActivities();
        await fetchAvailableChildGoals();
        await onUpdate?.();
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove activity from session.';
        setError(message);
      }
    },
    [fetchAvailableChildGoals, fetchSessionActivities, onUpdate, session.id]
  );

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const buildLearnerProfile = useCallback(() => {
    const goalsFromContext = availableChildGoals.map((goal) => goal.activity_name || `Goal #${goal.id}`);

    return {
      name: learner?.name || session.student_name || 'Learner',
      age: learner?.age,
      medicalDiagnosis: learner?.medicalDiagnosis,
      profileDetails: learner?.profileDetails,
      assessmentDetails: learner?.assessmentDetails,
      goals: goalsFromContext.length > 0 ? goalsFromContext : learner?.goals,
      sessionContext: {
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        total_planned_activities: session.total_planned_activities,
        completed_activities: session.completed_activities
      }
    };
  }, [availableChildGoals, learner, session]);

  const initializeAiSession = useCallback(async () => {
    if (aiSessionId || isInitializingAi) {
      return aiSessionId;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Missing access token. Please log in again.');
      }

      const learnerProfile = buildLearnerProfile();
      setIsInitializingAi(true);

      const response = await fetch(`${API_BASE_URL}/api/activities/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ learner_profile: learnerProfile })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.session_id) {
        throw new Error(data?.detail || 'Failed to start AI planning session.');
      }

      setAiSessionId(data.session_id);
      return data.session_id as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start AI planning session.';
      const failureMessage: AiMessage = {
        id: createMessageId(),
        role: 'assistant',
        kind: 'system',
        content: `I couldn't prepare the AI assistant yet: ${message}`,
        status: 'error',
        timestamp: new Date()
      };
      setAiMessages((prev) => [...prev, failureMessage]);
      return null;
    } finally {
      setIsInitializingAi(false);
    }
  }, [aiSessionId, buildLearnerProfile, isInitializingAi]);

  const ensureAiSession = useCallback(async () => {
    if (aiSessionId) {
      return aiSessionId;
    }
    return initializeAiSession();
  }, [aiSessionId, initializeAiSession]);

  const clearFocusContext = useCallback(() => {
    setFocusContext(null);
    setCustomActivitySelection({});
    setActivityAttachmentError(null);
    setShowActivityPicker(false);
    setShowCustomActivitySelector(false);
    setActivityInstruction('');
    setShowActivityInstructionBox(false);
  }, []);

  const handleSendAiMessage = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      const trimmed = aiInput.trim();
      if (!trimmed) {
        return;
      }

      const instructionToSend = activityInstruction.trim();
      const attachmentLabel = focusContext?.label;
      const attachmentSource = focusContext?.source;
      const attachedActivities = focusContext?.activities
        ? focusContext.activities.map((activity) => ({ ...activity }))
        : undefined;

      const userMessage: AiMessage = {
        id: createMessageId(),
        role: 'user',
        kind: 'text',
        content: trimmed,
        attachmentLabel,
        attachmentSource,
        attachedActivities,
        instruction: instructionToSend || undefined,
        timestamp: new Date()
      };
      setAiMessages((prev) => [...prev, userMessage]);

      // Clear inputs after capturing values
      setAiInput('');
      clearFocusContext();

      const token = localStorage.getItem('access_token');
      if (!token) {
        const warning: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'system',
          content: 'Please log in again to continue chatting with the AI assistant.',
          status: 'error',
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, warning]);
        return;
      }

      const activeSessionId = await ensureAiSession();
      if (!activeSessionId) {
        return;
      }

      setIsAiTyping(true);
      try {
        // Prepare focus context with activity details and instruction
        const focusContextPayload = attachedActivities && attachedActivities.length > 0
          ? {
            label: attachmentLabel,
            source: attachmentSource,
            activities: attachedActivities,
            instruction: instructionToSend || undefined
          }
          : undefined;

        const response = await fetch(`${API_BASE_URL}/api/activities/chat/session/${activeSessionId}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message: trimmed,
            focus_context: focusContextPayload
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'The AI assistant had trouble responding.');
        }

        const data = await response.json();
        const assistantMessages: AiMessage[] = (data?.messages ?? []).map((message: any) => ({
          id: createMessageId(),
          role: 'assistant',
          kind: message.kind as AiMessageKind,
          content: message.content ?? undefined,
          activities: message.activities ?? undefined,
          timestamp: new Date()
        }));

        if (assistantMessages.length > 0) {
          setAiMessages((prev) => [...prev, ...assistantMessages]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'The AI assistant could not respond right now.';
        const failure: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'system',
          content: message,
          status: 'error',
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, failure]);
      } finally {
        setIsAiTyping(false);
      }
    },
    [aiInput, activityInstruction, clearFocusContext, ensureAiSession, focusContext]
  );

  const handleAddSuggestionToSession = useCallback(
    async (suggestion: ActivitySuggestion) => {
      try {
        setAssigningSuggestionId(suggestion.id);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Missing access token. Please log in again.');
        }

        const response = await fetch(`${API_BASE_URL}/api/activities/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activity: suggestion,
            child_id: Number(learnerId)
          })
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'The activity could not be assigned.');
        }

        if (!result.child_goal_id) {
          throw new Error('The assigned activity did not return a goal identifier.');
        }

        await addActivityToSession(result.child_goal_id, suggestion.duration_minutes ?? undefined);

        // Refresh the child goals list to show the newly assigned activity
        await getChildGoalsForLearner(learnerId, { force: true });

        const successMessage: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'text',
          content: `✅ Added "${suggestion.activity_name}" to this session.`,
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, successMessage]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to add the suggested activity right now.';
        const failure: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'system',
          content: message,
          status: 'error',
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, failure]);
      } finally {
        setAssigningSuggestionId(null);
      }
    },
    [addActivityToSession, learnerId, getChildGoalsForLearner]
  );

  const handleAddSuggestionToGoalsOnly = useCallback(
    async (suggestion: ActivitySuggestion) => {
      try {
        setAssigningSuggestionId(suggestion.id);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Missing access token. Please log in again.');
        }

        const response = await fetch(`${API_BASE_URL}/api/activities/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activity: suggestion,
            child_id: Number(learnerId)
          })
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'The activity could not be assigned.');
        }

        // Refresh the child goals list to show the newly assigned activity
        await getChildGoalsForLearner(learnerId, { force: true });

        const successMessage: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'text',
          content: `✅ Added "${suggestion.activity_name}" to learner's goals.`,
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, successMessage]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to add the suggested activity right now.';
        const failure: AiMessage = {
          id: createMessageId(),
          role: 'assistant',
          kind: 'system',
          content: message,
          status: 'error',
          timestamp: new Date()
        };
        setAiMessages((prev) => [...prev, failure]);
      } finally {
        setAssigningSuggestionId(null);
      }
    },
    [learnerId, getChildGoalsForLearner]
  );

  const handleAddCustomActivity = useCallback(async () => {
    if (!customActivityForm.name.trim()) return;

    const suggestion: ActivitySuggestion = {
      id: `manual-${Date.now()}`,
      activity_name: customActivityForm.name,
      detailed_description: customActivityForm.description || 'Manually added by therapist',
      reason_for_recommendation: 'Manually added by therapist',
      difficulty: customActivityForm.difficulty,
      duration_minutes: Number(customActivityForm.duration),
      category: 'Clinical', // Default category
      materials: [],
      goals: [],
      instructions: [],
      adaptations: [],
      safety_notes: []
    };

    await handleAddSuggestionToSession(suggestion);
    setShowAddCustomActivity(false);
    setCustomActivityForm({
      name: '',
      description: '',
      difficulty: 'medium',
      duration: 30
    });
  }, [customActivityForm, handleAddSuggestionToSession]);

  const openAiPanel = useCallback(() => {
    setIsAiVisible(true);
  }, []);

  const closeAiPanel = useCallback(() => {
    setIsAiVisible(false);
  }, []);

  const renderAiMessage = (message: AiMessage) => {
    if (message.kind === 'activities' && message.activities?.length) {
      return (
        <div className="space-y-4">
          {message.activities.map((activity) => {
            const isProcessing = assigningSuggestionId === activity.id;
            return (
              <div
                key={activity.id}
                className="rounded-2xl border border-violet-200/60 bg-white/80 p-4 shadow-sm dark:border-violet-800/50 dark:bg-slate-900/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activity.activity_name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {activity.reason_for_recommendation}
                    </p>
                  </div>
                </div>

                {activity.detailed_description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {activity.detailed_description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {activity.duration_minutes && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800/70">
                      ⏱️ {activity.duration_minutes} min session
                    </span>
                  )}
                  {activity.difficulty && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 capitalize dark:bg-slate-800/70">
                      Difficulty: {activity.difficulty}
                    </span>
                  )}
                  {activity.category && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 capitalize dark:bg-slate-800/70">
                      {activity.category}
                    </span>
                  )}
                </div>

                {activity.goals && activity.goals.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
                    <strong className="font-semibold">Targets:</strong> {activity.goals.join(', ')}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleAddSuggestionToSession(activity)}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isProcessing ? 'Adding…' : 'Add To Session'}
                  </button>
                  <button
                    onClick={() => void handleAddSuggestionToGoalsOnly(activity)}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/70 bg-white px-4 py-2 text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-700/70 dark:bg-slate-900/70 dark:text-violet-300 dark:hover:bg-slate-800"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    Add to Goals Only
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (message.role === 'user') {
      const hasAttachments = Boolean(message.attachedActivities && message.attachedActivities.length > 0);
      const isExpanded = hasAttachments ? Boolean(expandedAttachmentMessages[message.id]) : false;
      const toggleAttachments = () => {
        if (!hasAttachments) {
          return;
        }
        setExpandedAttachmentMessages((prev) => ({
          ...prev,
          [message.id]: !isExpanded
        }));
      };

      return (
        <div className="ml-auto flex max-w-[85%] flex-col items-end gap-3 text-sm">
          {hasAttachments ? (
            <div className="w-full rounded-2xl border border-violet-200/70 bg-white/95 text-left shadow-sm dark:border-violet-900/40 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={toggleAttachments}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                    Activities Shared
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {message.attachmentLabel || 'Therapist-selected activities'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {message.attachedActivities?.length ?? 0} activities sent to the AI
                    {message.attachmentSource ? ` • Source: ${message.attachmentSource}` : ''}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-violet-500 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                />
              </button>

              {isExpanded && message.attachedActivities && (
                <div className="border-t border-violet-100/70 px-4 py-3 dark:border-violet-900/30">
                  <div className="space-y-3">
                    {message.attachedActivities.map((activity, index) => {
                      const activityKey = activity.activity_id ?? activity.child_goal_id ?? index;
                      const statusLabel = activity.status
                        ? activity.status
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (char) => char.toUpperCase())
                        : null;
                      return (
                        <div
                          key={`attached-activity-${activityKey}-${index}`}
                          className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {activity.activity_name || 'Activity'}
                            </p>
                            {statusLabel && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:bg-violet-900/40 dark:text-violet-200">
                                {statusLabel}
                              </span>
                            )}
                          </div>
                          {activity.description && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {activity.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            {activity.domain && (
                              <span className="rounded-full bg-white px-2 py-0.5 dark:bg-slate-800/60">
                                Domain: {activity.domain}
                              </span>
                            )}
                            {activity.estimated_duration !== undefined && activity.estimated_duration !== null && (
                              <span className="rounded-full bg-white px-2 py-0.5 dark:bg-slate-800/60">
                                Est: {activity.estimated_duration} min
                              </span>
                            )}
                            {activity.actual_duration !== undefined && activity.actual_duration !== null && (
                              <span className="rounded-full bg-white px-2 py-0.5 dark:bg-slate-800/60">
                                Actual: {activity.actual_duration} min
                              </span>
                            )}
                            {typeof activity.difficulty_level === 'number' && (
                              <span className="rounded-full bg-white px-2 py-0.5 dark:bg-slate-800/60">
                                Level {activity.difficulty_level}
                              </span>
                            )}
                          </div>
                          {activity.performance_notes && (
                            <p className="mt-2 rounded-lg border border-blue-200/60 bg-blue-50/70 px-2 py-1 text-[10px] text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
                              Notes: {activity.performance_notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {message.instruction && (
            <div className="w-full rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              <span className="font-semibold">Therapist request:</span> {message.instruction}
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm leading-relaxed text-white shadow">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${message.status === 'error'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
          }`}
      >
        {message.content}
      </div>
    );
  };

  const uniqueSessionActivities = useMemo(() => sessionActivities, [sessionActivities]);

  const categorizedActivities = useMemo(() => {
    const pending: SessionActivity[] = [];
    const completed: SessionActivity[] = [];

    sessionActivities.forEach((activity) => {
      const status = activity.current_status || ((activity.actual_duration ?? 0) > 0 ? 'completed' : 'pending');
      if (status === 'completed') {
        completed.push(activity);
      } else {
        pending.push(activity);
      }
    });

    return { pending, completed };
  }, [sessionActivities]);

  const pendingActivitiesForContext = categorizedActivities.pending;
  const completedActivitiesForContext = categorizedActivities.completed;

  const selectedCustomCount = useMemo(
    () => Object.values(customActivitySelection).filter(Boolean).length,
    [customActivitySelection]
  );

  const normalizeActivityForFocus = useCallback(
    (activity: SessionActivity, overrideStatus?: string): FocusContextActivity => ({
      activity_id: activity.activity_id,
      child_goal_id: activity.child_goal_id,
      activity_name: activity.activity_name,
      domain: activity.domain,
      description: activity.activity_description,
      estimated_duration: activity.estimated_duration,
      actual_duration: activity.actual_duration,
      performance_notes: activity.performance_notes,
      difficulty_level: activity.difficulty_level,
      status:
        overrideStatus ??
        activity.current_status ??
        ((activity.actual_duration ?? 0) > 0 ? 'completed' : 'planned')
    }),
    []
  );

  const attachFocusContext = useCallback(
    (activities: SessionActivity[], label: string, source: string, overrideStatus?: string) => {
      if (!activities.length) {
        setActivityAttachmentError('No activities are available for that selection.');
        return;
      }
      const normalized = activities.map((activity) => normalizeActivityForFocus(activity, overrideStatus));
      setFocusContext({
        label,
        source,
        activities: normalized
      });
      setActivityAttachmentError(null);
      setShowActivityPicker(false);
      setShowActivityInstructionBox(true); // Show the instruction box when activities are attached
    },
    [normalizeActivityForFocus]
  );

  const handleAttachPendingActivities = useCallback(() => {
    attachFocusContext(pendingActivitiesForContext, 'To-Do session activities', 'Session plan (to-do)', 'pending');
  }, [attachFocusContext, pendingActivitiesForContext]);

  const handleAttachCompletedActivities = useCallback(() => {
    attachFocusContext(completedActivitiesForContext, 'Completed session activities', 'Session plan (completed)', 'completed');
  }, [attachFocusContext, completedActivitiesForContext]);

  const handleAttachCustomActivities = useCallback(() => {
    const selectedIds = Object.entries(customActivitySelection)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => Number(id));

    const selectedGoals = availableChildGoals.filter((goal) => selectedIds.includes(goal.id));

    const activities: FocusContextActivity[] = selectedGoals.map(goal => ({
      activity_id: goal.activity_id,
      child_goal_id: goal.id,
      activity_name: goal.activity_name,
      domain: goal.domain,
      description: goal.activity_description,
      estimated_duration: goal.estimated_duration,
      difficulty_level: goal.difficulty_level,
      status: 'goal'
    } as FocusContextActivity));

    if (!activities.length) {
      setActivityAttachmentError('No activities are available for that selection.');
      return;
    }

    setFocusContext({
      label: 'Therapist-curated activities',
      source: 'Custom selection',
      activities
    });
    setActivityAttachmentError(null);
    setShowActivityPicker(false);
    setShowActivityInstructionBox(true); // Show the instruction box
    if (activities.length) {
      setCustomActivitySelection({});
    }
  }, [customActivitySelection, availableChildGoals]);

  const toggleCustomActivitySelection = useCallback((activityId: number) => {
    setCustomActivitySelection((prev) => {
      const next = { ...prev, [activityId]: !prev[activityId] };
      if (!next[activityId]) {
        delete next[activityId];
      }
      return next;
    });
  }, []);

  const startAiPanelResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsResizingAiPanel(true);
  }, []);

  const aiPanelStyle = useMemo(() => {
    if (!isLargeScreen) {
      return undefined;
    }
    const clampedWidth = Math.round(Math.min(Math.max(aiPanelWidth, 420), 720));
    return { width: clampedWidth };
  }, [aiPanelWidth, isLargeScreen]);

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="active-session-activities"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-violet-900/10 to-blue-900/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 overflow-hidden px-4 py-6 sm:px-6 lg:px-10"
        >
          <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/85">
            <header className="flex flex-col gap-6 border-b border-white/20 px-6 py-6 dark:border-slate-800/60 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <button
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200/70 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Back to session details"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-500/80">Session Activities</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {session.student_name || 'Session Plan'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(session.session_date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    • {session.start_time} – {session.end_time} • {statusDisplayLabel(session.status)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleOpenManageActivities}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 dark:border-violet-800/60 dark:bg-slate-900/80 dark:text-violet-300 dark:hover:bg-violet-900/30"
                >
                  <Plus className="h-4 w-4" />
                  Manage Activities
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddCustomActivity(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 dark:border-violet-800/60 dark:bg-slate-900/80 dark:text-violet-300 dark:hover:bg-violet-900/30"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Activity
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openAiPanel}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Chat With AI
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void handleRefresh()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              </div>
            </header>

            <div className="relative flex flex-1 overflow-hidden">
              {!showManageActivities ? (
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {loading && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating session activities…
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-200">
                      {error}
                    </div>
                  )}

                  {uniqueSessionActivities.length === 0 && !loading ? (
                    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200/70 bg-white/80 text-center shadow-inner dark:border-slate-800/60 dark:bg-slate-900/50">
                      <Target className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No activities yet</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Add activities manually or let the AI assistant recommend personalized options.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenManageActivities}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Activity
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {uniqueSessionActivities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition hover:border-violet-200 dark:border-slate-800/60 dark:bg-slate-900/70"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                  {activity.activity_name || 'Activity'}
                                </h3>
                                {activity.difficulty_level && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getDifficultyColor(
                                      activity.difficulty_level
                                    )}`}
                                  >
                                    Level {activity.difficulty_level}
                                  </span>
                                )}
                              </div>
                              {activity.activity_description && (
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                  {activity.activity_description}
                                </p>
                              )}
                              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" /> Actual duration: {activity.actual_duration} min
                                </span>
                                {activity.estimated_duration && (
                                  <span className="inline-flex items-center gap-1">
                                    <Target className="h-3.5 w-3.5" /> Estimated: {activity.estimated_duration} min
                                  </span>
                                )}
                              </div>
                              {activity.performance_notes && (
                                <div className="mt-3 rounded-xl border border-blue-200/70 bg-blue-50/70 p-3 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                                  <strong className="font-semibold">Performance Notes:</strong> {activity.performance_notes}
                                </div>
                              )}
                            </div>
                            {/* Only show delete button if activity is NOT completed */}
                            {!(activity.current_status === 'completed' || (activity.actual_duration && activity.actual_duration > 0)) && (
                              <button
                                onClick={() => void removeActivityFromSession(activity.id)}
                                className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                aria-label="Remove activity from session"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <ManageActivitiesInline
                  availableChildGoals={availableChildGoals}
                  sessionActivities={sessionActivities}
                  onClose={handleCloseManageActivities}
                  onAdd={(childGoalId, actualDuration) => void addActivityToSession(childGoalId, actualDuration)}
                />
              )}

              <AnimatePresence>
                {isAiVisible && !showManageActivities && (
                  <motion.aside
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    className="absolute inset-y-0 right-0 z-20 flex h-full w-full flex-col overflow-hidden border-t border-l border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/95 lg:static lg:h-full lg:w-auto lg:max-w-[720px] lg:relative"
                    style={aiPanelStyle}
                  >
                    {isLargeScreen && (
                      <div
                        className="absolute left-0 top-0 hidden h-full w-4 -translate-x-2 cursor-col-resize items-center justify-center lg:flex"
                        onMouseDown={startAiPanelResize}
                        role="separator"
                        aria-orientation="vertical"
                      >
                        <span className="h-14 w-[3px] rounded-full bg-slate-300 dark:bg-slate-700" />
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 dark:border-slate-800/60">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500/80">
                          AI Activity
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Smart Suggestions</h3>
                      </div>
                      <button
                        onClick={closeAiPanel}
                        className="rounded-full border border-slate-200/60 bg-white/80 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Close AI assistant"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
                      {focusContext && (
                        <div className="rounded-2xl border border-violet-200/70 bg-violet-50/80 p-4 text-xs text-slate-600 shadow-sm dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-200">
                                Pinned Session Context
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {focusContext.label}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                                {focusContext.activities.length} activities shared with the AI
                                {focusContext.source ? ` - Source: ${focusContext.source}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={clearFocusContext}
                              className="rounded-full border border-slate-200/70 bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}

                      {aiMessages.map((message) => (
                        <div key={message.id} className="flex w-full flex-col">
                          {renderAiMessage(message)}
                        </div>
                      ))}
                      {isAiTyping && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Thinking…
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form
                      onSubmit={(event) => void handleSendAiMessage(event)}
                      className="relative border-t border-white/20 px-5 py-4 dark:border-slate-800/60"
                    >
                      {showActivityPicker && (
                        <div className="absolute inset-x-0 bottom-[96px] z-20 mx-5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xl dark:border-slate-800/60 dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-200">
                                Attach Activities
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Select which activities to share with the AI.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowActivityPicker(false)}
                              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              aria-label="Close"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleAttachPendingActivities()}
                              className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-200"
                            >
                              <span>All To-Do</span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                                {pendingActivitiesForContext.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAttachCompletedActivities()}
                              className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200"
                            >
                              <span>All Completed</span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                                {completedActivitiesForContext.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowActivityPicker(false);
                                setShowCustomActivitySelector(true);
                              }}
                              className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-200"
                            >
                              <span>Custom Activities</span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                                {availableChildGoals.length}
                              </span>
                            </button>
                          </div>

                          {activityAttachmentError && (
                            <p className="mt-3 text-xs font-semibold text-rose-500 dark:text-rose-300">
                              {activityAttachmentError}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Custom Activity Selector Popup */}
                      {showCustomActivitySelector && (
                        <div className="absolute inset-x-0 bottom-[96px] z-20 mx-5 max-h-[500px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-800/60 dark:bg-slate-900">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Select Custom Activities
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                Choose activities for {learner?.name || 'this child'} ({selectedCustomCount} selected)
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomActivitySelector(false);
                                setCustomActivitySelection({});
                                setActivityInstruction('');
                              }}
                              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              aria-label="Close"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="max-h-[280px] overflow-y-auto p-4 space-y-2">
                            {availableChildGoals.length > 0 ? (
                              availableChildGoals.map((goal) => {
                                const isInSession = sessionActivities.some(a => a.child_goal_id === goal.id);
                                return (
                                  <label
                                    key={`goal-${goal.id}`}
                                    className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-xs text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/30"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(customActivitySelection[goal.id])}
                                      onChange={() => toggleCustomActivitySelection(goal.id)}
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                          {goal.activity_name || goal.activity_description || 'Unnamed Goal'}
                                        </p>
                                        {isInSession && (
                                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
                                            In Session
                                          </span>
                                        )}
                                      </div>
                                      {goal.domain && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Domain: {goal.domain}</p>
                                      )}
                                      {goal.difficulty_level && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Level: {goal.difficulty_level}</p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            ) : (
                              <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
                                No activities or goals available for this child yet.
                              </p>
                            )}
                          </div>

                          {selectedCustomCount > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                              <button
                                type="button"
                                onClick={() => {
                                  handleAttachCustomActivities();
                                  setShowCustomActivitySelector(false);
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700"
                              >
                                <Paperclip className="h-4 w-4" />
                                Attach {selectedCustomCount} Selected
                              </button>
                              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                                Activities will be attached. You can then describe what to do with them.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Activity Instruction Box - appears when activities are attached */}
                      {showActivityInstructionBox && focusContext && (
                        <div className="mb-3 rounded-xl border border-blue-200/70 bg-blue-50/80 p-3 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-200 mb-2">
                            What would you like to do with these activities?
                          </label>
                          <textarea
                            value={activityInstruction}
                            onChange={(event) => setActivityInstruction(event.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200"
                            placeholder="E.g., 'Suggest modifications', 'Compare effectiveness', 'Create a sequence plan'"
                          />
                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            This will be sent together with your general prompt below.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-violet-500 dark:border-slate-700/60 dark:bg-slate-900/70">
                        <button
                          type="button"
                          onClick={() => setShowActivityPicker((prev) => !prev)}
                          className={`rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${showActivityPicker || focusContext
                            ? 'text-violet-600 dark:text-violet-200'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}
                          aria-label="Attach session activities"
                          aria-haspopup="dialog"
                          aria-expanded={showActivityPicker}
                        >
                          <Paperclip className={`h-4 w-4 transition-transform ${focusContext ? 'rotate-45' : ''}`} />
                        </button>
                        <input
                          value={aiInput}
                          onChange={(event) => setAiInput(event.target.value)}
                          placeholder="Ask for ideas or describe the goals you're targeting"
                          className="flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                        />
                        <button
                          type="submit"
                          disabled={isAiTyping || !aiInput.trim()}
                          className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 p-2 text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Send message to AI"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      {isInitializingAi && (
                        <p className="mt-2 text-xs text-slate-400">
                          Preparing personalized context for the AI assistant…
                        </p>
                      )}
                    </form>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
      {/* Add Custom Activity Modal */}
      <AnimatePresence>
        {showAddCustomActivity && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddCustomActivity(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                  Add Custom Activity
                </h3>
                <button
                  onClick={() => setShowAddCustomActivity(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g., Sensory Bin Exploration"
                    value={customActivityForm.name}
                    onChange={(e) => setCustomActivityForm(prev => ({ ...prev, name: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[100px]"
                    placeholder="Describe the activity and steps..."
                    value={customActivityForm.description}
                    onChange={(e) => setCustomActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={customActivityForm.difficulty}
                      onChange={(e) => setCustomActivityForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={customActivityForm.duration}
                      onChange={(e) => setCustomActivityForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      min={5}
                      max={180}
                      step={5}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <button
                  onClick={() => setShowAddCustomActivity(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleAddCustomActivity()}
                  disabled={!customActivityForm.name.trim()}
                  className="rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Activity
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

interface ManageActivitiesInlineProps {
  availableChildGoals: ChildGoal[];
  sessionActivities: SessionActivity[];
  onClose: () => void;
  onAdd: (childGoalId: number, actualDuration?: number) => void;
}

const ManageActivitiesInline: React.FC<ManageActivitiesInlineProps> = ({
  availableChildGoals,
  sessionActivities,
  onClose,
  onAdd
}) => {
  const [selectedChildGoal, setSelectedChildGoal] = useState<ChildGoal | null>(null);
  const [actualDuration, setActualDuration] = useState<string>('30');

  const alreadyInSession = useMemo(
    () => sessionActivities.map((activity) => activity.child_goal_id),
    [sessionActivities]
  );

  const filteredChildGoals = useMemo(
    () => availableChildGoals.filter((goal) => !alreadyInSession.includes(goal.id)),
    [alreadyInSession, availableChildGoals]
  );

  const handleAddToSession = () => {
    if (!selectedChildGoal) {
      return;
    }
    const parsedDuration = Number.parseInt(actualDuration, 10);
    onAdd(selectedChildGoal.id, Number.isNaN(parsedDuration) ? 30 : parsedDuration);
    setSelectedChildGoal(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Add Activities to Session
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select an activity from available goals to add to this session
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Activities
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Activities List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChildGoals.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-800/70 dark:bg-slate-900/60">
              <Target className="h-12 w-12 text-slate-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">All Goals Added</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  All assigned goals are already part of this session.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredChildGoals.map((goal) => {
                const isActive = selectedChildGoal?.id === goal.id;
                return (
                  <motion.button
                    key={goal.id}
                    onClick={() => {
                      setSelectedChildGoal(goal);
                      setActualDuration(goal.estimated_duration?.toString() || '30');
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition ${isActive
                      ? 'border-violet-500 bg-violet-50/80 shadow-md dark:border-violet-800/60 dark:bg-violet-900/20'
                      : 'border-slate-200/70 bg-white hover:border-violet-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-violet-700'
                      }`}
                  >
                    {isActive && (
                      <div className="absolute right-4 top-4">
                        <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-200" />
                      </div>
                    )}
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white pr-8">
                      {goal.activity_name || goal.activity_description || 'Unnamed Activity'}
                    </h4>
                    {goal.activity_description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {goal.activity_description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                      {goal.difficulty_level && (
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${getDifficultyColor(
                            goal.difficulty_level
                          )}`}
                        >
                          Level {goal.difficulty_level}
                        </span>
                      )}
                      {goal.current_status && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                          {goal.current_status}
                        </span>
                      )}
                      {goal.estimated_duration && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                          {goal.estimated_duration} min
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Details Sidebar */}
        {selectedChildGoal && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 flex-shrink-0 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Selected Activity
            </h3>
            <div className="mt-4">
              <h4 className="text-base font-semibold text-violet-600 dark:text-violet-300">
                {selectedChildGoal.activity_name || 'Unnamed Activity'}
              </h4>
              {selectedChildGoal.activity_description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {selectedChildGoal.activity_description}
                </p>
              )}
              <div className="mt-4 space-y-3">
                {selectedChildGoal.domain && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Domain
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {selectedChildGoal.domain}
                    </p>
                  </div>
                )}
                {selectedChildGoal.difficulty_level && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Difficulty Level
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      Level {selectedChildGoal.difficulty_level}
                    </p>
                  </div>
                )}
                {selectedChildGoal.current_status && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Current Status
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {selectedChildGoal.current_status}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Session Duration
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Set the planned duration for this activity
              </p>
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={actualDuration}
                  onChange={(event) => setActualDuration(event.target.value)}
                  min={1}
                  max={180}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                />
              </div>
              <button
                onClick={handleAddToSession}
                disabled={!selectedChildGoal}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add to Session
              </button>
            </div>
          </motion.div>
        )}



      </div>
    </div>
  );
};

function getDifficultyColor(level: number) {
  switch (level) {
    case 1:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
    case 2:
      return 'bg-lime-100 text-lime-700 dark:bg-lime-900/20 dark:text-lime-300';
    case 3:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    case 4:
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
    case 5:
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300';
  }
}
