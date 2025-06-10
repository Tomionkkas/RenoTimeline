import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CrossAppNotification {
  id: string;
  project_id: string;
  calcreno_project_id: string;
  source_app: 'calcreno' | 'renotimeline';
  type: 'budget_updated' | 'cost_alert' | 'project_milestone' | 'material_price_change' | 'task_completed';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  calcreno_reference_url?: string;
  created_at: string;
  read: boolean;
  user_id: string;
}

export const useCrossAppNotifications = () => {
  const [notifications, setNotifications] = useState<CrossAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create cross-app notifications table if it doesn't exist
  const initializeNotificationsTable = async () => {
    const { error } = await supabase.from('cross_app_notifications').select('id').limit(1);
    if (error && error.code === '42P01') {
      // Table doesn't exist, we'll need to create it via migration
      console.log('Cross-app notifications table needs to be created');
    }
  };

  // Fetch notifications from the database
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('cross_app_notifications')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cross-app notifications:', error);
        setError(error.message);
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Send notification to another app
  const sendCrossAppNotification = async (notification: Omit<CrossAppNotification, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cross_app_notifications')
        .insert({
          ...notification,
          user_id: user.user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setNotifications(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error sending cross-app notification:', err);
      throw err;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('cross_app_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // Send notification to CalcReno about RenoTimeline events
  const notifyCalcReno = async (projectId: string, eventType: string, data: any) => {
    try {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('name, calcreno_project_id, calcreno_reference_url')
        .eq('id', projectId)
        .single();

      if (!project || !project.calcreno_project_id) {
        console.log('Project is not linked to CalcReno, skipping notification');
        return;
      }

      const notification = {
        project_id: projectId,
        calcreno_project_id: project.calcreno_project_id,
        source_app: 'renotimeline' as const,
        type: eventType as any,
        title: `Aktualizacja z RenoTimeline - ${project.name}`,
        message: `${eventType} w projekcie ${project.name}`,
        priority: 'medium' as const,
        data,
        calcreno_reference_url: project.calcreno_reference_url,
        read: false,
      };

      await sendCrossAppNotification(notification);
    } catch (err) {
      console.error('Error notifying CalcReno:', err);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      subscription = supabase
        .channel('cross_app_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cross_app_notifications',
            filter: `user_id=eq.${user.user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as CrossAppNotification, ...prev]);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    initializeNotificationsTable();
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    sendCrossAppNotification,
    markAsRead,
    notifyCalcReno,
    refetch: fetchNotifications,
  };
}; 