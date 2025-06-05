
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'presentation' | 'review' | 'task';
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
        },
        {
          id: '2',
          title: 'Prezentacja klienta',
          time: '14:00',
          type: 'presentation',
        },
        {
          id: '3',
          title: 'Code Review',
          time: '16:30',
          type: 'review',
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
        .select('id, title, due_date')
        .eq('created_by', user?.id)
        .eq('due_date', today)
        .limit(5);

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        time: new Date().toLocaleTimeString('pl-PL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'task' as const
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, refetch: fetchTodayEvents };
};
