
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_type: 'email' | 'notification' | 'both';
  reminder_time: string;
  message: string | null;
  sent: boolean;
  created_at: string;
}

// Guest mode sample data
const guestReminders: Reminder[] = [
  {
    id: 'guest-reminder-1',
    task_id: 'guest-task-3',
    user_id: 'guest-user',
    reminder_type: 'notification',
    reminder_time: '2024-03-09T09:00:00Z',
    message: 'Jutro termin montażu armatury',
    sent: false,
    created_at: '2024-01-17T10:00:00Z'
  }
];

export const useReminders = (taskId?: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isGuestMode = user && 'isGuest' in user;

  useEffect(() => {
    if (isGuestMode) {
      const filteredReminders = taskId 
        ? guestReminders.filter(reminder => reminder.task_id === taskId)
        : guestReminders;
      setReminders(filteredReminders);
      setLoading(false);
      return;
    }

    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    fetchReminders();
  }, [user, isGuestMode, taskId]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('reminder_time', { ascending: true });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reminders:', error);
        setError(error.message);
      } else {
        // Type assertion to ensure proper typing from Supabase
        const typedData = (data || []).map(item => ({
          ...item,
          reminder_type: item.reminder_type as 'email' | 'notification' | 'both'
        }));
        setReminders(typedData);
      }
    } catch (err) {
      console.error('Error in fetchReminders:', err);
      setError('Wystąpił błąd podczas ładowania przypomnień');
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (reminderData: {
    task_id: string;
    reminder_type: 'email' | 'notification' | 'both';
    reminder_time: string;
    message?: string;
  }) => {
    if (isGuestMode) {
      const newReminder: Reminder = {
        id: `guest-reminder-${Date.now()}`,
        task_id: reminderData.task_id,
        user_id: 'guest-user',
        reminder_type: reminderData.reminder_type,
        reminder_time: reminderData.reminder_time,
        message: reminderData.message || null,
        sent: false,
        created_at: new Date().toISOString()
      };
      setReminders(prev => [...prev, newReminder]);
      return newReminder;
    }

    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          ...reminderData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating reminder:', error);
        throw error;
      }

      await fetchReminders();
      return data;
    } catch (err) {
      console.error('Error in createReminder:', err);
      throw err;
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (isGuestMode) {
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      return;
    }

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) {
        console.error('Error deleting reminder:', error);
        throw error;
      }

      await fetchReminders();
    } catch (err) {
      console.error('Error in deleteReminder:', err);
      throw err;
    }
  };

  return {
    reminders,
    loading,
    error,
    createReminder,
    deleteReminder,
    refetch: fetchReminders
  };
};
