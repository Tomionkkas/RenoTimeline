import { useState, useCallback } from 'react';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Assuming CalendarTaskData is similar to the new CalendarEvent, but maybe simpler
export interface CalendarTaskData {
  id: string;
  title: string;
  date: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  priority?: number;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export const useCalendarManagement = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getTasksForCalendar = useCallback(async (projectId?: string) => {
    if (!user) return [];

    try {
      setLoading(true);

      let query = renotimelineClient
        .from('tasks')
        .select(`
          id,
          name,
          end_date,
          start_date,
          status,
          priority,
          description,
          project_id,
          projects (name)
        `)
        // RLS handles user access
        .not('end_date', 'is', null);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      query = query.order('end_date', { ascending: true });

      const { data: tasks, error } = await query;

      if (error) throw error;

      return (tasks || []).map(task => ({
        id: task.id,
        title: task.name,
        date: task.end_date!,
        projectId: task.project_id,
        projectName: task.projects?.name || 'Unknown Project',
        status: task.status,
        priority: task.priority,
        isAllDay: true, // Simplified assumption
        startTime: task.start_date || undefined,
        endTime: task.end_date || undefined,
        description: task.description || undefined
      })) as CalendarTaskData[];

    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Other management functions (create, update, delete) would go here
  // and would also use renotimelineClient and the new schema.

  return { 
    loading,
    getTasksForCalendar
  };
}; 