import { useState, useEffect } from 'react';
import { sharedClient, renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CrossAppNotification {
  id: string;
  user_id: string;
  from_app: string;
  to_app: string;
  notification_type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export const useCrossAppNotifications = () => {
  const [notifications, setNotifications] = useState<CrossAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch notifications from the database
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await sharedClient
        .from('cross_app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cross-app notifications:', error);
        setError(error.message);
        return;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Send notification to another app
  const sendCrossAppNotification = async (notification: Omit<CrossAppNotification, 'id' | 'created_at' | 'user_id' | 'is_read'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await sharedClient
        .from('cross_app_notifications')
        .insert({
          ...notification,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error sending cross-app notification:', err);
      throw err;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await sharedClient
        .from('cross_app_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await sharedClient
        .from('cross_app_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  // Send notification to CalcReno about RenoTimeline events
  const notifyCalcReno = async (projectId: string, eventType: string, eventData: any) => {
    if (!user) return;

    try {
      const { data: project } = await renotimelineClient
        .from('projects')
        .select('name, calcreno_project_id')
        .eq('id', projectId)
        .single();

      if (!project || !project.calcreno_project_id) {
        console.log('Project is not linked to CalcReno, skipping notification');
        return;
      }

      const notification = {
        from_app: 'renotimeline',
        to_app: 'calcreno',
        notification_type: eventType,
        title: `Aktualizacja z RenoTimeline: ${project.name}`,
        message: `${eventType} w projekcie ${project.name}`,
        data: { ...eventData, projectId, calcrenoProjectId: project.calcreno_project_id },
      };

      await sendCrossAppNotification(notification);
    } catch (err) {
      console.error('Error notifying CalcReno:', err);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = sharedClient
      .channel('cross_app_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'shared_schema',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as CrossAppNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      sharedClient.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    sendCrossAppNotification,
    markAsRead,
    markAllAsRead,
    notifyCalcReno,
    refetch: fetchNotifications,
  };
}; 