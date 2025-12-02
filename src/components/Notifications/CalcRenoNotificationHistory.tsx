import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  ExternalLink, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { NotificationType } from '@/lib/types/notifications';

interface CalcRenoNotification {
  id: string;
  project_id: string;
  calcreno_project_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: {
    event_data?: any;
    correlation_data?: any;
    suggested_actions?: Array<{
      action: string;
      description: string;
      calcreno_url?: string;
      renotimeline_url?: string;
    }>;
  };
  created_at: string;
  project_name?: string;
}

interface CalcRenoNotificationHistoryProps {
  projectId?: string;
  maxItems?: number;
  showActions?: boolean;
}

export const CalcRenoNotificationHistory: React.FC<CalcRenoNotificationHistoryProps> = ({
  projectId,
  maxItems = 10,
  showActions = true
}) => {
  const [notifications, setNotifications] = useState<CalcRenoNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development (replace with real API call)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        
        // Mock notifications for development
        const mockNotifications: CalcRenoNotification[] = [
          {
            id: '1',
            project_id: projectId || 'project-1',
            calcreno_project_id: 'calc-proj-123',
            type: 'task_completed',
            title: 'Zadanie ukończone - Instalacja elektryczna',
            message: 'Zadanie "Instalacja elektryczna" zostało ukończone w projekcie Remont kuchni.',
            priority: 'medium',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            project_name: 'Remont kuchni',
            data: {
              event_data: {
                task_id: 'task-123',
                task_title: 'Instalacja elektryczna',
                completion_date: new Date().toISOString()
              },
              correlation_data: {
                estimated_cost_impact: 0,
                timeline_change_days: 0
              },
              suggested_actions: [
                {
                  action: 'update_cost_estimate',
                  description: 'Sprawdź czy czas pracy był zgodny z kalkulacją',
                  calcreno_url: '/project/calc-proj-123/costs'
                }
              ]
            }
          },
          {
            id: '2',
            project_id: projectId || 'project-1',
            calcreno_project_id: 'calc-proj-123',
            type: 'milestone_reached',
            title: 'Osiągnięto milestone - Połowa projektu',
            message: 'Projekt Remont kuchni osiągnął 50% ukończenia. Milestone "Połowa projektu" został zrealizowany.',
            priority: 'high',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
            project_name: 'Remont kuchni',
            data: {
              event_data: {
                milestone_name: 'Połowa projektu',
                completion_percentage: 50,
                tasks_completed: 12,
                total_tasks: 24
              },
              correlation_data: {
                progress_percentage: 50
              }
            }
          },
          {
            id: '3',
            project_id: projectId || 'project-2',
            calcreno_project_id: 'calc-proj-456',
            type: 'timeline_delay',
            title: 'Opóźnienie w projekcie Remont łazienki',
            message: 'Projekt Remont łazienki ma 3-dniowe opóźnienie. Nowa data zakończenia: 2024-03-18.',
            priority: 'high',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
            project_name: 'Remont łazienki',
            data: {
              event_data: {
                delay_days: 3,
                original_end_date: '2024-03-15',
                new_end_date: '2024-03-18',
                delay_reason: 'Opóźnienie dostawy materiałów'
              },
              correlation_data: {
                timeline_change_days: 3,
                estimated_cost_impact: 2400
              }
            }
          }
        ];

        // Filter by project if specified
        const filteredNotifications = projectId 
          ? mockNotifications.filter(n => n.project_id === projectId)
          : mockNotifications;

        setNotifications(filteredNotifications.slice(0, maxItems));
      } catch (err) {
        setError('Nie udało się załadować historii powiadomień');
        console.error('Error loading CalcReno notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [projectId, maxItems]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Info className="w-4 h-4 text-blue-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      task_completed: 'Zadanie ukończone',
      milestone_reached: 'Milestone osiągnięty',
      timeline_delay: 'Opóźnienie',
      budget_timeline_alert: 'Alert budżetowy',
      team_update: 'Aktualizacja zespołu',
      critical_issue: 'Krytyczny problem',
      progress_update: 'Raport postępu',
      timeline_updated: 'Aktualizacja harmonogramu',
      project_status_changed: 'Zmiana statusu'
    };
    return labels[type] || type;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dni temu`;
    } else if (diffHours > 0) {
      return `${diffHours} godz. temu`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min temu`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Powiadomienia CalcReno</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Powiadomienia CalcReno</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Powiadomienia CalcReno</span>
            <Badge variant="secondary">{notifications.length}</Badge>
          </div>
          {!projectId && (
            <span className="text-sm text-gray-500">Wszystkie projekty</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Brak powiadomień do wyświetlenia</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getPriorityIcon(notification.priority)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatRelativeTime(notification.created_at)}</span>
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {notification.project_name && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{notification.project_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {showActions && notification.data?.suggested_actions && (
                      <div className="ml-7 space-y-2">
                        <p className="text-xs font-medium text-gray-700">Sugerowane akcje:</p>
                        <div className="space-y-1">
                          {notification.data.suggested_actions.map((action, actionIndex) => (
                            <div 
                              key={actionIndex}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                            >
                              <span>{action.description}</span>
                              {action.calcreno_url && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    console.log('Would open CalcReno URL:', action.calcreno_url);
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  CalcReno
                                </Button>
                              )}
                              {action.renotimeline_url && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    console.log('Would navigate to:', action.renotimeline_url);
                                  }}
                                >
                                  <ArrowRight className="w-3 h-3 mr-1" />
                                  Szczegóły
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {notification.data?.correlation_data && (
                      <div className="ml-7">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Dane korelacji
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(notification.data.correlation_data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  {index < notifications.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}; 