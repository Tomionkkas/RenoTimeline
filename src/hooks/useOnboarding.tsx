import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDummyMode } from './useDummyMode';

export const useOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isDummyMode } = useDummyMode();

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (isDummyMode) {
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    if (user && user.user_metadata) {
      setNeedsOnboarding(!user.user_metadata.onboarding_completed);
    } else {
      setNeedsOnboarding(false);
    }
    setLoading(false);
  }, [user, authLoading, isDummyMode]);

  const completeOnboarding = async () => {
    if (user) {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
      setNeedsOnboarding(false);
    }
  };

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
  };
};
