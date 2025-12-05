import { useState, useEffect, useCallback } from 'react';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string; // Keep as 'title' for the calendar component, but map from 'name'
  start: string; // ISO string
  end: string;   // ISO string
  allDay: boolean;
  extendedProps: {
    type: 'task';
    projectId?: string;
    projectName?: string;
    status?: string;
    priority?: number;
  };
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEventsForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: tasks, error } = await renotimelineClient
        .from('tasks')
        .select(`
          id,
          name,
          end_date,
          start_date,
          status,
          priority,
          project_id,
          projects (name)
        `)
        // RLS will handle user access
        // Filter by end_date (due date) within the calendar range
        .gte('end_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString())
        .not('end_date', 'is', null);

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (tasks || []).map(task => ({
        id: task.id,
        title: task.name,
        // Use start_date if available, otherwise use end_date for both start and end
        start: task.start_date || task.end_date!,
        end: task.end_date!,
        allDay: true, // Assuming tasks are all-day events for simplicity
        extendedProps: {
          type: 'task' as const,
          projectId: task.project_id,
          projectName: task.projects?.name,
          status: task.status,
          priority: task.priority,
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch for the current month
  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    fetchEventsForDateRange(startOfMonth, endOfMonth);
  }, [fetchEventsForDateRange]);


  return { events, loading, fetchEventsForDateRange };
};
