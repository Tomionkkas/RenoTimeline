import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Cog, 
  X, 
  ExternalLink, 
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface WorkflowNotificationsProps {
  notifications: Notification[];
  onViewExecution?: (executionId: string) => void;
  onViewWorkflow?: (workflowId: string) => void;
  onRetryExecution?: (executionId: string) => void;
}

const WorkflowNotifications: React.FC<WorkflowNotificationsProps> = ({
  notifications,
  onViewExecution,
  onViewWorkflow,
  onRetryExecution
}) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const getWorkflowIcon = (type: string, priority: string) => {
    switch (type) {
      case 'workflow_executed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'workflow_failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'automated_action':
        return priority === 'high' 
          ? <AlertTriangle className="w-5 h-5 text-orange-500" />
          : <Cog className="w-5 h-5 text-blue-500" />;
      default:
        return <Cog className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'workflow_executed':
        return 'Przepływ wykonany';
      case 'workflow_failed':
        return 'Błąd przepływu';
      case 'automated_action':
        return 'Akcja automatyczna';
      default:
        return 'Automatyzacja';
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'workflow_executed':
        return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'workflow_failed':
        return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'automated_action':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-300';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatActionMetadata = (metadata: any) => {
    if (!metadata || !metadata.actions) return null;

    return (
      <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs">
        <div className="font-medium text-gray-300 mb-1">Wykonane akcje:</div>
        {metadata.actions.map((action: any, index: number) => (
          <div key={index} className="text-gray-400">
            • {action.type}: {action.description || action.config?.status || 'wykonano'}
          </div>
        ))}
      </div>
    );
  };

  const workflowNotifications = notifications.filter(n => 
    ['workflow_executed', 'workflow_failed', 'automated_action'].includes(n.type)
  );

  if (workflowNotifications.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="py-8 text-center">
          <Cog className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Brak powiadomień o automatyzacjach</p>
          <p className="text-sm text-gray-500 mt-1">
            Powiadomienia o wykonanych przepływach pracy pojawią się tutaj
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {workflowNotifications.map(notification => (
        <Card
          key={notification.id}
          className={`
            ${notification.read ? 'opacity-60' : ''}
            ${getNotificationTypeColor(notification.type)}
            border transition-all duration-200 hover:scale-[1.02]
          `}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getWorkflowIcon(notification.type, notification.priority)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getNotificationTypeColor(notification.type)}`}
                    >
                      {getNotificationTypeLabel(notification.type)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}
                    >
                      {notification.priority}
                    </Badge>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-white mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-300 mb-2">{notification.message}</p>
                  
                  {/* Action metadata */}
                  {notification.type === 'automated_action' && formatActionMetadata(notification.metadata)}
                  
                  {/* Error details for failed workflows */}
                  {notification.type === 'workflow_failed' && notification.metadata?.error && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs">
                      <div className="font-medium text-red-300 mb-1">Szczegóły błędu:</div>
                      <div className="text-red-400">{notification.metadata.error}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: pl 
                        })}
                      </span>
                    </div>
                    
                    {notification.workflow_id && (
                      <div className="text-blue-400">
                        Workflow ID: {notification.workflow_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1 ml-4">
                {/* View workflow execution details */}
                {notification.workflow_execution_id && onViewExecution && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewExecution(notification.workflow_execution_id!)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                
                {/* Retry failed execution */}
                {notification.type === 'workflow_failed' && 
                 notification.workflow_execution_id && 
                 onRetryExecution && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRetryExecution(notification.workflow_execution_id!)}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
                
                {/* View workflow definition */}
                {notification.workflow_id && onViewWorkflow && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewWorkflow(notification.workflow_id!)}
                    className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                  >
                    <Cog className="w-3 h-3" />
                  </Button>
                )}
                
                {/* Mark as read */}
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                )}
                
                {/* Delete notification */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNotification(notification.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorkflowNotifications; 