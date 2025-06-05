
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DashboardStats {
  completedTasks: number;
  activeTasks: number;
  totalProjects: number;
  productivity: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    completedTasks: 0,
    activeTasks: 0,
    totalProjects: 0,
    productivity: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      // Guest mode sample data
      setStats({
        completedTasks: 24,
        activeTasks: 8,
        totalProjects: 3,
        productivity: 89
      });
      setLoading(false);
      return;
    }

    if (!user) {
      setStats({
        completedTasks: 0,
        activeTasks: 0,
        totalProjects: 0,
        productivity: 0
      });
      setLoading(false);
      return;
    }

    fetchStats();
  }, [user, isGuestMode]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch projects count
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user?.id);

      if (projectsError) throw projectsError;

      // Fetch tasks stats
      const { data: completedTasks, error: completedError } = await supabase
        .from('tasks')
        .select('id')
        .eq('created_by', user?.id)
        .eq('status', 'done');

      if (completedError) throw completedError;

      const { data: activeTasks, error: activeError } = await supabase
        .from('tasks')
        .select('id')
        .eq('created_by', user?.id)
        .in('status', ['todo', 'in_progress']);

      if (activeError) throw activeError;

      // Calculate productivity (completed vs total tasks)
      const totalTasks = (completedTasks?.length || 0) + (activeTasks?.length || 0);
      const productivity = totalTasks > 0 ? Math.round(((completedTasks?.length || 0) / totalTasks) * 100) : 0;

      setStats({
        completedTasks: completedTasks?.length || 0,
        activeTasks: activeTasks?.length || 0,
        totalProjects: projects?.length || 0,
        productivity
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
