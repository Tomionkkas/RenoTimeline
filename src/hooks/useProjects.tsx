
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

// Guest mode sample data
const guestProjects: Project[] = [
  {
    id: 'guest-project-1',
    name: 'Remont łazienki',
    description: 'Kompleksowy remont głównej łazienki - wymiana płytek, instalacji i armatury',
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-03-30',
    budget: 25000,
    owner_id: 'guest-user',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'guest-project-2',
    name: 'Modernizacja kuchni',
    description: 'Wymiana mebli kuchennych, AGD i oświetlenia',
    status: 'active',
    start_date: '2024-02-01',
    end_date: '2024-04-15',
    budget: 35000,
    owner_id: 'guest-user',
    created_at: '2024-01-25T14:30:00Z',
    updated_at: '2024-01-25T14:30:00Z'
  }
];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      setProjects(guestProjects);
      setLoading(false);
      return;
    }

    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    fetchProjects();
  }, [user, isGuestMode]);

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
    if (isGuestMode) {
      // In guest mode, just simulate project creation
      const newProject: Project = {
        id: `guest-project-${Date.now()}`,
        name: projectData.name,
        description: projectData.description || null,
        status: 'active',
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        budget: projectData.budget || null,
        owner_id: 'guest-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    }

    if (!user) return null;

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
