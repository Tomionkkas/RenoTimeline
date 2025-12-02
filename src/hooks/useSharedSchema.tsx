import { useCallback } from 'react';
import { sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useSharedSchema = () => {
  const { user } = useAuth();

  // Get user profile from shared schema
  const getProfile = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await sharedClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }, [user]);

  // Update user profile in shared schema
  const updateProfile = useCallback(async (updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
    expertise?: string;
    timezone?: string;
    language?: string;
    theme?: string;
    notification_preferences?: any;
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await sharedClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Profil został zaktualizowany');
      return data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Błąd podczas aktualizacji profilu: ' + error.message);
      throw error;
    }
  }, [user]);

  // Get app preferences for current app
  const getAppPreferences = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await sharedClient
        .from('app_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('app_name', 'renotimeline')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching app preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAppPreferences:', error);
      return null;
    }
  }, [user]);

  // Update app preferences for current app
  const updateAppPreferences = useCallback(async (preferences: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await sharedClient
        .from('app_preferences')
        .upsert({
          user_id: user.id,
          app_name: 'renotimeline',
          preferences,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Preferencje zostały zaktualizowane');
      return data;
    } catch (error: any) {
      console.error('Error updating app preferences:', error);
      toast.error('Błąd podczas aktualizacji preferencji: ' + error.message);
      throw error;
    }
  }, [user]);

  // Get user roles for current app
  const getUserRoles = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await sharedClient
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('app_name', 'renotimeline')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user roles:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return null;
    }
  }, [user]);

  // Update push token for notifications
  const updatePushToken = useCallback(async (token: string, deviceType: 'web' | 'ios' | 'android', deviceId?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await sharedClient
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          app_name: 'renotimeline',
          token,
          device_type: deviceType,
          device_id: deviceId,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error updating push token:', error);
      throw error;
    }
  }, [user]);

  // Remove push token
  const removePushToken = useCallback(async (token: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await sharedClient
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('app_name', 'renotimeline')
        .eq('token', token);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }, [user]);

  return {
    getProfile,
    updateProfile,
    getAppPreferences,
    updateAppPreferences,
    getUserRoles,
    updatePushToken,
    removePushToken,
  };
};
