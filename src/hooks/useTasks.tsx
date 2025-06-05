
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemoMode } from './useDemoMode';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
}

export const useTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isDemoMode, demoTasks } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      const filteredTasks = projectId 
        ? demoTasks.filter(task => task.project_id === projectId)
        : demoTasks;
      setTasks(filteredTasks as Task[]);
      setLoading(false);
      return;
    }

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();
  }, [user, isDemoMode, demoTasks, projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        setError(error.message);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Error in fetchTasks:', err);
      setError('Wystąpił błąd podczas ładowania zadań');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    project_id: string;
    assigned_to?: string;
    due_date?: string;
    estimated_hours?: number;
  }) => {
    if (isDemoMode || !user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      await fetchTasks();
      return data;
    } catch (err) {
      console.error('Error in createTask:', err);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (isDemoMode) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      await fetchTasks();
      return data;
    } catch (err) {
      console.error('Error in updateTask:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (isDemoMode) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }

      await fetchTasks();
    } catch (err) {
      console.error('Error in deleteTask:', err);
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};
