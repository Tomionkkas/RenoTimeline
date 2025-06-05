
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Clock, AlertTriangle, CheckCircle, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: 'deadline' | 'overdue' | 'completed' | 'system';
  title: string;
  message: string;
  taskId?: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    deadlineReminders: true,
    overdueAlerts: true,
    completionNotifications: true,
    systemNotifications: true,
    emailNotifications: false,
    pushNotifications: true
  });
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();

  // Generowanie powiadomień na podstawie zadań
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      tasks.forEach(task => {
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          
          // Powiadomienia o zbliżających się terminach
          if (settings.deadlineReminders && dueDate <= tomorrow && dueDate > now && task.status !== 'done') {
            newNotifications.push({
              id: `deadline-${task.id}`,
              type: 'deadline',
              title: 'Zbliżający się termin',
              message: `Zadanie "${task.title}" ma termin jutro`,
              taskId: task.id,
              priority: task.priority === 'urgent' ? 'high' : 'medium',
              read: false,
              createdAt: now
            });
          }
          
          // Powiadomienia o przeterminowanych zadaniach
          if (settings.overdueAlerts && dueDate < now && task.status !== 'done') {
            newNotifications.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              title: 'Zadanie przeterminowane',
              message: `Zadanie "${task.title}" jest przeterminowane`,
              taskId: task.id,
              priority: 'high',
              read: false,
              createdAt: now
            });
          }
        }
        
        // Powiadomienia o ukończonych zadaniach
        if (settings.completionNotifications && task.status === 'done') {
          const completedRecently = new Date(task.updated_at) > new Date(now.getTime() - 60 * 60 * 1000);
          if (completedRecently) {
            newNotifications.push({
              id: `completed-${task.id}`,
              type: 'completed',
              title: 'Zadanie ukończone',
              message: `Gratulacje! Ukończyłeś zadanie "${task.title}"`,
              taskId: task.id,
              priority: 'low',
              read: false,
              createdAt: now
            });
          }
        }
      });

      // Dodaj powiadomienia systemowe dla nowych użytkowników
      if (settings.systemNotifications && tasks.length === 0) {
        newNotifications.push({
          id: 'welcome-system',
          type: 'system',
          title: 'Witaj w RenoTimeline!',
          message: 'Rozpocznij od utworzenia swojego pierwszego projektu',
          priority: 'medium',
          read: false,
          createdAt: now
        });
      }

      setNotifications(prev => {
        // Usuń stare powiadomienia tego samego typu i dodaj nowe
        const existingIds = newNotifications.map(n => n.id);
        const filtered = prev.filter(n => !existingIds.includes(n.id));
        return [...filtered, ...newNotifications].slice(0, 50); // Maksymalnie 50 powiadomień
      });
    };

    generateNotifications();
    
    // Sprawdzaj powiadomienia co 5 minut
    const interval = setInterval(generateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks, settings]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: 'Powiadomienia',
      description: 'Wszystkie powiadomienia zostały oznaczone jako przeczytane'
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'system': return <Bell className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold gradient-text">Centrum powiadomień</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} nowych
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Oznacz wszystkie jako przeczytane
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista powiadomień */}
        <div className="lg:col-span-2 space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Brak powiadomień</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map(notification => (
              <Card
                key={notification.id}
                className={`
                  ${notification.read ? 'opacity-60' : ''}
                  ${getPriorityColor(notification.priority)}
                  transition-opacity
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {notification.createdAt.toLocaleString('pl-PL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Oznacz jako przeczytane
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Ustawienia powiadomień */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Ustawienia powiadomień</span>
              </CardTitle>
              <CardDescription>
                Dostosuj rodzaje powiadomień, które chcesz otrzymywać
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Przypomnienia o terminach</span>
                <Switch
                  checked={settings.deadlineReminders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, deadlineReminders: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Alerty o przeterminowanych</span>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, overdueAlerts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Powiadomienia o ukończeniu</span>
                <Switch
                  checked={settings.completionNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, completionNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Powiadomienia systemowe</span>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, systemNotifications: checked }))
                  }
                />
              </div>
              
              <hr className="border-gray-700" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Powiadomienia email</span>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Powiadomienia push</span>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
