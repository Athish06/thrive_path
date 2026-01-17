import { useState, useEffect } from 'react';
import { Users, CalendarPlus } from 'lucide-react';
import ConcentricCircleIcon from '../ui/ConcentricCircleIcon';
import HorizontalDropdown from '../ui/HorizontalDropdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { StudentEnrollmentModal } from './StudentEnrollmentModal';
import { SessionAddModal } from '../sessions/SessionAddModal';
import { LearnerTypeSelectionModal } from '../sessions/LearnerTypeSelectionModal';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface QuickActionsProps {
  // No props needed currently - notes functionality moved to calendar
}

export const QuickActions: React.FC<QuickActionsProps> = () => {
  const { user } = useAuth();
  const { myStudents, tempStudents } = useData();
  const { theme: appTheme } = useTheme();
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [showLearnerTypeModal, setShowLearnerTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedLearnerType, setSelectedLearnerType] = useState<'general' | 'temporary' | null>(null);
  
  useEffect(() => {
    if (appTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setEffectiveTheme(systemTheme);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setEffectiveTheme(appTheme);
    }
  }, [appTheme]);

  // Load data on component mount - DataContext handles this automatically
  useEffect(() => {
    // DataContext automatically fetches data when user is available
    // No need for manual fetching here
  }, [user]);

  // Session creation handlers
  const handleLearnerTypeSelection = (type: 'general' | 'temporary') => {
    setSelectedLearnerType(type);
    setShowSessionModal(true);
  };

  const handleAddSessionClick = () => {
    setShowLearnerTypeModal(true);
  };

  const handleSessionAdd = async (sessionData: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const studentList = selectedLearnerType === 'temporary' ? tempStudents : myStudents;
      const selectedLearner = studentList.find((student: any) => student.name === sessionData.learner);
      
      if (!selectedLearner) {
        console.error('Selected learner not found');
        return;
      }

      const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      };

      const backendData = {
        child_id: parseInt(selectedLearner.id.toString()),  // Ensure it's a number
        session_date: sessionData.date,
        start_time: sessionData.time,
        end_time: calculateEndTime(sessionData.time, 60),
        therapist_notes: sessionData.notes || '',
        session_activities: sessionData.childGoals?.map((childGoalId: number) => ({
          child_goal_id: childGoalId,
          actual_duration: 30, // Default duration, can be updated later
          performance_notes: ''
        })) || []
      };

      console.log('Creating session with data:', backendData);

      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        setShowSessionModal(false);
        setSelectedLearnerType(null);
        // Notify other parts of app about schedule change (notifications, dashboards)
        try {
          const sessionData = await response.json();
          window.dispatchEvent(new CustomEvent('scheduleChanged', { detail: { session: sessionData } }));
        } catch (e) {
          console.log('Session created successfully');
          window.dispatchEvent(new CustomEvent('scheduleChanged'));
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to create session:', errorData.detail || 'Unknown error');
      }
    } catch (err) {
      console.error('Session creation error:', err);
    }
  };


  const menuItems = [
    {
      label: 'Add Learner',
      action: () => setIsEnrollmentModalOpen(true),
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Add Session',
      action: handleAddSessionClick,
      icon: <CalendarPlus className="w-5 h-5" />,
    },
  ];

  return (
    <div className="relative flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <HorizontalDropdown
                items={menuItems}
                theme={effectiveTheme}
                button={
                  <button className="group p-3 rounded-full transition-all duration-200 hover:scale-105 relative">
                    {/* Simple hover background */}
                    <div className="absolute inset-0 rounded-full bg-slate-100/50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                    {/* Light border on hover */}
                    <div className="absolute inset-0 rounded-full border border-transparent group-hover:border-slate-300/50 dark:group-hover:border-slate-600/50 transition-colors duration-200" />
                    
                    {/* Icon */}
                    <div className="relative z-10">
                      <ConcentricCircleIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200" />
                    </div>
                  </button>
                }
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Quick Actions</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Student Enrollment Modal */}
      <StudentEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        onSuccess={() => {
          // Optional: Add success callback
          console.log('Student enrolled successfully!');
        }}
      />

      {/* Learner Type Selection Modal */}
      {showLearnerTypeModal && (
        <LearnerTypeSelectionModal
          open={showLearnerTypeModal}
          onClose={() => setShowLearnerTypeModal(false)}
          onSelectType={handleLearnerTypeSelection}
        />
      )}

      {/* Session Add Modal */}
      {showSessionModal && (
        <SessionAddModal
          open={showSessionModal}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedLearnerType(null);
          }}
          onAdd={handleSessionAdd}
          students={selectedLearnerType === 'temporary' ? tempStudents : myStudents}
          learnerType={selectedLearnerType || 'general'}
        />
      )}
    </div>
  );
};
