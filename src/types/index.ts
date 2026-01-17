export interface User {
  id: string;
  name: string;
  email: string;
  role: 'therapist' | 'parent';
  therapistsId?: number;  // therapists table primary key for therapist users
  specialization?: string;
  yearsOfExperience?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

export interface LittleLearner {
  id: string;
  name: string;
  age: number;
  photo?: string;
  status: 'active' | 'new' | 'assessment_due' | 'inactive';
  nextSession?: string;
  progressPercentage: number;
  parentId?: string;
  therapistId: string;
  goals: string[];
  achievements: Achievement[];
  medicalDiagnosis?: any; // JSON data
  assessmentDetails?: any; // JSON data for assessment tools
  driveUrl?: string;
  priorDiagnosis?: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  diagnosis?: string;
  primaryTherapist?: string;
  primaryTherapistId?: number;
  profileDetails?: any;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  domain: string;
}

export interface Session {
  id: string;
  child_id: string;
  therapist_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'in_progress' | 'completed';
  session_type: string;
  sent_notification: boolean;
  parent_feedback?: string;
  therapist_notes?: string;
  activities?: SessionActivity[];
}

// Master activities library - single source of truth
export interface Activity {
  id: number;
  activity_name: string;
  description?: string;
  domain?: string;
  difficulty_level?: number;
  estimated_duration?: number;
  materials?: string[];
}

// Child-specific goal assignments - links child to activities
export interface ChildGoal {
  id: number;
  child_id: number;
  activity_id: number;
  target_frequency?: number | null;
  assigned_date?: string | null;
  current_status?: string | null;
  total_attempts?: number | null;
  successful_attempts?: number | null;
  date_started?: string | null;
  date_mastered?: string | null;
  last_attempted?: string | null;
  created_at?: string;
  updated_at?: string;
  activity_name?: string;
  activity_description?: string | null;
  domain?: string | null;
  difficulty_level?: number | null;
  estimated_duration?: number | null;
  activity?: Activity; // Populated via join
}

// Session activities - what was actually worked on in session
export interface SessionActivity {
  id: number;
  session_id: number;
  child_goal_id: number;
  actual_duration: number;
  performance_notes?: string;
  child_goal?: ChildGoal; // Populated via join
}

export interface Homework {
  id: string;
  child_id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed';
  resources?: string[];
  parentNotes?: string;
}

export interface ProgressData {
  skillDomain: string;
  mastery: number;
  promptLevel: number;
  date: string;
}