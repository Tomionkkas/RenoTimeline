import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'presentation' | 'review' | 'task';
  date?: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  priority?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      // Guest mode sample data
      setEvents([
        {
          id: '1',
          title: 'Spotkanie zespołu',
          time: '10:00',
          type: 'meeting',
          date: format(new Date(), 'yyyy-MM-dd'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Prezentacja klienta',
          time: '14:00',
          type: 'presentation',
          date: format(new Date(), 'yyyy-MM-dd'),
          isAllDay: false,
        },
        {
          id: '3',
          title: 'Code Review',
          time: '16:30',
          type: 'review',
          date: format(new Date(), 'yyyy-MM-dd'),
          isAllDay: false,
        },
      ]);
      setLoading(false);
      return;
    }

    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    fetchTodayEvents();
  }, [user, isGuestMode]);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: tasks, error } = await supabase
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
          project_id,
          projects!inner(name)
        `)
        .eq('created_by', user?.id)
        .eq('due_date', today)
        .limit(5);

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        time: task.start_time || new Date().toLocaleTimeString('pl-PL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'task' as const,
        date: task.due_date,
        projectId: task.project_id,
        projectName: task.projects?.name,
        status: task.status,
        priority: task.priority,
        isAllDay: task.is_all_day ?? true,
        startTime: task.start_time,
        endTime: task.end_time
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // New enhanced methods for calendar integration
  const getEventsForDateRange = async (startDate: Date, endDate: Date, projectId?: string) => {
    if (isGuestMode || !user) return [];

    try {
      let query = supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          due_date, 
          start_date,
          start_time, 
          end_time, 
          is_all_day, 
          status, 
          priority,
          project_id,
          projects!inner(name)
        `)
        .eq('created_by', user.id)
        .gte('due_date', format(startDate, 'yyyy-MM-dd'))
        .lte('due_date', format(endDate, 'yyyy-MM-dd'));

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      return (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        time: task.start_time || '00:00',
        type: 'task' as const,
        date: task.due_date,
        projectId: task.project_id,
        projectName: task.projects?.name,
        status: task.status,
        priority: task.priority,
        isAllDay: task.is_all_day ?? true,
        startTime: task.start_time,
        endTime: task.end_time
      }));
    } catch (error) {
      console.error('Error fetching events for date range:', error);
      return [];
    }
  };

  const getEventsForMonth = async (month: number, year: number, projectId?: string) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return getEventsForDateRange(startDate, endDate, projectId);
  };

  const updateEventDate = async (eventId: string, newDate: string, newTime?: string) => {
    if (isGuestMode || !user) return false;

    try {
      const updateData: any = {
        due_date: newDate,
        updated_at: new Date().toISOString()
      };

      if (newTime) {
        updateData.start_time = newTime;
        updateData.is_all_day = false;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) throw error;

      // Refresh events after update
      await fetchTodayEvents();
      return true;
    } catch (error) {
      console.error('Error updating event date:', error);
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (isGuestMode || !user) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) throw error;

      // Refresh events after deletion
      await fetchTodayEvents();
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  };

  return { 
    events, 
    loading, 
    refetch: fetchTodayEvents,
    getEventsForDateRange,
    getEventsForMonth,
    updateEventDate,
    deleteEvent
  };
};
