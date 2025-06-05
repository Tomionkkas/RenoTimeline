
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface GuestUser {
  id: string;
  user_metadata: {
    first_name: string;
    last_name: string;
  };
  email: string;
  isGuest: true;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest mode first
    const isGuestMode = localStorage.getItem('renotimeline_guest_mode') === 'true';
    if (isGuestMode) {
      const guestUser: GuestUser = {
        id: 'guest-user',
        user_metadata: {
          first_name: 'Gość',
          last_name: 'Użytkownik'
        },
        email: 'guest@renotimeline.pl',
        isGuest: true
      };
      setUser(guestUser);
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear guest mode
    localStorage.removeItem('renotimeline_guest_mode');
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInAsGuest = () => {
    localStorage.setItem('renotimeline_guest_mode', 'true');
    const guestUser: GuestUser = {
      id: 'guest-user',
      user_metadata: {
        first_name: 'Gość',
        last_name: 'Użytkownik'
      },
      email: 'guest@renotimeline.pl',
      isGuest: true
    };
    setUser(guestUser);
    setLoading(false);
  };

  const exitGuestMode = () => {
    localStorage.removeItem('renotimeline_guest_mode');
    setUser(null);
    setLoading(false);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    exitGuestMode,
  };
};
