
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  position: number;
}

// Guest mode sample data
const guestSubtasks: Subtask[] = [
  {
    id: 'guest-subtask-1',
    parent_task_id: 'guest-task-1',
    title: 'Zakup narzędzi',
    description: 'Klucze, młotek, dłuto',
    completed: true,
    assigned_to: null,
    due_date: '2024-01-19',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    position: 0
  },
  {
    id: 'guest-subtask-2',
    parent_task_id: 'guest-task-1',
    title: 'Odłączenie wody',
    description: 'Zamknięcie głównego zaworu',
    completed: true,
    assigned_to: null,
    due_date: '2024-01-19',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    position: 1
  },
  {
    id: 'guest-subtask-3',
    parent_task_id: 'guest-task-2',
    title: 'Przygotowanie podłoża',
    description: 'Wyrównanie i zagruntowanie',
    completed: false,
    assigned_to: null,
    due_date: '2024-02-10',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
    position: 0
  }
];

export const useSubtasks = (parentTaskId?: string) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      const filteredSubtasks = parentTaskId 
        ? guestSubtasks.filter(subtask => subtask.parent_task_id === parentTaskId)
        : guestSubtasks;
      setSubtasks(filteredSubtasks);
      setLoading(false);
      return;
    }

    if (!user || !parentTaskId) {
      setSubtasks([]);
      setLoading(false);
      return;
    }

    fetchSubtasks();
  }, [user, isGuestMode, parentTaskId]);

  const fetchSubtasks = async () => {
    if (!parentTaskId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching subtasks:', error);
        setError(error.message);
      } else {
        setSubtasks(data || []);
      }
    } catch (err) {
      console.error('Error in fetchSubtasks:', err);
      setError('Wystąpił błąd podczas ładowania checklist');
    } finally {
      setLoading(false);
    }
  };

  const createSubtask = async (subtaskData: {
    title: string;
    description?: string;
    due_date?: string;
    assigned_to?: string;
  }) => {
    if (!parentTaskId) return null;

    if (isGuestMode) {
      const newSubtask: Subtask = {
        id: `guest-subtask-${Date.now()}`,
        parent_task_id: parentTaskId,
        title: subtaskData.title,
        description: subtaskData.description || null,
        completed: false,
        assigned_to: subtaskData.assigned_to || null,
        due_date: subtaskData.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: subtasks.length
      };
      setSubtasks(prev => [...prev, newSubtask]);
      return newSubtask;
    }

    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{
          ...subtaskData,
          parent_task_id: parentTaskId,
          position: subtasks.length
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating subtask:', error);
        throw error;
      }

      await fetchSubtasks();
      return data;
    } catch (err) {
      console.error('Error in createSubtask:', err);
      throw err;
    }
  };

  const updateSubtask = async (subtaskId: string, updates: Partial<Subtask>) => {
    if (isGuestMode) {
      setSubtasks(prev => prev.map(subtask => 
        subtask.id === subtaskId 
          ? { ...subtask, ...updates, updated_at: new Date().toISOString() }
          : subtask
      ));
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', subtaskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subtask:', error);
        throw error;
      }

      await fetchSubtasks();
      return data;
    } catch (err) {
      console.error('Error in updateSubtask:', err);
      throw err;
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    if (isGuestMode) {
      setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
      return;
    }

    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) {
        console.error('Error deleting subtask:', error);
        throw error;
      }

      await fetchSubtasks();
    } catch (err) {
      console.error('Error in deleteSubtask:', err);
      throw err;
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    return updateSubtask(subtaskId, { completed });
  };

  return {
    subtasks,
    loading,
    error,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtask,
    refetch: fetchSubtasks
  };
};
