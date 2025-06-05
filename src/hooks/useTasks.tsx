
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

// Guest mode sample data
const guestTasks: Task[] = [
  {
    id: 'guest-task-1',
    title: 'Zdemontować starą armaturę',
    description: 'Usunięcie starej baterii, sedesu i umywalki',
    status: 'done',
    priority: 'high',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-01-20',
    estimated_hours: 8,
    actual_hours: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'guest-task-2',
    title: 'Położyć nowe płytki',
    description: 'Układanie płytek ceramicznych na ścianach i podłodze',
    status: 'in_progress',
    priority: 'high',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-15',
    estimated_hours: 24,
    actual_hours: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    id: 'guest-task-3',
    title: 'Zamontować nową armaturę',
    description: 'Instalacja nowej baterii, sedesu i umywalki',
    status: 'todo',
    priority: 'medium',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-03-10',
    estimated_hours: 12,
    actual_hours: null,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 'guest-task-4',
    title: 'Zaprojektować układ mebli',
    description: 'Stworzenie projektu rozmieszczenia mebli kuchennych',
    status: 'done',
    priority: 'high',
    project_id: 'guest-project-2',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-05',
    estimated_hours: 6,
    actual_hours: null,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
  {
    id: 'guest-task-5',
    title: 'Zamówić meble kuchenne',
    description: 'Złożenie zamówienia na meble zgodnie z projektem',
    status: 'in_progress',
    priority: 'medium',
    project_id: 'guest-project-2',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-28',
    estimated_hours: 4,
    actual_hours: null,
    created_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z'
  }
];

export const useTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      const filteredTasks = projectId 
        ? guestTasks.filter(task => task.project_id === projectId)
        : guestTasks;
      setTasks(filteredTasks);
      setLoading(false);
      return;
    }

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();
  }, [user, isGuestMode, projectId]);

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
    if (isGuestMode) {
      // In guest mode, simulate task creation
      const newTask: Task = {
        id: `guest-task-${Date.now()}`,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        project_id: taskData.project_id,
        assigned_to: taskData.assigned_to || null,
        created_by: 'guest-user',
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours || null,
        actual_hours: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }

    if (!user) return null;

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
    if (isGuestMode) {
      // In guest mode, simulate task update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      ));
      return null;
    }

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
    if (isGuestMode) {
      // In guest mode, simulate task deletion
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return;
    }

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
