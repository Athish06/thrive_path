/**
 * Centralized date/time utilities for ThrivePath frontend
 * Provides consistent timezone-aware datetime handling across React components
 * Aligns with backend date_utils.py standards
 */

// ==================== CONFIGURATION ====================
// Project-wide date/time standards

/**
 * ISO 8601 format strings
 */
export const ISO_DATE_FORMAT = 'YYYY-MM-DD';
export const ISO_TIME_FORMAT = 'HH:mm:ss';
export const ISO_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
export const ISO_DATETIME_TZ_FORMAT = 'YYYY-MM-DDTHH:mm:ss.sssZ';

// ==================== CORE DATE UTILITIES ====================

/**
 * Get current UTC datetime with timezone awareness
 * Standard replacement for new Date() when UTC consistency is needed
 * 
 * @returns {Date} Current UTC datetime
 */
export const getCurrentUtcDate = (): Date => {
  return new Date();
};

/**
 * Get current UTC date as ISO string (YYYY-MM-DD)
 * Standard format for date-only comparisons and API calls
 * 
 * @returns {string} ISO date string (e.g., '2025-09-23')
 */
export const getTodayIso = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current UTC datetime as ISO 8601 string with timezone
 * Standard format for API requests and database storage
 * 
 * @returns {string} ISO 8601 formatted datetime string (e.g., '2025-09-23T14:30:00.000Z')
 */
export const getUtcNowIso = (): string => {
  return new Date().toISOString();
};

// ==================== DATE PARSING UTILITIES ====================

/**
 * Parse various date string formats to Date object
 * Handles ISO format and ensures timezone consistency
 * 
 * @param {string} dateStr - Date string to parse
 * @returns {Date | null} Parsed Date object or null if parsing fails
 */
export const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Handle ISO date format (YYYY-MM-DD)
    if (dateStr.length === 10 && dateStr.includes('-')) {
      return new Date(dateStr + 'T00:00:00.000Z');
    }
    
    // Handle full datetime strings
    return new Date(dateStr);
  } catch (error) {
    console.warn(`Failed to parse date string '${dateStr}':`, error);
    return null;
  }
};

/**
 * Parse time string to Date object with today's date
 * Handles HH:mm and HH:mm:ss formats
 * 
 * @param {string} timeStr - Time string to parse
 * @returns {Date | null} Date object with time set or null if parsing fails
 */
export const parseTimeString = (timeStr: string): Date | null => {
  if (!timeStr) return null;
  
  try {
    // Handle time-only formats by combining with today's date
    const today = getTodayIso();
    
    if (timeStr.includes(':')) {
      // Ensure time has seconds
      const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      return new Date(`${today}T${normalizedTime}.000Z`);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to parse time string '${timeStr}':`, error);
    return null;
  }
};

/**
 * Parse datetime string to timezone-aware Date object
 * Handles various ISO formats with and without timezone info
 * 
 * @param {string} datetimeStr - Datetime string to parse
 * @returns {Date | null} Parsed timezone-aware Date object or null if parsing fails
 */
export const parseDateTimeString = (datetimeStr: string): Date | null => {
  if (!datetimeStr) return null;
  
  try {
    // Handle ISO datetime format
    if (datetimeStr.includes('T')) {
      return new Date(datetimeStr);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to parse datetime string '${datetimeStr}':`, error);
    return null;
  }
};

// ==================== DATE FORMATTING UTILITIES ====================

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * Standard format for date-only displays and API calls
 * 
 * @param {Date} date - Date object to format
 * @returns {string} ISO formatted date string
 */
export const formatDateIso = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid Date object provided');
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Format Date object to ISO time string (HH:mm:ss)
 * Standard format for time-only displays
 * 
 * @param {Date} date - Date object to format
 * @returns {string} ISO formatted time string
 */
export const formatTimeIso = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid Date object provided');
  }
  
  return date.toISOString().split('T')[1].split('.')[0];
};

/**
 * Format Date object to ISO datetime string with timezone
 * Standard format for API requests and storage
 * 
 * @param {Date} date - Date object to format
 * @returns {string} ISO formatted datetime string with timezone
 */
export const formatDateTimeIso = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid Date object provided');
  }
  
  return date.toISOString();
};

