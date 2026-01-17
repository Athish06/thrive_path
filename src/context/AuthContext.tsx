import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { User } from '../types';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';

// ==================== CONSTANTS ====================
const SESSION_TTL_HOURS = 8; // Session expires after 8 hours of inactivity
const TOKEN_REFRESH_INTERVAL_MINUTES = 25; // Refresh token 5 minutes before expiry (30 min token)

// Keys that should persist across login/logout (not cleared)
const PERSISTENT_KEYS = ['theme-storage'];

// ==================== SECURE STORAGE UTILITIES ====================
/**
 * Storage utilities using sessionStorage for security
 * - sessionStorage clears when browser/tab closes
 * - We only store minimal data needed for auth
 */
const secureStorage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
    sessionStorage.setItem('login_timestamp', Date.now().toString());
  },

  getAccessToken: (): string | null => {
    return sessionStorage.getItem('access_token');
  },

  getRefreshToken: (): string | null => {
    return sessionStorage.getItem('refresh_token');
  },

  setUserData: (user: { id: string; role: string; name: string; therapistsId?: number }) => {
    // Only store minimal data needed for UI - no email stored
    sessionStorage.setItem('user_id', user.id);
    sessionStorage.setItem('user_role', user.role);
    sessionStorage.setItem('user_name', user.name);
    if (user.therapistsId) {
      sessionStorage.setItem('therapists_id', user.therapistsId.toString());
    }
  },

  getUserData: (): { id: string; role: string; name: string; therapistsId?: number } | null => {
    const id = sessionStorage.getItem('user_id');
    const role = sessionStorage.getItem('user_role');
    const name = sessionStorage.getItem('user_name');
    const therapistsIdStr = sessionStorage.getItem('therapists_id');
    if (id && role && name) {
      return {
        id,
        role,
        name,
        therapistsId: therapistsIdStr ? parseInt(therapistsIdStr, 10) : undefined
      };
    }
    return null;
  },

  getLoginTimestamp: (): number | null => {
    const timestamp = sessionStorage.getItem('login_timestamp');
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  isSessionExpired: (): boolean => {
    const loginTimestamp = secureStorage.getLoginTimestamp();
    if (!loginTimestamp) return true;

    const hoursElapsed = (Date.now() - loginTimestamp) / (1000 * 60 * 60);
    return hoursElapsed >= SESSION_TTL_HOURS;
  },

  clearAuth: () => {
    // Clear all sessionStorage
    sessionStorage.clear();

    // Clear localStorage but preserve persistent keys (like theme)
    const keysToKeep: Record<string, string> = {};
    PERSISTENT_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) keysToKeep[key] = value;
    });

    localStorage.clear();

    // Restore persistent keys
    Object.entries(keysToKeep).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  },

  updateActivityTimestamp: () => {
    sessionStorage.setItem('last_activity', Date.now().toString());
  }
};

// Also make access_token available in localStorage for compatibility
// with existing API calls that read from there
const syncTokenToLocalStorage = (token: string | null) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

