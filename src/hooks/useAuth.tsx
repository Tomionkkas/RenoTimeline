import { useEffect, useState, useContext, createContext, useMemo, useCallback } from 'react';
import { supabase, sharedClient } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

const SUPABASE_URL = "https://kralcmyhjvoiywcpntkg.supabase.co";

// Define the shape of user metadata
interface UserMetadata {
  first_name?: string;
  last_name?: string;
  // Add other metadata fields as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (metadata: Partial<User['user_metadata']>) => Promise<User | undefined>;
  // Phase 3 Enhanced Functions
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<void>;
  deleteAccount: (password: string, confirmationText?: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session,
    // so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      },
    });

    if (error) {
      return { data, error };
    }

    // After successful sign-up, create a profile in the shared_schema.
    if (data.user) {
      const { error: profileError } = await sharedClient
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
        });
      
      if (profileError) {
        // This is a critical error, as the user will be in an inconsistent state.
        // We should probably delete the auth user if the profile creation fails.
        // For now, we'll just log it and show a toast.
        console.error("Failed to create user profile in shared_schema:", profileError);
        toast.error("Wystąpił krytyczny błąd podczas tworzenia profilu użytkownika.");
      }
    }
    
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Immediately clear local state to prevent UI flickering
      setUser(null);
      setSession(null);
      
      // Then try normal signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // If normal logout fails, force logout by clearing storage
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Additional cleanup - remove any Supabase session cookies/storage
      try {
        localStorage.removeItem('sb-kralcmyhjvoiywcpntkg-auth-token');
        localStorage.removeItem('supabase.auth.token');
      } catch (storageError) {
        console.warn('Storage cleanup error:', storageError);
      }
      
    } catch (error) {
      console.error('Unexpected logout error:', error);
      // Force logout even if there's an error
      setUser(null);
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      toast.error("Wylogowano (wymuszone wyczyszczenie sesji)");
    }
  }, []);

  const updateUser = useCallback(async (metadata: Partial<User['user_metadata']>) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    
    if (error) {
      toast.error("Błąd podczas aktualizacji profilu: " + error.message);
      throw error;
    }
    
    toast.success("Profil został pomyślnie zaktualizowany.");
    return data.user;
  }, []);

  // Phase 3: Enhanced Authentication Functions
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error('Nieprawidłowe aktualne hasło');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Hasło zostało pomyślnie zmienione');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Błąd podczas zmiany hasła');
      throw error;
    }
  }, [user]);

  const changeEmail = useCallback(async (newEmail: string, password: string) => {
    if (!user?.email) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      // First verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (verifyError) {
        throw new Error('Nieprawidłowe hasło');
      }

      // Update email - this will trigger email verification
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) {
        throw updateError;
      }

      // Update email in shared_schema profiles table
      const { error: profileError } = await sharedClient
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile email update error:', profileError);
      }

      toast.success('Email został zaktualizowany. Sprawdź swoją skrzynkę pocztową w celu weryfikacji.');
    } catch (error: any) {
      console.error('Email change error:', error);
      toast.error(error.message || 'Błąd podczas zmiany adresu email');
      throw error;
    }
  }, [user]);

  const deleteAccount = useCallback(async (password: string, confirmationText: string = 'USUŃ KONTO') => {
    if (!user?.email) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      // Call the Edge function for secure account deletion
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('Brak ważnej sesji użytkownika');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password,
          confirmationText: confirmationText,
          reason: 'user_requested'
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Błąd podczas usuwania konta');
      }

      // Account successfully deleted - user is automatically signed out
      toast.success('Konto zostało pomyślnie usunięte wraz z wszystkimi danymi.');
      
      // Clear local state
      setUser(null);
      setSession(null);
      
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.message || 'Błąd podczas usuwania konta');
      throw error;
    }
  }, [user]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Plik musi być obrazem');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Plik nie może być większy niż 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL in shared_schema
      const { error: updateError } = await sharedClient
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Avatar został pomyślnie zaktualizowany');
      return avatarUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Błąd podczas przesyłania avatara');
      throw error;
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Refresh user session to get latest data
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error: any) {
      console.error('Profile refresh error:', error);
      toast.error('Błąd podczas odświeżania profilu');
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
    // Phase 3 Enhanced Functions
    changePassword,
    changeEmail,
    deleteAccount,
    uploadAvatar,
    refreshProfile,
  }), [user, session, loading, signUp, signIn, signOut, updateUser, changePassword, changeEmail, deleteAccount, uploadAvatar, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
