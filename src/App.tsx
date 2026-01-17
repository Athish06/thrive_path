import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationPopupContainer } from './components/notifications/NotificationPopup';
import { HomePage } from './components/home/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { RegistrationPage } from './components/auth/RegistrationPage';
import { AppSidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { useSidebar } from './hooks/useSidebar';
import { cn } from './lib/utils';
import TherapistDashboard from './components/therapist/TherapistDashboard';
import { ThemeProvider } from './context/ThemeProvider';
import { LearnersList } from './components/therapist/LearnersList';
import { MyLearners } from './components/therapist/MyLearners';
import { TemporaryStudents } from './components/therapist/TemporaryStudents';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { HomeworkManager } from './components/parent/HomeworkManager';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { SessionPlanning } from './components/sessions/SessionPlanning';
import AssessmentTools from './components/therapist/AssessmentTools';
import Settings from './components/therapist/Settings';
import { ActivitiesPage } from './components/therapist/ActivitiesPage';
import { ChildDetailsPage } from './components/therapist/ChildDetailsPage';
import ActiveSessions from './components/sessions/ActiveSessions';
import ProgressAnalysisDetail from './components/therapist/ReportsDocumentation';
import ProgressAnalysisLanding from './components/therapist/ProgressAnalysisLanding';

const ReportsLegacyRedirect: React.FC = () => {
  const { learnerId } = useParams();
  return <Navigate to={learnerId ? `/progress-analysis/${learnerId}` : '/progress-analysis'} replace />;
};

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <TopNavbar isProfileOpen={isProfileOpen} onProfileToggle={setIsProfileOpen} />
      
      {/* Notification Popup Container */}
      <NotificationPopupContainer />
      
      <main className={cn(
        'transition-all duration-300',
        'pt-24 px-4',
        isOpen ? 'md:ml-[260px]' : 'md:ml-[72px]'
      )}>
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              user?.role === 'therapist' ? <TherapistDashboard isProfileOpen={isProfileOpen} /> : <ParentDashboard isProfileOpen={isProfileOpen} />
            } 
          />
          
          {/* Therapist Routes */}
          <Route 
            path="/learners" 
            element={
              <ProtectedRoute requiredRole="therapist">
                <LearnersList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learners/my-learners" 
            element={
              <ProtectedRoute requiredRole="therapist">
                <MyLearners />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learners/temp-students" 
            element={
              <ProtectedRoute requiredRole="therapist">
                <TemporaryStudents />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/assessments"
            element={
              <ProtectedRoute requiredRole="therapist">
                <AssessmentTools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRole="therapist">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute requiredRole="therapist">
                <SessionPlanning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/active"
            element={
              <ProtectedRoute requiredRole="therapist">
                <ActiveSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute requiredRole="therapist">
                <ActivitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-analysis"
            element={
              <ProtectedRoute requiredRole="therapist">
                <ProgressAnalysisLanding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-analysis/:learnerId"
            element={
              <ProtectedRoute requiredRole="therapist">
                <ProgressAnalysisDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<ReportsLegacyRedirect />} />
          <Route path="/reports/:learnerId" element={<ReportsLegacyRedirect />} />
          <Route
            path="/activities/:learnerId"
            element={
              <ProtectedRoute requiredRole="therapist">
                <ChildDetailsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Parent Routes */}
          <Route 
            path="/child" 
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboard isProfileOpen={isProfileOpen} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/homework" 
            element={
              <ProtectedRoute requiredRole="parent">
                <HomeworkManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute requiredRole="parent">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Progress Reports</h2>
                  <p className="text-muted-foreground">Detailed progress reports coming soon!</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/goals" 
            element={
              <ProtectedRoute requiredRole="parent">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Goals & Milestones</h2>
                  <p className="text-muted-foreground">Goal tracking interface coming soon!</p>
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all for dashboard routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes - Always accessible */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegistrationPage />} />
      
      {/* Protected Dashboard Routes - Only accessible when authenticated */}
      {isAuthenticated ? (
        <Route path="/*" element={<DashboardLayout />} />
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <ThemeProvider>
            <Router>
              <AppLayout />
            </Router>
          </ThemeProvider>
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;