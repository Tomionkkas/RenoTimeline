
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useOnboarding = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has any projects
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking projects:', error);
          setNeedsOnboarding(true);
        } else {
          // If no projects exist, user needs onboarding
          setNeedsOnboarding(projects.length === 0);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
  };
};
