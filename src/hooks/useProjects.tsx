
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemoMode } from './useDemoMode';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isDemoMode, demoProjects } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setProjects(demoProjects as Project[]);
      setLoading(false);
      return;
    }

    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    fetchProjects();
  }, [user, isDemoMode, demoProjects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error('Error in fetchProjects:', err);
      setError('Wystąpił błąd podczas ładowania projektów');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
  }) => {
    if (isDemoMode || !user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      await fetchProjects();
      return data;
    } catch (err) {
      console.error('Error in createProject:', err);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    refetch: fetchProjects
  };
};