// ==================== DATE COMPARISON UTILITIES ====================

/**
 * Check if given date is today (in local timezone)
 * 
 * @param {Date | string} date - Date to check
 * @returns {boolean} True if date is today, false otherwise
 */
export const isToday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    if (!dateObj) return false;
    
    const today = getTodayIso();
    const dateIso = formatDateIso(dateObj);
    
    return today === dateIso;
  } catch (error) {
    console.warn('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Check if two dates are the same (date-only comparison)
 * 
 * @param {Date | string} date1 - First date to compare
 * @param {Date | string} date2 - Second date to compare
 * @returns {boolean} True if dates are the same, false otherwise
 */
export const isSameDate = (date1: Date | string, date2: Date | string): boolean => {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseDateString(date1) : date1;
    const dateObj2 = typeof date2 === 'string' ? parseDateString(date2) : date2;
    
    if (!dateObj1 || !dateObj2) return false;
    
    return formatDateIso(dateObj1) === formatDateIso(dateObj2);
  } catch (error) {
    console.warn('Error comparing dates:', error);
    return false;
  }
};

// ==================== DISPLAY FORMATTING UTILITIES ====================

/**
 * Format date for user-friendly display
 * 
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    if (!dateObj) return '';
    
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.warn('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Format time for user-friendly display
 * 
 * @param {Date | string} time - Time to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTimeForDisplay = (
  time: Date | string, 
  options: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  }
): string => {
  try {
    let timeObj: Date;
    
    if (typeof time === 'string') {
      // If it's a time-only string, parse with today's date
      timeObj = parseTimeString(time) || new Date(`2000-01-01T${time}`);
    } else {
      timeObj = time;
    }
    
    if (!timeObj || isNaN(timeObj.getTime())) return '';
    
    return timeObj.toLocaleTimeString('en-US', options);
  } catch (error) {
    console.warn('Error formatting time for display:', error);
    return '';
  }
};

// ==================== TIME CALCULATION UTILITIES ====================

/**
 * Calculate end time given start time and duration in minutes
 * 
 * @param {string} startTime - Start time in HH:mm format
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in HH:mm format
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating end time:', error);
    return startTime;
  }
};

// ==================== API UTILITIES ====================

/**
 * Prepare date for API request (ensures consistent format)
 * 
 * @param {Date | string} date - Date to prepare
 * @returns {string} ISO formatted date string
 */
export const prepareDateForApi = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    return dateObj ? formatDateIso(dateObj) : '';
  } catch (error) {
    console.warn('Error preparing date for API:', error);
    return '';
  }
};

/**
 * Prepare datetime for API request (ensures consistent format with timezone)
 * 
 * @param {Date | string} datetime - Datetime to prepare
 * @returns {string} ISO formatted datetime string with timezone
 */
export const prepareDateTimeForApi = (datetime: Date | string): string => {
  try {
    const dateObj = typeof datetime === 'string' ? parseDateTimeString(datetime) : datetime;
    return dateObj ? formatDateTimeIso(dateObj) : '';
  } catch (error) {
    console.warn('Error preparing datetime for API:', error);
    return '';
  }
};

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate that start date is before or equal to end date
 * 
 * @param {Date | string} startDate - Start date to validate
 * @param {Date | string} endDate - End date to validate
 * @returns {boolean} True if range is valid, false otherwise
 */
export const validateDateRange = (startDate: Date | string, endDate: Date | string): boolean => {
  try {
    const startObj = typeof startDate === 'string' ? parseDateString(startDate) : startDate;
    const endObj = typeof endDate === 'string' ? parseDateString(endDate) : endDate;
    
    if (!startObj || !endObj) return false;
    
    return startObj <= endObj;
  } catch (error) {
    console.warn('Error validating date range:', error);
    return false;
  }
};

/**
 * Validate that start time is before end time
 * 
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {boolean} True if range is valid, false otherwise
 */
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  try {
    const startObj = parseTimeString(startTime);
    const endObj = parseTimeString(endTime);
    
    if (!startObj || !endObj) return false;
    
    return startObj < endObj;
  } catch (error) {
    console.warn('Error validating time range:', error);
    return false;
  }
};