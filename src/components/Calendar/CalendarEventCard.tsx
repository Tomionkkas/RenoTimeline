import React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Clock, AlertCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarEventCardProps {
  id: string;
  title: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  isCompact?: boolean;
}

const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  id,
  title,
  projectName,
  status,
  priority,
  isAllDay,
  startTime,
  endTime,
  description,
  onClick,
  onDoubleClick,
  className = '',
  isCompact = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'todo':
        return 'bg-gray-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
      case 'done':
        return 'bg-green-500';
      case 'blocked':
        return 'bg-red-500';
      case 'review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string | number) => {
    const priorityStr = typeof priority === 'number'
      ? (priority === 1 ? 'low' : priority === 2 ? 'medium' : priority === 3 ? 'high' : priority === 4 ? 'urgent' : 'medium')
      : priority;

    switch (priorityStr) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-950';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getPriorityIcon = (priority: string | number) => {
    const priorityStr = typeof priority === 'number'
      ? (priority === 1 ? 'low' : priority === 2 ? 'medium' : priority === 3 ? 'high' : priority === 4 ? 'urgent' : 'medium')
      : priority;

    if (priorityStr === 'urgent' || priorityStr === 'high') {
      return <AlertCircle className="w-3 h-3" />;
    }
    return null;
  };

  const formatTimeRange = () => {
    if (isAllDay) return 'Cały dzień';
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    if (startTime) {
      return startTime;
    }
    return '';
  };

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                text-xs p-1 rounded border-l-2 cursor-pointer
                transition-all duration-200 hover:shadow-sm
                ${getPriorityColor(priority)}
                ${className}
              `}
              onClick={onClick}
              onDoubleClick={onDoubleClick}
            >
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                  {title}
                </span>
                {getPriorityIcon(priority)}
              </div>
              {!isAllDay && startTime && (
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {formatTimeRange()}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm text-gray-500">{projectName}</div>
              {description && (
                <div className="text-sm">{description}</div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  {status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {priority}
                </Badge>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`
        p-3 rounded-lg border-l-4 cursor-pointer
        transition-all duration-200 hover:shadow-md hover:scale-[1.02]
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        ${getPriorityColor(priority)}
        ${className}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
          <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
            {title}
          </h3>
          {getPriorityIcon(priority)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <User className="w-3 h-3 mr-1" />
          <span className="truncate">{projectName}</span>
        </div>

        {!isAllDay && (startTime || endTime) && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatTimeRange()}</span>
          </div>
        )}

        {isAllDay && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Cały dzień
          </div>
        )}

        {description && (
          <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {description}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {status === 'pending' || status === 'todo' ? 'Do zrobienia' :
             status === 'in_progress' ? 'W trakcie' :
             status === 'completed' || status === 'done' ? 'Zakończone' :
             status === 'blocked' ? 'Zablokowane' :
             status === 'review' ? 'Przegląd' : status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {priority === 'low' || priority === 1 ? 'Niski' :
             priority === 'medium' || priority === 2 ? 'Średni' :
             priority === 'high' || priority === 3 ? 'Wysoki' :
             priority === 'urgent' || priority === 4 ? 'Pilny' : priority}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventCard; 