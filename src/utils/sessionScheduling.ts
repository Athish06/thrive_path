interface WorkingHours {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface FreeHours {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

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

export interface TimeConflict {
  type: 'non-working-hours' | 'free-time' | 'session-conflict' | 'none';
  message: string;
  severity: 'warning' | 'info' | 'error' | 'none';
}

/**
 * Check if a given date and time conflicts with working hours, free hours, or existing sessions
 */
export const checkTimeConflicts = (
  date: string,
  time: string,
  workingHours: WorkingHours[],
  freeHours: FreeHours[],
  todaysSessions: BackendSession[] = [],
  sessionDuration: number = 60 // minutes
): TimeConflict => {
  if (!date || !time) {
    return { type: 'none', message: '', severity: 'none' };
  }

  // Parse the selected date and time
  const selectedDate = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  const selectedStartTime = new Date(selectedDate);
  selectedStartTime.setHours(hours, minutes, 0, 0);

  const selectedEndTime = new Date(selectedStartTime);
  selectedEndTime.setMinutes(selectedEndTime.getMinutes() + sessionDuration);

  // Get day name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[selectedDate.getDay()];

  // Check for session conflicts first (highest priority)
  const conflictingSessions = todaysSessions.filter(session => {
    // Only check sessions for the same date
    if (session.session_date !== date) return false;

    // Parse session times
    const [sessionStartHour, sessionStartMin] = session.start_time.split(':').map(Number);
    const [sessionEndHour, sessionEndMin] = session.end_time.split(':').map(Number);

    const sessionStart = new Date(selectedDate);
    sessionStart.setHours(sessionStartHour, sessionStartMin, 0, 0);

    const sessionEnd = new Date(selectedDate);
    sessionEnd.setHours(sessionEndHour, sessionEndMin, 0, 0);

    // Check if times overlap
    return selectedStartTime < sessionEnd && selectedEndTime > sessionStart;
  });

  if (conflictingSessions.length > 0) {
    const session = conflictingSessions[0];
    return {
      type: 'session-conflict',
      message: `This time conflicts with an existing session: "${session.student_name || 'Unknown Student'}" (${session.start_time} - ${session.end_time}).`,
      severity: 'error'
    };
  }

  // Check working hours
  const dayWorkingHours = workingHours.find(wh => wh.day === dayName);
  if (dayWorkingHours && dayWorkingHours.enabled) {
    const [workStartHour, workStartMin] = dayWorkingHours.startTime.split(':').map(Number);
    const [workEndHour, workEndMin] = dayWorkingHours.endTime.split(':').map(Number);

    const workStart = new Date(selectedDate);
    workStart.setHours(workStartHour, workStartMin, 0, 0);

    const workEnd = new Date(selectedDate);
    workEnd.setHours(workEndHour, workEndMin, 0, 0);

    // Check if session is outside working hours
    if (selectedStartTime < workStart || selectedEndTime > workEnd) {
      return {
        type: 'non-working-hours',
        message: `This session is scheduled outside your working hours for ${dayName} (${dayWorkingHours.startTime} - ${dayWorkingHours.endTime}).`,
        severity: 'warning'
      };
    }
  } else if (dayWorkingHours && !dayWorkingHours.enabled) {
    // Day is disabled
    return {
      type: 'non-working-hours',
      message: `${dayName} is not set as a working day in your schedule.`,
      severity: 'warning'
    };
  }

  // Check free hours
  const dayFreeHours = freeHours.filter(fh => fh.day === dayName);
  for (const freeHour of dayFreeHours) {
    const [freeStartHour, freeStartMin] = freeHour.startTime.split(':').map(Number);
    const [freeEndHour, freeEndMin] = freeHour.endTime.split(':').map(Number);

    const freeStart = new Date(selectedDate);
    freeStart.setHours(freeStartHour, freeStartMin, 0, 0);

    const freeEnd = new Date(selectedDate);
    freeEnd.setHours(freeEndHour, freeEndMin, 0, 0);

    // Check if session overlaps with free time
    if (selectedStartTime < freeEnd && selectedEndTime > freeStart) {
      return {
        type: 'free-time',
        message: `This session overlaps with your free time: "${freeHour.purpose}" (${freeHour.startTime} - ${freeHour.endTime}).`,
        severity: 'info'
      };
    }
  }

  return { type: 'none', message: '', severity: 'none' };
};

/**
 * Get available time slots for a given date based on working hours, free hours, and existing sessions
 */
export const getAvailableTimeSlots = (
  date: string,
  workingHours: WorkingHours[],
  freeHours: FreeHours[],
  todaysSessions: BackendSession[] = [],
  sessionDuration: number = 60,
  interval: number = 30 // minutes between slots
): string[] => {
  if (!date) return [];

  const selectedDate = new Date(date);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[selectedDate.getDay()];

  const dayWorkingHours = workingHours.find(wh => wh.day === dayName);

  // Use default working hours (8am-6pm) if no settings found or day not enabled
  let startHour = 8, startMin = 0, endHour = 18, endMin = 0;

  if (dayWorkingHours && dayWorkingHours.enabled) {
    [startHour, startMin] = dayWorkingHours.startTime.split(':').map(Number);
    [endHour, endMin] = dayWorkingHours.endTime.split(':').map(Number);
  } else if (workingHours.length > 0 && dayWorkingHours && !dayWorkingHours.enabled) {
    // Day is explicitly disabled in settings - return no slots
    return [];
  }
  // If no workingHours settings exist at all, use defaults (8am-6pm)

  const workStart = new Date(selectedDate);
  workStart.setHours(startHour, startMin, 0, 0);

  const workEnd = new Date(selectedDate);
  workEnd.setHours(endHour, endMin, 0, 0);

  const slots: string[] = [];
  let currentTime = new Date(workStart);

  while (currentTime.getTime() + (sessionDuration * 60000) <= workEnd.getTime()) {
    const slotStartTime = new Date(currentTime);
    const slotEndTime = new Date(currentTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + sessionDuration);

    // Check if this slot conflicts with existing sessions
    const sessionConflict = todaysSessions.some(session => {
      if (session.session_date !== date) return false;

      const [sessionStartHour, sessionStartMin] = session.start_time.split(':').map(Number);
      const [sessionEndHour, sessionEndMin] = session.end_time.split(':').map(Number);

      const sessionStart = new Date(selectedDate);
      sessionStart.setHours(sessionStartHour, sessionStartMin, 0, 0);

      const sessionEnd = new Date(selectedDate);
      sessionEnd.setHours(sessionEndHour, sessionEndMin, 0, 0);

      return slotStartTime < sessionEnd && slotEndTime > sessionStart;
    });

    // Check if this slot conflicts with free hours
    const freeHourConflict = freeHours.some(fh => {
      if (fh.day !== dayName) return false;

      const [freeStartHour, freeStartMin] = fh.startTime.split(':').map(Number);
      const [freeEndHour, freeEndMin] = fh.endTime.split(':').map(Number);

      const freeStart = new Date(selectedDate);
      freeStart.setHours(freeStartHour, freeStartMin, 0, 0);

      const freeEnd = new Date(selectedDate);
      freeEnd.setHours(freeEndHour, freeEndMin, 0, 0);

      return slotStartTime < freeEnd && slotEndTime > freeStart;
    });

    // Only add slot if no conflicts
    if (!sessionConflict && !freeHourConflict) {
      const timeString = currentTime.toTimeString().substring(0, 5); // HH:MM format
      slots.push(timeString);
    }

    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }

  return slots;
};

/**
 * Format time conflict message for display
 */
export const formatConflictMessage = (conflict: TimeConflict): string => {
  switch (conflict.type) {
    case 'non-working-hours':
      return `⚠️ ${conflict.message}`;
    case 'free-time':
      return `ℹ️ ${conflict.message}`;
    case 'session-conflict':
      return `❌ ${conflict.message}`;
    default:
      return '';
  }
};

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 */
export const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};