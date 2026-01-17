import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import {
  ArrowLeft,
  User,
  Heart,
  Brain,
  MessageCircle,
  Send,
  Bot,
  Activity,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Palette,
  Users,
  RefreshCw,
  ClipboardList,
  ChevronDown,
  PlusCircle,
  FileText,
  Edit3,
  Paperclip,
  Calendar,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

type ChatMessageKind = 'text' | 'activities' | 'system';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  kind: ChatMessageKind;
  content?: string;
  activities?: ActivitySuggestion[];
  timestamp: Date;
  status?: 'normal' | 'error';
  retryPayload?: string;
}

interface ActivitySuggestion {
  id: string;
  activity_name: string;
  duration_minutes: number | null;
  detailed_description: string;
  reason_for_recommendation: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  materials?: string[];
  goals?: string[];
  instructions?: string[];
  adaptations?: string[];
  safety_notes?: string[];
}

export const ChildDetailsPage: React.FC = () => {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();
  const {
    littleLearners,
    loading,
    error,
    refreshLearners,
    childGoalsByLearner,
    childGoalsLoading,
    childGoalsError,
    getChildGoalsForLearner
  } = useData();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [assigningActivityId, setAssigningActivityId] = useState<string | null>(null);
  const [assignedActivityIds, setAssignedActivityIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('goals');
  const [modalSelectedAssessmentTool, setModalSelectedAssessmentTool] = useState<string | null>(null);
  const [expandedMedicalSections, setExpandedMedicalSections] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pendingRetryId, setPendingRetryId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeDetailSection, setActiveDetailSection] = useState<'medical' | 'assessment'>('medical');
  const [isAIPreferencesModalOpen, setIsAIPreferencesModalOpen] = useState(false);
  const [aiPreferences, setAiPreferences] = useState('');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSessionNotesModalOpen, setIsSessionNotesModalOpen] = useState(false);
  const [availableSessionNotes, setAvailableSessionNotes] = useState<any[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(new Set());
  const [notesStartDate, setNotesStartDate] = useState('');
  const [notesEndDate, setNotesEndDate] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [hasInitializedChat, setHasInitializedChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const learner = littleLearners.find(l => l.id === learnerId);
  const learnerGoals = learnerId ? childGoalsByLearner[learnerId] ?? [] : [];
  const learnerGoalsLoading = learnerId ? childGoalsLoading[learnerId] ?? false : false;
  const learnerGoalsError = learnerId ? childGoalsError[learnerId] ?? null : null;

  useEffect(() => {
    if (!learner && !loading) {
      refreshLearners();
    }
  }, [learner, loading, refreshLearners]);

  useEffect(() => {
    if (learner?.id) {
      getChildGoalsForLearner(learner.id);
    }
  }, [learner?.id, getChildGoalsForLearner]);

  useEffect(() => {
    if (learner?.medicalDiagnosis && typeof learner.medicalDiagnosis === 'object') {
      setExpandedMedicalSections({});
    }
  }, [learner?.medicalDiagnosis]);

  // Load AI preferences when learner changes
  useEffect(() => {
    if (learner?.id) {
      loadAIPreferences(learner.id);
    }
  }, [learner?.id]);

  // Show initial welcome message when switching to activities tab
  useEffect(() => {
    if (activeTab === 'activities' && learner && !hasInitializedChat && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${createMessageId()}`,
        role: 'assistant',
        kind: 'text',
        content: `Hi! 👋 I'm preparing the AI assistant for ${learner.name}. I'm analyzing their profile, medical information, and therapeutic goals to provide you with personalized activity recommendations. Feel free to ask me anything about therapeutic activities!`,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
      setHasInitializedChat(true);
    }
  }, [activeTab, learner, hasInitializedChat, chatMessages.length]);

  const toggleMedicalSection = (sectionKey: string) => {
    setExpandedMedicalSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleRefreshGoals = useCallback(() => {
    if (learner?.id) {
      getChildGoalsForLearner(learner.id, { force: true });
    }
  }, [learner, getChildGoalsForLearner]);

  const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Load AI preferences for the learner
  const loadAIPreferences = async (childId: string) => {
    try {
      const response = await fetch(`/api/learners/${childId}/ai-preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAiPreferences(data.ai_instructions || '');
      }
    } catch (error) {
      console.error('Error loading AI preferences:', error);
    }
  };

  // Save AI preferences
  const saveAIPreferences = async () => {
    if (!learner?.id) return;
    
    setIsSavingPreferences(true);
    try {
      const response = await fetch(`/api/learners/${learner.id}/ai-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          child_id: parseInt(learner.id),
          ai_instructions: aiPreferences
        })
      });

      if (response.ok) {
        setIsAIPreferencesModalOpen(false);
      } else {
        alert('Failed to save AI preferences');
      }
    } catch (error) {
      console.error('Error saving AI preferences:', error);
      alert('Error saving AI preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Load session notes
  const loadSessionNotes = async () => {
    if (!learner?.id) return;
    
    setIsLoadingNotes(true);
    try {
      const childId = Number.parseInt(learner.id, 10);
      if (Number.isNaN(childId)) {
        throw new Error('Invalid child identifier');
      }

      const requestBody: {
        child_id: number;
        start_date?: string;
        end_date?: string;
      } = {
        child_id: childId
      };

      if (notesStartDate) {
        requestBody.start_date = notesStartDate;
      }
      if (notesEndDate) {
        requestBody.end_date = notesEndDate;
      }

      const response = await fetch(`/api/sessions/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSessionNotes(data);
      }
    } catch (error) {
      console.error('Error loading session notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Toggle note selection
  const toggleNoteSelection = (noteId: number) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const buildLearnerProfilePayload = useCallback(() => {
      if (!learner) return null;

      return {
        name: learner.name,
        age: learner.age,
        medicalDiagnosis: learner.medicalDiagnosis,
        profileDetails: learner.profileDetails,
        assessmentDetails: learner.assessmentDetails,
        goals: learnerGoals.length > 0
          ? learnerGoals.map(goal => goal.activity_name || goal.activity_description || `Goal #${goal.id}`)
          : learner.goals
      };
    }, [learner, learnerGoals]);

    const initializeSession = useCallback(async (): Promise<string | null> => {
      const profilePayload = buildLearnerProfilePayload();
      if (!profilePayload) return null;

      try {
        setIsInitializingSession(true);
        setSessionError(null);

        const response = await fetch('/api/activities/chat/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ learner_profile: profilePayload })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const detail = data?.detail ?? 'Failed to create AI session';
          throw new Error(detail);
        }

        if (!data?.session_id) {
          throw new Error('Missing AI session identifier');
        }

        setSessionId(data.session_id);
        return data.session_id as string;
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Failed to create AI session';
        setSessionId(null);
        setSessionError(detail);
        setChatMessages(prev => {
          const alreadyNotified = prev.some(msg => msg.kind === 'system' && msg.status === 'error');
          if (alreadyNotified) return prev;
          return [
            ...prev,
            {
              id: `session-error-${createMessageId()}`,
              role: 'assistant',
              kind: 'system',
              content: `I'm having trouble setting up the AI assistant: ${detail}.`,
              timestamp: new Date(),
              status: 'error'
            }
          ];
        });
        return null;
      } finally {
        setIsInitializingSession(false);
      }
    }, [buildLearnerProfilePayload]);

  const dispatchAssistantMessage = useCallback(async (
    userInput: string,
    options: { includeUserMessage?: boolean } = {}
  ): Promise<boolean> => {
    const { includeUserMessage = true } = options;

    if (!learner || !userInput) {
      return false;
    }

    if (includeUserMessage) {
      const userMessage: ChatMessage = {
        id: `user-${createMessageId()}`,
        role: 'user',
        kind: 'text',
        content: userInput,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = await initializeSession();
    }

    if (!activeSessionId) {
      const errorMessage: ChatMessage = {
        id: `no-session-${createMessageId()}`,
        role: 'assistant',
        kind: 'system',
        content: 'I need a moment to set up the AI assistant before I can respond. Please try again shortly.',
        timestamp: new Date(),
        status: 'error',
        retryPayload: userInput
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return false;
    }

    setIsTyping(true);

    try {
      // Get selected session notes
      const selectedNotes = availableSessionNotes.filter(note => selectedNoteIds.has(note.session_id));
      
      const response = await fetch(`/api/activities/chat/session/${activeSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: userInput,
          ai_preferences: aiPreferences || undefined,
          session_notes: selectedNotes.length > 0 ? selectedNotes : undefined
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail ?? 'Failed to reach the AI assistant';
        throw new Error(detail);
      }

      if (data?.session_id && data.session_id !== activeSessionId) {
        setSessionId(data.session_id);
        activeSessionId = data.session_id;
      }

      const incoming = Array.isArray(data?.messages) ? data.messages : [];
      const assistantMessages: ChatMessage[] = incoming
        .map((message: any) => {
          if (message.kind === 'text' && typeof message.content === 'string') {
            return {
              id: `assistant-text-${createMessageId()}`,
              role: 'assistant',
              kind: 'text',
              content: message.content,
              timestamp: new Date()
            } as ChatMessage;
          }

          if (message.kind === 'activities' && Array.isArray(message.activities)) {
            return {
              id: `assistant-activities-${createMessageId()}`,
              role: 'assistant',
              kind: 'activities',
              activities: message.activities,
              timestamp: new Date()
            } as ChatMessage;
          }

          return null;
        })
        .filter(Boolean) as ChatMessage[];

      if (assistantMessages.length > 0) {
        setChatMessages(prev => [...prev, ...assistantMessages]);
      }

      return true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unexpected error contacting the AI assistant.';
      const errorMessage: ChatMessage = {
        id: `assistant-error-${createMessageId()}`,
        role: 'assistant',
        kind: 'text',
        content: `I couldn't reach the AI assistant: ${detail}`,
        timestamp: new Date(),
        status: 'error',
        retryPayload: userInput
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return false;
    } finally {
      setIsTyping(false);
    }
  }, [learner, sessionId, initializeSession, aiPreferences, availableSessionNotes, selectedNoteIds]);

  const sendMessage = async () => {
    const userInput = currentMessage.trim();
    if (!userInput) return;

    setCurrentMessage('');
    await dispatchAssistantMessage(userInput, { includeUserMessage: true });
  };

  const handleRetry = async (messageId: string, retryContent: string) => {
    if (!retryContent) return;

    setPendingRetryId(messageId);
    const success = await dispatchAssistantMessage(retryContent, { includeUserMessage: false });
    if (success) {
      setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
    setPendingRetryId(null);
  };

  const assignActivity = async (activity: ActivitySuggestion) => {
    if (!learner) return;

    const activityLabel = activity.activity_name || activity.id;

    if (assignedActivityIds.has(activity.id)) {
      return;
    }

    setAssigningActivityId(activity.id);
    try {
      const response = await fetch('/api/activities/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          activity,
          child_id: parseInt(learner.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to assign activity');
      }

      const result = await response.json();

      if (!result?.success) {
        throw new Error(result?.message || 'Assignment unsuccessful');
      }

      setAssignedActivityIds(prev => {
        const next = new Set(prev);
        next.add(activity.id);
        return next;
      });

      console.log('Activity assignment successful:', result);

      await getChildGoalsForLearner(learner.id, { force: true });

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        kind: 'text',
        content: `✅ "${activityLabel}" has been successfully assigned to ${learner.name}! The activity will appear in their next therapy session.`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Error assigning activity:', error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        kind: 'text',
        content: `❌ Sorry, I couldn't assign "${activityLabel}" to ${learner.name}. Please try again or contact support if the problem persists.`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setAssigningActivityId(null);
    }
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) {
      return <Activity className="h-4 w-4" />;
    }
    switch (category.toLowerCase()) {
      case 'sensory': return <Heart className="h-4 w-4" />;
      case 'social-emotional': return <Users className="h-4 w-4" />;
      case 'motor skills': return <Zap className="h-4 w-4" />;
      case 'cognitive': return <Brain className="h-4 w-4" />;
      case 'communication': return <MessageCircle className="h-4 w-4" />;
      case 'creative': return <Palette className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'hard': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getGoalStatusStyles = (status?: string | null) => {
    const normalized = (status ?? '').toLowerCase();
    switch (normalized) {
      case 'mastered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'in_progress':
      case 'progressing':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'not_started':
      case 'pending':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    }
  };

  const formatStatusLabel = (status?: string | null) => {
    if (!status) return 'In Progress';
    return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatTimelineDate = (raw?: string | null) => {
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  // Helper function to format assessment data for display (removed as it's replaced by formatAssessmentToolData)

  // Assessment tools data - dynamically generated from assessmentDetails
  const getAssessmentTools = () => {
    if (!learner?.assessmentDetails || typeof learner.assessmentDetails !== 'object') return [];
    
    return Object.keys(learner.assessmentDetails).map((toolName) => {
      const toolData = learner.assessmentDetails[toolName];
      return {
        id: toolName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
        name: toolName.toUpperCase(),
        icon: getToolIcon(toolName),
        color: getToolColor(toolName),
        data: toolData
      };
    });
  };

  const getToolIcon = (toolName: string) => {
    const name = toolName.toLowerCase();
    if (name.includes('isaa') || name.includes('autism') || name.includes('social')) return <Users className="h-5 w-5" />;
    if (name.includes('adhd') || name.includes('attention')) return <Brain className="h-5 w-5" />;
    if (name.includes('speech') || name.includes('language')) return <MessageCircle className="h-5 w-5" />;
    if (name.includes('motor')) return <Zap className="h-5 w-5" />;
    if (name.includes('cognitive')) return <Target className="h-5 w-5" />;
    if (name.includes('sensory')) return <Heart className="h-5 w-5" />;
    return <ClipboardList className="h-5 w-5" />;
  };

  const getToolColor = (toolName: string) => {
    const name = toolName.toLowerCase();
    if (name.includes('isaa') || name.includes('autism')) return 'blue';
    if (name.includes('adhd')) return 'purple';
    if (name.includes('speech') || name.includes('language')) return 'green';
    if (name.includes('motor')) return 'orange';
    if (name.includes('cognitive')) return 'indigo';
    if (name.includes('sensory')) return 'red';
    return 'gray';
  };

  const formatAssessmentValue = (value: any, level: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">Not specified</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="font-medium">{value ? 'Yes' : 'No'}</span>;
    }

    if (typeof value === 'number') {
      return <span className="font-semibold text-violet-600 dark:text-violet-400">{value}</span>;
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
        <div className={`space-y-3 ${level > 0 ? 'pl-4 border-l-2 border-violet-200 dark:border-violet-700' : ''}`}>
          {entries.map(([subKey, subValue]) => (
            <div key={subKey} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-violet-400"></div>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
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

  const assessmentTools = useMemo(() => getAssessmentTools(), [learner?.assessmentDetails]);
  const selectedAssessmentToolData = modalSelectedAssessmentTool
    ? assessmentTools.find(tool => tool.id === modalSelectedAssessmentTool)
    : null;

  useEffect(() => {
    if (!isDetailsModalOpen) {
      setExpandedMedicalSections({});
      setModalSelectedAssessmentTool(null);
      setActiveDetailSection('medical');
      return;
    }

    if (assessmentTools.length > 0) {
      setModalSelectedAssessmentTool((previous) => {
        if (previous && assessmentTools.some(tool => tool.id === previous)) {
          return previous;
        }
        return assessmentTools[0].id;
      });
    } else {
      setModalSelectedAssessmentTool(null);
    }
  }, [assessmentTools, isDetailsModalOpen]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !learner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            {error || 'Learner not found'}
          </h2>
          <button
            onClick={() => navigate('/activities')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Back to Activities
          </button>
        </motion.div>
      </div>
    );
  }

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
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 p-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/activities')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>

              <div className="flex items-center gap-4">
                {learner.photo ? (
                  <img
                    src={learner.photo}
                    alt={learner.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                )}

                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {learner.name}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Age {learner.age}{learner.primaryTherapist ? ` • Primary Therapist: ${learner.primaryTherapist}` : ''}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Main Content with Tabs */}
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                        <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      Active Goals
                    </CardTitle>
                    <CardDescription>
                      Current therapeutic goals synced from the child_goals table
                    </CardDescription>
                  </div>
                  <button
                    onClick={handleRefreshGoals}
                    disabled={learnerGoalsLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className={cn('h-4 w-4', learnerGoalsLoading && 'animate-spin')} />
                    Refresh
                  </button>
                </CardHeader>
                <CardContent>
                  {learnerGoalsLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : learnerGoalsError ? (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-6 text-sm text-amber-700 dark:text-amber-200">
                      <p className="font-medium mb-3">We couldn't load this learner's goals.</p>
                      <button
                        onClick={handleRefreshGoals}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-white hover:bg-amber-700 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                      </button>
                    </div>
                  ) : learnerGoals.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">
                        No active goals found. Assign activities from the AI assistant to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learnerGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 p-5 lg:flex-row lg:items-start lg:justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', getGoalStatusStyles(goal.current_status))}>
                                <CheckCircle className="h-3.5 w-3.5" />
                                {formatStatusLabel(goal.current_status)}
                              </span>
                              {goal.domain && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
                                  <Activity className="h-3.5 w-3.5" />
                                  {goal.domain}
                                </span>
                              )}
                              {goal.difficulty_level && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                  <Target className="h-3.5 w-3.5" />
                                  Level {goal.difficulty_level}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                {goal.activity_name || 'Untitled Goal'}
                              </h3>
                              {goal.activity_description && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {goal.activity_description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                              {goal.estimated_duration && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {goal.estimated_duration} min
                                </span>
                              )}
                              {goal.target_frequency && (
                                <span className="inline-flex items-center gap-1">
                                  <Activity className="h-3.5 w-3.5" />
                                  Target {goal.target_frequency}x/week
                                </span>
                              )}
                              {(goal.total_attempts ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Success {(goal.successful_attempts ?? 0)}/{goal.total_attempts}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 text-xs text-slate-500 dark:text-slate-400 lg:items-end">
                            {formatTimelineDate(goal.last_attempted) && (
                              <p>Last attempted: {formatTimelineDate(goal.last_attempted)}</p>
                            )}
                            {formatTimelineDate(goal.date_started) && (
                              <p>Started: {formatTimelineDate(goal.date_started)}</p>
                            )}
                            {formatTimelineDate(goal.date_mastered) && (
                              <p>Mastered: {formatTimelineDate(goal.date_mastered)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              {/* AI Chat Interface */}
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50">
                        <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      AI Activity Assistant
                    </CardTitle>
                    <CardDescription>
                      Get personalized activity recommendations powered by AI
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAIPreferencesModalOpen(true)}
                      className="inline-flex items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                      title="Customize AI Assistant"
                    >
                      <Edit3 className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setModalSelectedAssessmentTool(null);
                        setActiveDetailSection('medical');
                        setIsDetailsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <FileText className="h-4 w-4" />
                      View Details
                    </motion.button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto mb-4 space-y-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-violet-950/60 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                    <AnimatePresence>
                      {chatMessages.map((message) => {
                        const isAssistant = message.role === 'assistant';
                        const isActivities = message.kind === 'activities';
                        const isSystem = message.kind === 'system';

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "flex gap-3",
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {isAssistant && (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/40">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}

                            {isActivities ? (
                              <div className="flex-1 space-y-3">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-violet-500/90 via-indigo-500/90 to-purple-500/90 text-xs font-semibold tracking-wide text-white shadow-lg shadow-violet-500/20">
                                  <div className="bg-white/20 rounded-full p-1">
                                    <Activity className="h-3.5 w-3.5" />
                                  </div>
                                  Personalized Activity Plan
                                </div>
                                {message.activities?.map((activity) => {
                                  const isAssigningThisActivity = assigningActivityId === activity.id;
                                  const isBusyAssigning = assigningActivityId !== null;
                                  const isAlreadyAssigned = assignedActivityIds.has(activity.id);

                                  return (
                                    <motion.div
                                      key={activity.id}
                                      initial={{ opacity: 0, x: -12 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="rounded-2xl border border-violet-200/70 dark:border-violet-500/30 bg-white/90 dark:bg-slate-900/70 shadow-md backdrop-blur-sm p-5 space-y-4"
                                    >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/30 dark:to-indigo-500/30 text-violet-700 dark:text-violet-200 shadow-inner">
                                            {getCategoryIcon(activity.category)}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-xl tracking-tight">
                                              {activity.activity_name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100/80 dark:bg-violet-500/20 px-2 py-0.5 text-violet-700 dark:text-violet-200">
                                                <Clock className="h-3 w-3" />
                                                {activity.duration_minutes ? `${activity.duration_minutes} min` : 'Flexible duration'}
                                              </span>
                                              {activity.difficulty && (
                                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", getDifficultyColor(activity.difficulty))}>
                                                  <Target className="h-3 w-3" />
                                                  {activity.difficulty}
                                                </span>
                                              )}
                                              {activity.category && (
                                                <Badge variant="outline" className="border-violet-200 text-[11px] text-violet-600 dark:border-violet-500/40 dark:text-violet-200 bg-white/80 dark:bg-slate-900/60">
                                                  {activity.category}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                            {activity.detailed_description}
                                          </p>
                                          {activity.reason_for_recommendation && (
                                            <div className="rounded-xl border border-violet-200/60 dark:border-violet-500/30 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-500/10 dark:via-slate-900/40 dark:to-indigo-500/10 p-4 text-sm text-violet-800 dark:text-violet-200">
                                              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200 mb-1">
                                                <Target className="h-3 w-3" /> Why it matters
                                              </p>
                                              <p className="leading-relaxed">{activity.reason_for_recommendation}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <motion.button
                                        whileHover={isAssigningThisActivity || isAlreadyAssigned ? undefined : { scale: 1.05 }}
                                        whileTap={isAssigningThisActivity || isAlreadyAssigned ? undefined : { scale: 0.95 }}
                                        onClick={() => assignActivity(activity)}
                                        disabled={isBusyAssigning || isAlreadyAssigned}
                                        className={cn(
                                          "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70",
                                          isAlreadyAssigned 
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/40"
                                            : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:shadow-xl hover:from-violet-700 hover:to-blue-700"
                                        )}
                                      >
                                        {isAssigningThisActivity ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Assigning...</span>
                                          </>
                                        ) : isAlreadyAssigned ? (
                                          <>
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Assigned</span>
                                          </>
                                        ) : (
                                          <>
                                            <PlusCircle className="h-4 w-4" />
                                            <span>Add to Learner</span>
                                          </>
                                        )}
                                      </motion.button>
                                    </div>

                                    {(activity.goals?.length ?? 0) > 0 && (
                                      <div className="space-y-3 rounded-xl border border-violet-100/70 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/10 p-4">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-200">
                                          <Target className="h-4 w-4" /> Activity Goals
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {(activity.goals ?? []).map((goal, index) => (
                                            <Badge key={`${activity.id}-goal-${index}`} variant="secondary" className="bg-white text-violet-700 dark:bg-slate-900 dark:text-violet-200">
                                              {goal}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {(activity.materials?.length ?? 0) > 0 && (
                                      <div className="space-y-3 rounded-xl border border-indigo-100/70 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 p-4">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                                          <ClipboardList className="h-4 w-4" /> Materials Checklist
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {(activity.materials ?? []).map((material, index) => (
                                            <Badge key={`${activity.id}-material-${index}`} variant="outline" className="border-indigo-200 bg-white/90 text-indigo-700 dark:border-indigo-500/30 dark:bg-slate-900/70 dark:text-indigo-200">
                                              {material}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {(activity.instructions?.length ?? 0) > 0 && (
                                      <div className="space-y-3 rounded-xl border border-slate-200/70 dark:border-slate-600/40 bg-white/80 dark:bg-slate-900/60 p-4">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                          <FileText className="h-4 w-4" /> Step-by-Step Guide
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                          {(activity.instructions ?? []).map((step, index) => (
                                            <li key={`${activity.id}-instruction-${index}`}>{step}</li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}

                                    {(activity.adaptations?.length ?? 0) > 0 && (
                                      <div className="space-y-3 rounded-xl border border-amber-100/70 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                                          <RefreshCw className="h-4 w-4" /> Adaptations & Extensions
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-amber-800 dark:text-amber-200">
                                          {(activity.adaptations ?? []).map((adaptation, index) => (
                                            <li key={`${activity.id}-adaptation-${index}`}>{adaptation}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {(activity.safety_notes?.length ?? 0) > 0 && (
                                      <div className="space-y-3 rounded-xl border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 p-4">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-200">
                                          <AlertCircle className="h-4 w-4" /> Safety Notes
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-rose-700 dark:text-rose-200">
                                          {(activity.safety_notes ?? []).map((note, index) => (
                                            <li key={`${activity.id}-safety-${index}`}>{note}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : isSystem ? (
                              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-xs uppercase tracking-wide bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 text-amber-800 dark:from-amber-900/60 dark:via-amber-900/40 dark:to-yellow-900/40 dark:text-amber-200 shadow-sm">
                                {message.content}
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm shadow-md",
                                  message.role === 'user'
                                    ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-violet-500/40"
                                    : message.status === 'error'
                                      ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-200"
                                      : "bg-white text-slate-800 border border-slate-200/70 dark:bg-slate-800/70 dark:text-slate-100 dark:border-slate-700"
                                )}
                              >
                                {message.content}
                                {message.status === 'error' && message.retryPayload && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRetry(message.id, message.retryPayload!)}
                                    disabled={pendingRetryId === message.id}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 text-xs font-semibold shadow-md hover:shadow-lg hover:from-rose-700 hover:to-red-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-md"
                                  >
                                    {pendingRetryId === message.id ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Retrying...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        <span>Retry Request</span>
                                      </>
                                    )}
                                  </motion.button>
                                )}
                              </div>
                            )}

                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center flex-shrink-0 shadow">
                                <User className="h-4 w-4 text-white drop-shadow" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-violet-100/70 dark:border-violet-500/20 shadow">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Selected Notes Indicator */}
                  {selectedNoteIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mb-2 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="font-semibold">
                        {selectedNoteIds.size} session note{selectedNoteIds.size > 1 ? 's' : ''} attached
                      </span>
                      <button
                        onClick={() => setSelectedNoteIds(new Set())}
                        className="ml-auto hover:bg-violet-100 dark:hover:bg-violet-900/40 p-1 rounded transition"
                        title="Clear all notes"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}

                  {/* Chat Input */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask for activity recommendations..."
                      className="flex-1 px-5 py-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent backdrop-blur-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsSessionNotesModalOpen(true);
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        setNotesStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                        setNotesEndDate(today.toISOString().split('T')[0]);
                      }}
                      className={cn(
                        "relative px-3 py-3 border rounded-xl font-semibold transition-all duration-300",
                        selectedNoteIds.size > 0
                          ? "bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-violet-400 dark:hover:border-violet-500"
                      )}
                      title="Add Session Notes"
                    >
                      <Paperclip className="h-4 w-4" />
                      {selectedNoteIds.size > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                          {selectedNoteIds.size}
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isTyping || isInitializingSession}
                      className="px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </div>
                  {sessionError && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4" />
                      <span>{sessionError}</span>
                      <button
                        onClick={() => { void initializeSession(); }}
                        className="font-semibold underline hover:text-rose-500 dark:hover:text-rose-200"
                      >
                        Retry setup
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
        <Dialog
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        >
          <DialogContent className="w-full max-w-5xl">
            <DialogHeader>
              <DialogTitle>
                {learner ? `${learner.name}'s Profile Details` : 'Learner Details'}
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
                        {learner?.medicalDiagnosis ? (
                          typeof learner.medicalDiagnosis === 'object' && learner.medicalDiagnosis !== null ? (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                              {Object.entries(learner.medicalDiagnosis).map(([key, value]) => {
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
                              {String(learner.medicalDiagnosis)}
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
                                ? `Detailed assessment snapshot for ${learner?.name ?? 'this learner'}.`
                                : 'Select an assessment tool to examine detailed results.'}
                            </p>
                          </div>
                        </div>
                        {selectedAssessmentToolData && (
                          <button
                            type="button"
                            onClick={() => setModalSelectedAssessmentTool(null)}
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
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                No data captured for this tool yet.
                              </p>
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
                                    onClick={() => setModalSelectedAssessmentTool(tool.id)}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  No assessment details captured yet.
                                </p>
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
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Preferences Modal */}
        <Dialog open={isAIPreferencesModalOpen} onOpenChange={setIsAIPreferencesModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-violet-600" />
                Customize AI Assistant
              </DialogTitle>
              <DialogDescription>
                Provide specific instructions to personalize how the AI generates activity recommendations for {learner?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  AI Instructions
                </label>
                <textarea
                  value={aiPreferences}
                  onChange={(e) => setAiPreferences(e.target.value)}
                  placeholder="Example: Focus on activities that improve fine motor skills. Prefer outdoor activities. Suggest activities that can be done in 15-20 minute sessions."
                  className="w-full h-40 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-slate-800 dark:text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  These instructions will guide the AI's recommendations for all future activity suggestions.
                </p>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setIsAIPreferencesModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveAIPreferences}
                disabled={isSavingPreferences}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Session Notes Modal */}
        <Dialog open={isSessionNotesModalOpen} onOpenChange={setIsSessionNotesModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-violet-600" />
                Add Session Notes Context
              </DialogTitle>
              <DialogDescription>
                Select session notes to provide behavioral context to the AI assistant.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Date Range Selector */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    Start Date
                  </label>
                  <CustomDatePicker
                    value={notesStartDate}
                    onChange={(date) => setNotesStartDate(date)}
                    placeholder="Select start date"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    End Date
                  </label>
                  <CustomDatePicker
                    value={notesEndDate}
                    onChange={(date) => setNotesEndDate(date)}
                    placeholder="Select end date"
                  />
                </div>
                <button
                  onClick={loadSessionNotes}
                  disabled={isLoadingNotes}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingNotes ? 'Loading...' : 'Load Notes'}
                </button>
              </div>

              {/* Notes List */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-300 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Available Session Notes ({availableSessionNotes.length})
                  </p>
                  {selectedNoteIds.size > 0 && (
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                      {selectedNoteIds.size} note{selectedNoteIds.size > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {availableSessionNotes.length === 0 ? (
                    <div className="text-center py-10">
                      <Paperclip className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isLoadingNotes ? 'Loading session notes...' : 'No session notes found for the selected date range.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {availableSessionNotes.map((note) => (
                        <label
                          key={note.session_id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedNoteIds.has(note.session_id)}
                            onChange={() => toggleNoteSelection(note.session_id)}
                            className="mt-1 h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {new Date(note.session_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {note.therapist_notes}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => {
                  setIsSessionNotesModalOpen(false);
                  setSelectedNoteIds(new Set());
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Clear & Close
              </button>
              <button
                onClick={() => setIsSessionNotesModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                Done ({selectedNoteIds.size} selected)
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};