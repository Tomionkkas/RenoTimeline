import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  user_id: string;
  project_id?: string | null;
  type: 'deadline' | 'overdue' | 'completed' | 'system' | 'workflow_executed' | 'workflow_failed' | 'automated_action';
  title: string;
  message: string;
  task_id?: string | null;
  workflow_id?: string | null;
  workflow_execution_id?: string | null;
  priority: 'low' | 'medium' | 'high';
  read: boolean | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  deadlineReminders: boolean;
  overdueAlerts: boolean;
  completionNotifications: boolean;
  systemNotifications: boolean;
  workflowNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    deadlineReminders: true,
    overdueAlerts: true,
    completionNotifications: true,
    systemNotifications: true,
    workflowNotifications: true,
    emailNotifications: false,
    pushNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać powiadomień',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new notification
  const createNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
          read: false
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotifications(prev => [data as Notification, ...prev]);
      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się oznaczyć powiadomienia jako przeczytane',
        variant: 'destructive'
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast({
        title: 'Powiadomienia',
        description: 'Wszystkie powiadomienia zostały oznaczone jako przeczytane'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się oznaczyć wszystkich powiadomień jako przeczytane',
        variant: 'destructive'
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć powiadomienia',
        variant: 'destructive'
      });
    }
  };

  // Create workflow notification
  const createWorkflowNotification = async (
    type: 'workflow_executed' | 'workflow_failed' | 'automated_action',
    title: string,
    message: string,
    options: {
      project_id?: string;
      task_id?: string;
      workflow_id?: string;
      workflow_execution_id?: string;
      priority?: 'low' | 'medium' | 'high';
      metadata?: any;
    } = {}
  ) => {
    if (!settings.workflowNotifications) return;

    return createNotification({
      type,
      title,
      message,
      priority: options.priority || 'medium',
      project_id: options.project_id,
      task_id: options.task_id,
      workflow_id: options.workflow_id,
      workflow_execution_id: options.workflow_execution_id,
      metadata: options.metadata || {}
    });
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get workflow notifications
  const workflowNotifications = notifications.filter(n => 
    ['workflow_executed', 'workflow_failed', 'automated_action'].includes(n.type)
  );

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up real-time subscription with unique channel name
      const channelName = `notifications_${user.id}_${Date.now()}`;
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification real-time update:', payload.eventType);
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new as Notification, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up notifications subscription');
        subscription.unsubscribe();
      };
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-subscriptions

  return {
    notifications,
    workflowNotifications,
    settings,
    loading,
    unreadCount,
    setSettings,
    fetchNotifications,
    createNotification,
    createWorkflowNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}; 