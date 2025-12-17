import { useQuery } from '@tanstack/react-query';
import { sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useDevRole = () => {
  const { user } = useAuth();

  const fetchDevRole = async (): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await sharedClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('app_name', 'renotimeline')
      .in('role', ['admin', 'moderator'])
      .maybeSingle();

    if (error) {
      console.error('Error fetching dev role:', error);
      return false;
    }

    return !!data;
  };

  const { data: isDev = false, isLoading } = useQuery({
    queryKey: ['dev_role', user?.id],
    queryFn: fetchDevRole,
    enabled: !!user,
  });

  return { isDev, isLoading };
};
