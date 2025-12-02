import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, AlertTriangle, CheckCircle, X, Settings, Cog, ArrowRight, Target, Calendar, Users, TrendingUp, ExternalLink, FolderOpen, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useCrossAppNotifications, CrossAppNotification } from '@/hooks/useCrossAppNotifications';

const NotificationCenter = () => {
  const { 
    notifications, 
    loading, 
    unreadCount,
    markAsRead,
    markAllAsRead, // Assuming this will be added to the hook
    // deleteNotification // Assuming this will be added
  } = useCrossAppNotifications();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // A simple state for settings as the hook doesn't provide it anymore
  const [settings, setSettings] = useState({
    deadlineReminders: true,
    overdueAlerts: true,
    completionNotifications: true,
    systemNotifications: true,
    workflowNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
  });


  // Helper function to get task details
  const getTaskDetails = (taskId: string | null) => {
    if (!taskId) return null;
    return tasks.find(task => task.id === taskId);
  };

  // Helper function to get project details
  const getProjectDetails = (projectId: string | null) => {
    if (!projectId) return null;
    // Cross-app notifications might not have project details readily available in the same way.
    // We will rely on the data within the notification object.
    return projects.find(project => project.id === projectId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'system': return <Bell className="w-4 h-4 text-blue-400" />;
      case 'workflow_executed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'workflow_failed': return <X className="w-4 h-4 text-red-400" />;
      case 'automated_action': return <Cog className="w-4 h-4 text-blue-400" />;
      // CalcReno notification types
      case 'task_moved': return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'task_completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'milestone_reached': return <Target className="w-4 h-4 text-purple-400" />;
      case 'timeline_delay': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'timeline_updated': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'team_update': return <Users className="w-4 h-4 text-emerald-400" />;
      case 'progress_update': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-white/60" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-500/10';
      case 'medium': return 'border-amber-500/30 bg-amber-500/10';
      case 'low': return 'border-emerald-500/30 bg-emerald-500/10';
      default: return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'deadline': return 'Przypomnienie o terminie';
      case 'overdue': return 'Zadanie przeterminowane';
      case 'completed': return 'Zadanie ukończone';
      case 'task_moved': return 'Zadanie przeniesione';
      case 'task_completed': return 'Zadanie ukończone';
      case 'milestone_reached': return 'Osiągnięto kamień milowy';
      case 'timeline_delay': return 'Opóźnienie w harmonogramie';
      case 'timeline_updated': return 'Aktualizacja harmonogramu';
      case 'team_update': return 'Aktualizacja zespołu';
      case 'progress_update': return 'Aktualizacja postępu';
      case 'system': return 'Powiadomienie systemowe';
      default: return 'Powiadomienie';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'przed chwilą';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dni temu`;
    return date.toLocaleDateString('pl-PL');
  };

  const handleTaskNavigation = (taskId: string, projectId: string) => {
    // Navigate to the project dashboard with task highlighted
    window.location.href = `/project/${projectId}?highlight=${taskId}`;
  };

  const handleProjectNavigation = (projectId: string) => {
    window.location.href = `/project/${projectId}`;
  };

  // Clean up placeholder text from notifications
  const cleanNotificationText = (text: string, task?: any, project?: any) => {
    if (!text) return text;
    
    let cleanText = text;
    
    // Replace template variables with actual values or remove them
    if (task?.title) {
      cleanText = cleanText.replace(/\{task\.title\}/g, task.title);
    } else {
      cleanText = cleanText.replace(/\{task\.title\}/g, '');
    }
    
    if (project?.name) {
      cleanText = cleanText.replace(/\{project\.name\}/g, project.name);
    } else {
      cleanText = cleanText.replace(/\{project\.name\}/g, '');
    }
    
    // Clean up any remaining template variables
    cleanText = cleanText.replace(/\{[^}]+\}/g, '');
    
    // Clean up extra spaces and polish the text
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    cleanText = cleanText.replace(/^Zadanie\s+zostało/, 'Zadanie zostało');
    cleanText = cleanText.replace(/^Projekt\s+został/, 'Projekt został');
    
    return cleanText;
  };

  const renderEnhancedNotification = (notification: CrossAppNotification) => {
    const { data } = notification;
    const task = getTaskDetails(data?.taskId);
    const project = getProjectDetails(data?.projectId);
    
    return (
      <Card
        key={notification.id}
        className={`
          glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
          ${notification.is_read ? 'opacity-60' : ''}
          border-l-4 border-blue-500/30 bg-blue-500/10
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1">
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs bg-white/10 border-white/20 text-white/80">
                    {getTypeDisplayName(notification.notification_type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300">
                    {notification.from_app}
                  </Badge>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <h3 className="font-medium text-sm mb-1 text-white">{notification.title}</h3>
                <p className="text-xs text-white/60 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/50">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                  onClick={() => markAsRead(notification.id)}
                >
                  Przeczytane
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold text-white">Centrum powiadomień</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} nowych
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              Oznacz wszystkie jako przeczytane
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista powiadomień z tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg">
                <TabsTrigger value="all" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <Bell className="w-4 h-4" />
                  <span>Wszystkie ({notifications.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4 animate-fadeIn">
              {loading ? (
                <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
                  <CardContent className="py-12 text-center">
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
                    </div>
                    <p className="text-white/60">Ładowanie powiadomień...</p>
                  </CardContent>
                </Card>
              ) : notifications.length === 0 ? (
                <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
                  <CardContent className="py-12 text-center">
                    <Bell className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">Brak powiadomień</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map(notification => renderEnhancedNotification(notification))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Ustawienia powiadomień */}
        <div>
          <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Settings className="w-5 h-5" />
                <span>Ustawienia powiadomień</span>
              </CardTitle>
              <CardDescription className="text-white/60">
                Dostosuj rodzaje powiadomień, które chcesz otrzymywać
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Przypomnienia o terminach</span>
                <Switch
                  checked={settings.deadlineReminders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, deadlineReminders: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Alerty o przeterminowanych</span>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, overdueAlerts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Powiadomienia o ukończeniu</span>
                <Switch
                  checked={settings.completionNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, completionNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Powiadomienia systemowe</span>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, systemNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Powiadomienia o automatyzacjach</span>
                <Switch
                  checked={settings.workflowNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, workflowNotifications: checked }))
                  }
                />
              </div>
              
              <hr className="border-white/10" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Powiadomienia email</span>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Powiadomienia push</span>
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
