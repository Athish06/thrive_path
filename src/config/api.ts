/**
 * API Configuration
 * Centralized configuration for all API calls in the application
 */

// API Base URL - defaults to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    ME: '/api/me',
    REFRESH_TOKEN: '/api/refresh-token',  // Token refresh endpoint
    TEST_AUTH: '/api/test-auth',

    // Profile
    PROFILE: '/api/profile',

    // Settings
    SETTINGS: '/api/settings',
    SETTINGS_PROFILE: '/api/settings/profile',
    SETTINGS_ACCOUNT: '/api/settings/account',

    // Students/Learners
    STUDENTS: '/api/students',
    MY_STUDENTS: '/api/my-students',
    TEMP_STUDENTS: '/api/temp-students',
    ENROLL_STUDENT: '/api/enroll-student',
    STUDENT_BY_ID: (id: number) => `/api/students/${id}`,
    STUDENT_ACTIVITIES: (id: number) => `/api/students/${id}/activities`,
    STUDENT_ASSESSMENT: (id: number) => `/api/students/${id}/assessment`,
    STUDENT_ASSESSMENT_DETAILS: (id: number) => `/api/students/${id}/assessment-details`,

    // Sessions
    SESSIONS: '/api/sessions',
    SESSIONS_TODAY: '/api/sessions/today',
    SESSIONS_WITH_DETAILS: '/api/sessions/with-details',
    SESSION_BY_ID: (id: number) => `/api/sessions/${id}`,
    SESSION_STATUS: (id: number) => `/api/sessions/${id}/status`,
    SESSION_NOTIFICATION_SENT: (id: number) => `/api/sessions/${id}/notification-sent`,
    SESSION_ACTIVITIES: (id: number) => `/api/sessions/${id}/activities`,
    SESSION_ACTIVITY: (sessionId: number, activityId: number) =>
        `/api/sessions/${sessionId}/activities/${activityId}`,
    SESSIONS_CHECK_ON_LOGIN: '/api/sessions/check-on-login',
    SESSION_NOTES: '/api/sessions/notes',

    // Activities
    ACTIVITIES: '/api/activities',
    ACTIVITIES_SUGGEST: '/api/activities/suggest',
    ACTIVITIES_CHAT_SESSION: '/api/activities/chat/session',
    ACTIVITIES_CHAT_MESSAGE: (sessionId: string) => `/api/activities/chat/session/${sessionId}/message`,
    ACTIVITIES_ASSIGN: '/api/activities/assign',
    ACTIVITY_COMPLETE: (childId: number, activityId: number) =>
        `/api/students/${childId}/activities/${activityId}/complete`,

    // Notes
    NOTES: '/api/notes',
    NOTES_BY_DATE: (date: string) => `/api/notes/${date}`,
    NOTES_DATES_ALL: '/api/notes/dates/all',

    // General Notes (not tied to sessions)
    GENERAL_NOTES_CREATE: '/api/general-notes',
    GENERAL_NOTES_BY_DATE: (date: string) => `/api/general-notes/${date}`,
    GENERAL_NOTES_UPDATE: (noteId: number) => `/api/general-notes/${noteId}`,
    GENERAL_NOTES_DELETE: (noteId: number) => `/api/general-notes/${noteId}`,

    // Files
    UPLOAD_DOCUMENT: '/api/upload-document',
    DELETE_FILE: '/api/delete-file',
    PROCESS_OCR: '/api/process-ocr',
    UPLOAD_TO_SUPABASE: '/api/upload-to-supabase',

    // Assessment Tools
    ASSESSMENT_TOOLS: '/api/assessment-tools',

    // AI Preferences
    LEARNER_AI_PREFERENCES: (childId: number) => `/api/learners/${childId}/ai-preferences`,

    // System
    HEALTH: '/health',
    TEST_DB: '/api/test-db',
    TEST_SUPABASE: '/api/test-supabase',
} as const;

/**
 * Build full API URL from endpoint path
 * @param endpoint - API endpoint path (e.g., '/api/login')
 * @returns Full URL (e.g., 'http://localhost:8000/api/login')
 */
export const buildApiUrl = (endpoint: string): string => {
    return `${API_BASE_URL}${endpoint}`;
};

/**
 * Get authorization headers with token
 * Checks sessionStorage first (more secure), then localStorage for compatibility
 * @returns Headers object with Authorization header
 */
export const getAuthHeaders = (): HeadersInit => {
    // Check sessionStorage first (new secure storage), then localStorage (backward compat)
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

/**
 * Get authorization headers for file upload (no Content-Type)
 * @returns Headers object with Authorization header only
 */
export const getAuthHeadersForUpload = (): HeadersInit => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    return {
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

/**
 * Refresh access token using refresh token
 * @returns New access token or null if refresh failed
 */
const refreshAccessToken = async (): Promise<string | null> => {
    try {
        const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
        if (!refreshToken) {
            return null;
        }

        const response = await fetch(buildApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            // Store new access token in both storages
            sessionStorage.setItem('access_token', data.access_token);
            localStorage.setItem('access_token', data.access_token);
            return data.access_token;
        }

        return null;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
};

/**
 * Make authenticated API request with automatic token refresh
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Fetch response
 */
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const url = buildApiUrl(endpoint);
    const headers = options.body instanceof FormData
        ? getAuthHeadersForUpload()
        : getAuthHeaders();

    // Make initial request
    let response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        const newToken = await refreshAccessToken();

        if (newToken) {
            console.log('✅ Token refreshed successfully, retrying request...');
            // Retry request with new token
            const newHeaders = options.body instanceof FormData
                ? getAuthHeadersForUpload()
                : getAuthHeaders();

            response = await fetch(url, {
                ...options,
                headers: {
                    ...newHeaders,
                    ...options.headers,
                },
            });
        } else {
            console.error('❌ Token refresh failed, redirecting to login...');
            // Clear storage but preserve theme preference
            const themeStorage = localStorage.getItem('theme-storage');
            sessionStorage.clear();
            localStorage.clear();
            if (themeStorage) localStorage.setItem('theme-storage', themeStorage);
            window.location.href = '/login';
        }
    }

    return response;
};
