import { useDrag } from 'react-dnd';
import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTeam } from '@/hooks/useTeam';

export const ItemTypes = {
  TASK: 'task',
};

interface DraggableTaskProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

const getPriorityInfo = (priority: number): { label: string; styles: { bg: string, text: string, border: string } } => {
  switch (priority) {
    case 1:
      return { label: 'Niski', styles: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' } };
    case 3:
      return { label: 'Wysoki', styles: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' } };
    case 4:
      return { label: 'Pilny', styles: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' } };
    case 2:
    default:
      return { label: 'Średni', styles: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' } };
  }
};

const statusBorderColors: { [key: string]: string } = {
  pending: 'border-l-slate-400',
  in_progress: 'border-l-blue-400',
  completed: 'border-l-emerald-400',
  blocked: 'border-l-red-400',
};

export function DraggableTask({ task, onTaskClick }: DraggableTaskProps) {
  const { teamMembers } = useTeam();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const { label: priorityLabel, styles: priorityStyle } = getPriorityInfo(task.priority);
  const borderColor = statusBorderColors[task.status] || 'border-l-gray-400';

  // Find assigned team member
  const assignedMember = task.assigned_to 
    ? teamMembers?.find(member => member.id === task.assigned_to)
    : null;
  
  const isOverdue = task.end_date && new Date(task.end_date) < new Date();
  const isDueSoon = task.end_date && !isOverdue && 
    new Date(task.end_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

  const formatDueDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM', { locale: pl });
    } catch {
      return dateString;
    }
  };

  const getEstimatedProgress = () => {
    if (!task.estimated_hours || !task.actual_hours) return 0;
    return Math.min((task.actual_hours / task.estimated_hours) * 100, 100);
  };

  const progress = getEstimatedProgress();

  return (
    <div
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`
        group relative p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 
        backdrop-blur-sm rounded-xl border-l-4 ${borderColor}
        border border-gray-700/30 hover:border-gray-600/50
        hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1
        transition-all duration-300 ease-out cursor-pointer
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
        ${task.priority === 4 ? 'ring-1 ring-red-500/20' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm leading-snug line-clamp-2 mb-1">
            {task.name}
          </h4>
          {task.priority === 4 && (
            <div className="flex items-center space-x-1 mb-2">
              <Star className="w-3 h-3 text-red-400 fill-red-400" />
              <span className="text-red-400 text-xs font-medium">Pilne</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Progress bar for estimated hours */}
      {task.estimated_hours && task.actual_hours && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Postęp</span>
            <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-emerald-500' :
                progress >= 75 ? 'bg-blue-500' :
                progress >= 50 ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-2">
        {/* First row: Assignee and Due Date */}
        <div className="flex items-center justify-between">
          {/* Assignee */}
          <div className="flex items-center space-x-1">
            {assignedMember ? (
              <>
                <div 
                  className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm text-white text-xs font-medium" 
                  title={`Przypisano: ${assignedMember.first_name} ${assignedMember.last_name}`}
                >
                  {assignedMember.first_name?.charAt(0)}{assignedMember.last_name?.charAt(0)}
                </div>
                <span className="text-xs text-gray-400 font-medium truncate max-w-[60px]">
                  {assignedMember.first_name}
                </span>
              </>
            ) : task.assigned_to ? (
              <div 
                className="w-5 h-5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-sm" 
                title="Użytkownik nie znaleziony"
              >
                <User className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div 
                className="w-5 h-5 bg-gray-600/50 rounded-full flex items-center justify-center border border-gray-600/30" 
                title="Nie przypisano"
              >
                <User className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>

          {/* Due date */}
          {task.end_date && (
            <div 
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                isOverdue ? 'bg-red-500/10 text-red-400' :
                isDueSoon ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-gray-700/50 text-gray-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDueDate(task.end_date)}</span>
            </div>
          )}
        </div>

        {/* Second row: Time tracking and Priority */}
        <div className="flex items-center justify-between">
          {/* Time tracking */}
          {(task.estimated_hours || task.actual_hours) ? (
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gray-700/50 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                {task.actual_hours || 0}h
                {task.estimated_hours && `/${task.estimated_hours}h`}
              </span>
            </div>
          ) : (
            <div></div> // Empty div to maintain layout
          )}

          {/* Priority Badge */}
          <Badge
            variant="outline"
            className={`text-xs border px-1.5 py-0.5 ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text} font-medium`}
          >
            {priorityLabel}
          </Badge>
        </div>
      </div>

      {/* Bottom indicators */}
      <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-700/30">
        {/* Created date */}
        <span className="text-xs text-gray-500">
          {format(new Date(task.created_at), 'dd.MM', { locale: pl })}
        </span>
      </div>

      {/* Urgent task indicator */}
      {task.priority === 4 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
      )}
    </div>
  );
} 