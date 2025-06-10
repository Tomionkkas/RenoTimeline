import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, AlertTriangle, CheckCircle, X, Settings, Cog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import WorkflowNotifications from './WorkflowNotifications';

const NotificationCenter = () => {
  const { 
    notifications, 
    workflowNotifications, 
    settings, 
    loading, 
    unreadCount,
    setSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter notifications for different tabs
  const allNotifications = notifications.filter(n => 
    !['workflow_executed', 'workflow_failed'].includes(n.type)
  );
  
  const userWorkflowNotifications = workflowNotifications.filter(n => 
    !['workflow_executed', 'workflow_failed'].includes(n.type)
  );
  
  const systemNotifications = notifications.filter(n => 
    ['deadline', 'overdue', 'completed', 'system', 'workflow_executed', 'workflow_failed'].includes(n.type)
  );

  // This useEffect can be removed as notifications are now handled by the useNotifications hook
  // which fetches them from the database and manages real-time updates

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'system': return <Bell className="w-4 h-4 text-blue-500" />;
      case 'workflow_executed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'workflow_failed': return <X className="w-4 h-4 text-red-500" />;
      case 'automated_action': return <Cog className="w-4 h-4 text-blue-500" />;
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
        {/* Lista powiadomień z tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Wszystkie ({allNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                Automatyzacje ({userWorkflowNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                System ({systemNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {loading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Ładowanie powiadomień...</p>
                  </CardContent>
                </Card>
              ) : allNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Brak powiadomień</p>
                  </CardContent>
                </Card>
              ) : (
                allNotifications.map(notification => (
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
                              {new Date(notification.created_at).toLocaleString('pl-PL')}
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
            </TabsContent>

            <TabsContent value="workflows" className="mt-6">
              <WorkflowNotifications 
                notifications={userWorkflowNotifications}
                onViewExecution={(executionId) => {
                  // Navigate to workflow execution log with specific execution
                  window.location.href = `/workflows/executions?execution=${executionId}`;
                }}
                onViewWorkflow={(workflowId) => {
                  // Navigate to workflow manager with specific workflow highlighted
                  window.location.href = `/workflows?highlight=${workflowId}`;
                }}
                onRetryExecution={(executionId) => {
                  // TODO: Implement retry functionality when needed
                  toast({
                    title: 'Funkcja niedostępna',
                    description: 'Ponowne wykonywanie workflow zostanie dodane w przyszłej aktualizacji',
                    variant: 'default'
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="system" className="space-y-4 mt-6">
              {systemNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Brak powiadomień systemowych</p>
                  </CardContent>
                </Card>
              ) : (
                systemNotifications.map(notification => (
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
                              {new Date(notification.created_at).toLocaleString('pl-PL')}
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
            </TabsContent>
          </Tabs>
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
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Powiadomienia o automatyzacjach</span>
                <Switch
                  checked={settings.workflowNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, workflowNotifications: checked }))
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
