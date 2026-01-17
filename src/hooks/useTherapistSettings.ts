import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

interface TherapistSettings {
  profile_section: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    bio?: string;
    avatar?: string;
    specialization?: string;
    yearsOfExperience?: string;
    licenseNumber?: string;
    certifications?: string[];
    education?: string;
  };
  account_section: {
    workingHours: WorkingHours[];
    freeHours: FreeHours[];
    emailNotifications: boolean;
    smsNotifications: boolean;
    sessionReminders: boolean;
    progressUpdates: boolean;
    profileVisibility: string;
    dataSharing: boolean;
  };
}

export const useTherapistSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TherapistSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const settingsData = await response.json();
          setSettings(settingsData);
        } else {
          setError('Failed to load settings');
        }
      } catch (err) {
        setError('Error loading settings');
        console.error('Error fetching therapist settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const refreshSettings = async () => {
    setLoading(true);
    setError(null);
    // Re-fetch settings
    if (user) {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await fetch('http://localhost:8000/api/settings', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const settingsData = await response.json();
            setSettings(settingsData);
          }
        }
      } catch (err) {
        console.error('Error refreshing settings:', err);
      }
    }
    setLoading(false);
  };

  return {
    settings,
    loading,
    error,
    refreshSettings,
    workingHours: settings?.account_section?.workingHours || [],
    freeHours: settings?.account_section?.freeHours || []
  };
};