// ==================== CONTEXT TYPES ====================
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  isAuthenticated: boolean;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user from secure storage
  const [user, setUser] = useState<User | null>(() => {
    // Check if session is expired
    if (secureStorage.isSessionExpired()) {
      secureStorage.clearAuth();
      syncTokenToLocalStorage(null);
      return null;
    }

    const userData = secureStorage.getUserData();
    const token = secureStorage.getAccessToken();

    if (userData && token) {
      // Sync token to localStorage for API compatibility
      syncTokenToLocalStorage(token);
      return {
        id: userData.id,
        name: userData.name,
        email: '', // Don't store email in storage
        role: userData.role as User['role'],
        therapistsId: userData.therapistsId,
      };
    }
    return null;
  });

  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // ==================== TOKEN REFRESH ====================
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = secureStorage.getRefreshToken();
      if (!refreshToken) {
        console.warn('No refresh token available');
        return false;
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('access_token', data.access_token);
        syncTokenToLocalStorage(data.access_token);
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        console.error('❌ Token refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (user) {
      // Refresh token every 25 minutes (5 min before 30 min expiry)
      tokenRefreshInterval.current = setInterval(() => {
        console.log('🔄 Proactive token refresh...');
        refreshAccessToken();
      }, TOKEN_REFRESH_INTERVAL_MINUTES * 60 * 1000);

      return () => {
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current);
        }
      };
    }
  }, [user, refreshAccessToken]);

  // ==================== SESSION VALIDATION ====================
  // Check session validity on visibility change (tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if session expired while tab was hidden
        if (secureStorage.isSessionExpired()) {
          console.log('⏰ Session expired, logging out...');
          logout();
          return;
        }

        // Try to refresh token when tab becomes active
        const success = await refreshAccessToken();
        if (!success) {
          console.warn('Token refresh failed on visibility change');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshAccessToken]);

  // ==================== FETCH USER PROFILE ====================
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = secureStorage.getAccessToken();
      if (!token) {
        console.warn('No access token found for profile fetch');
        return;
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.ME), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            logout();
            return;
          }
          // Retry with new token
          return fetchUserProfile();
        }
        console.error('Profile fetch failed with status:', response.status);
        return;
      }

      const profileData = await response.json();

      setUser((currentUser) => {
        if (!currentUser) return currentUser;

        const updatedUser: User = {
          ...currentUser,
          name: profileData.name || profileData.email,
          email: profileData.email,
        };

        // Update storage with new name
        secureStorage.setUserData({
          id: updatedUser.id,
          role: updatedUser.role,
          name: updatedUser.name,
        });

        return updatedUser;
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [refreshAccessToken]);

  // ==================== LOGIN ====================
  const login = async (email: string, password: string) => {
    try {
      // Clear previous auth data but preserve theme
      secureStorage.clearAuth();
      syncTokenToLocalStorage(null);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const loginData = await response.json();

      // Store tokens securely
      secureStorage.setTokens(loginData.access_token, loginData.refresh_token);
      syncTokenToLocalStorage(loginData.access_token);

      // Create user object - name and therapists_id now come from login response!
      const frontendUser: User = {
        id: loginData.user.id.toString(),
        name: loginData.user.name, // Now includes profile name from backend
        email: loginData.user.email,
        role: loginData.user.role,
        therapistsId: loginData.user.therapists_id, // therapists table PK for therapist users
      };

      // Store minimal user data including therapists_id
      secureStorage.setUserData({
        id: frontendUser.id,
        role: frontendUser.role,
        name: frontendUser.name,
        therapistsId: frontendUser.therapistsId,
      });

      setUser(frontendUser);

      // Check sessions for therapists
      if (frontendUser.role === 'therapist') {
        console.log('🔔 Therapist login detected, checking sessions...');
        try {
          const sessionCheckResponse = await fetch(buildApiUrl(API_ENDPOINTS.SESSIONS_CHECK_ON_LOGIN), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${loginData.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (sessionCheckResponse.ok) {
            const sessionCheckData = await sessionCheckResponse.json();
            console.log('🔔 Session check completed:', sessionCheckData);

            // Store temporarily for notification system
            sessionStorage.setItem('login_session_check', JSON.stringify(sessionCheckData));

            window.dispatchEvent(new CustomEvent('loginSessionCheck', {
              detail: sessionCheckData
            }));
          }
        } catch (sessionError) {
          console.error('🔔 Session check error:', sessionError);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // ==================== LOGOUT ====================
  const logout = useCallback(() => {
    setUser(null);
    secureStorage.clearAuth();
    syncTokenToLocalStorage(null);

    // Clear token refresh interval
    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
      tokenRefreshInterval.current = null;
    }

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }, []);

  // ==================== REGISTER ====================
  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ')[1] || '',
          email: userData.email,
          password: userData.password,
          role: userData.role || 'parent',
          phone: userData.phone,
          address: userData.address,
          emergencyContact: userData.emergencyContact
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      // After registration, user needs to login
      console.log('Registration successful, please login');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};