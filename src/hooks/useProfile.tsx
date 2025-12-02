import { useState, useEffect, useCallback } from 'react';
import { sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  expertise: string | null;
  timezone: string | null;
  language: string | null;
  theme: string | null;
  notification_preferences: any;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  notifications_enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  auto_save: boolean;
  haptic_feedback: boolean;
  measurement_unit: 'metric' | 'imperial';
  default_project_status: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  language: 'pl',
  notifications_enabled: true,
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  auto_save: true,
  haptic_feedback: true,
  measurement_unit: 'metric',
  default_project_status: 'Planowany',
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load from shared_schema profiles table
      const { data: profileData, error: profileError } = await sharedClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile load error:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load settings from localStorage
      const savedSettings = localStorage.getItem(`user_settings_${user.id}`);
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } catch (error) {
          console.error('Settings parse error:', error);
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
      }

    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Błąd podczas ładowania profilu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update profile information
  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      setUpdating(true);

      const { data, error } = await sharedClient
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      toast.success('Profil został zaktualizowany');
      return data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Błąd podczas aktualizacji profilu');
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [user]);

  // Update user settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      setUpdating(true);

      // Merge with existing settings
      const updatedSettings = { ...settings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(updatedSettings));
      
      setSettings(updatedSettings);
      toast.success('Ustawienia zostały zaktualizowane');
    } catch (error: any) {
      console.error('Update settings error:', error);
      toast.error(error.message || 'Błąd podczas aktualizacji ustawień');
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [user, settings]);

  // Get user's display name
  const getDisplayName = useCallback(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (profile?.last_name) {
      return profile.last_name;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    return 'Użytkownik';
  }, [profile]);

  // Get user's initials for avatar fallback
  const getInitials = useCallback(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  }, [profile]);

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    settings,
    loading,
    updating,
    updateProfile,
    updateSettings,
    loadProfile,
    getDisplayName,
    getInitials,
  };
}; 