import { calculateEndTime } from './dateUtils';

export interface SessionLike {
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const ONGOING_STATUSES = ['ongoing', 'in_progress'];
const SCHEDULED_STATUS = 'scheduled';

export const normalizeTimeValue = (timeString: string): string => {
  if (!timeString) {
    return '00:00';
  }

  const segments = timeString.split(':');
  if (segments.length >= 2) {
    return `${segments[0].padStart(2, '0')}:${segments[1].padStart(2, '0')}`;
  }

  return timeString.padStart(2, '0') + ':00';
};

export const toDateWithTime = (dateString: string, timeString: string): Date => {
  const normalizedTime = normalizeTimeValue(timeString);
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export const getSessionDurationMinutes = (session: Pick<SessionLike, 'start_time' | 'end_time'>): number => {
  const start = toDateWithTime('2000-01-01', session.start_time);
  const end = toDateWithTime('2000-01-01', session.end_time);
  const diff = (end.getTime() - start.getTime()) / 60000;
  return diff > 0 ? diff : 60;
};

export const hasSessionStartTimePassed = (session: Pick<SessionLike, 'session_date' | 'start_time'>): boolean => {
  try {
    const start = toDateWithTime(session.session_date, session.start_time);
    return Date.now() >= start.getTime();
  } catch (error) {
    console.warn('Failed to evaluate session start time:', error);
    return false;
  }
};

export const hasSessionEnded = (session: Pick<SessionLike, 'session_date' | 'end_time'>): boolean => {
  try {
    const end = toDateWithTime(session.session_date, session.end_time);
    return Date.now() >= end.getTime();
  } catch (error) {
    console.warn('Failed to evaluate session end time:', error);
    return false;
  }
};

export const isSessionOngoing = (status: string): boolean => ONGOING_STATUSES.includes(status);

export const isSessionStartable = (session: SessionLike): boolean => {
  if (session.status !== SCHEDULED_STATUS) {
    return false;
  }
  return hasSessionStartTimePassed(session);
};

export const statusDisplayLabel = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export const deriveEndTimeFromDuration = (startTime: string, durationMinutes: number): string => {
  return calculateEndTime(normalizeTimeValue(startTime), durationMinutes);
};
