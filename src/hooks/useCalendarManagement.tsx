import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { format } from 'date-fns';

interface QuickTaskData {
  title: string;
  date: string;
  projectId: string;
  time?: string;
  isAllDay?: boolean;
}

interface CalendarTaskData {
  id: string;
  title: string;
  date: string;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export const useCalendarManagement = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createTask, updateTask } = useTasks();

  const isGuestMode = user && 'isGuest' in user;

  const createQuickTask = async (taskData: QuickTaskData) => {
    if (isGuestMode || !user) {
      console.log('Guest mode - would create task:', taskData);
      return { success: true, taskId: `guest-${Date.now()}` };
    }

    try {
      setLoading(true);
      
      const newTask = {
        title: taskData.title,
        description: '',
        project_id: taskData.projectId,
        assigned_to: null,
        due_date: taskData.date,
        start_date: null,
        start_time: taskData.time || null,
        end_time: null,
        is_all_day: taskData.isAllDay ?? !taskData.time,
        status: 'todo' as const,
        priority: 'medium' as const,
        estimated_hours: null
      };

      const result = await createTask(newTask);
      
      return { 
        success: true, 
        taskId: result?.id,
        message: 'Zadanie zostało pomyślnie utworzone' 
      };
    } catch (error) {
      console.error('Error creating quick task:', error);
      return { 
        success: false, 
        error: 'Błąd podczas tworzenia zadania' 
      };
    } finally {
      setLoading(false);
    }
  };

  const moveTaskToDate = async (taskId: string, newDate: string, newTime?: string) => {
    if (isGuestMode || !user) {
      console.log('Guest mode - would move task:', { taskId, newDate, newTime });
      return { success: true };
    }

    try {
      setLoading(true);

      const updateData: any = {
        due_date: newDate,
        updated_at: new Date().toISOString()
      };

      if (newTime !== undefined) {
        updateData.start_time = newTime;
        updateData.is_all_day = !newTime;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('created_by', user.id);

      if (error) throw error;

      return { 
        success: true,
        message: 'Zadanie zostało przeniesione na nową datę'
      };
    } catch (error) {
      console.error('Error moving task:', error);
      return { 
        success: false, 
        error: 'Błąd podczas przenoszenia zadania' 
      };
    } finally {
      setLoading(false);
    }
  };

  const getTasksForCalendar = useCallback(async (projectId?: string, status?: 'todo' | 'in_progress' | 'review' | 'done') => {
    if (isGuestMode || !user) {
      // Guest mode sample data
      return [
        {
          id: 'guest-1',
          title: 'Przykładowe zadanie',
          date: format(new Date(), 'yyyy-MM-dd'),
          projectId: 'guest-project',
          projectName: 'Przykładowy projekt',
          status: 'todo',
          priority: 'medium',
          isAllDay: true,
          description: 'To jest przykładowe zadanie w trybie demo'
        }
      ];
    }

    try {
      setLoading(true);

      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          start_time,
          end_time,
          is_all_day,
          status,
          priority,
          description,
          project_id,
          projects!inner(name)
        `)
        .eq('created_by', user.id)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      return (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        date: task.due_date!,
        projectId: task.project_id,
        projectName: task.projects?.name || 'Nieznany projekt',
        status: (task.status as 'todo' | 'in_progress' | 'review' | 'done') || 'todo',
        priority: (task.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        isAllDay: task.is_all_day ?? true,
        startTime: task.start_time || undefined,
        endTime: task.end_time || undefined,
        description: task.description || undefined
      })) as CalendarTaskData[];

    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isGuestMode, user]);

  const updateTaskTimeSettings = async (
    taskId: string, 
    timeSettings: {
      startTime?: string;
      endTime?: string;
      isAllDay?: boolean;
    }
  ) => {
    if (isGuestMode || !user) {
      console.log('Guest mode - would update task time:', { taskId, timeSettings });
      return { success: true };
    }

    try {
      setLoading(true);

      const updateData: any = {
        start_time: timeSettings.startTime || null,
        end_time: timeSettings.endTime || null,
        is_all_day: timeSettings.isAllDay ?? true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('created_by', user.id);

      if (error) throw error;

      return { 
        success: true,
        message: 'Ustawienia czasu zostały zaktualizowane'
      };
    } catch (error) {
      console.error('Error updating task time settings:', error);
      return { 
        success: false, 
        error: 'Błąd podczas aktualizacji ustawień czasu' 
      };
    } finally {
      setLoading(false);
    }
  };

  const duplicateTask = async (taskId: string, newDate: string) => {
    if (isGuestMode || !user) {
      console.log('Guest mode - would duplicate task:', { taskId, newDate });
      return { success: true, taskId: `guest-duplicate-${Date.now()}` };
    }

    try {
      setLoading(true);

      // First get the original task
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('created_by', user.id)
        .single();

      if (fetchError || !originalTask) {
        throw new Error('Nie można znaleźć oryginalnego zadania');
      }

      // Create a duplicate with new date
      const duplicateData = {
        title: `${originalTask.title} (kopia)`,
        description: originalTask.description,
        project_id: originalTask.project_id,
        assigned_to: originalTask.assigned_to,
        priority: originalTask.priority,
        due_date: newDate,
        start_date: originalTask.start_date,
        start_time: originalTask.start_time,
        end_time: originalTask.end_time,
        is_all_day: originalTask.is_all_day,
        estimated_hours: originalTask.estimated_hours,
        status: 'todo' as const
      };

      const result = await createTask(duplicateData);

      return { 
        success: true, 
        taskId: result?.id,
        message: 'Zadanie zostało pomyślnie zduplikowane'
      };
    } catch (error) {
      console.error('Error duplicating task:', error);
      return { 
        success: false, 
        error: 'Błąd podczas duplikowania zadania' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createQuickTask,
    moveTaskToDate,
    getTasksForCalendar,
    updateTaskTimeSettings,
    duplicateTask
  };
}; 