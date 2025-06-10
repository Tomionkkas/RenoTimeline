import { useDrag } from 'react-dnd';
import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export const ItemTypes = {
  TASK: 'task',
};

interface DraggableTaskProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

const priorityLabels: { [key in Task['priority']]: string } = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
  urgent: 'Pilne',
};

export function DraggableTask({ task, onTaskClick }: DraggableTaskProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`p-3 bg-gray-800 rounded-lg border-l-4 ${
        task.priority === 'urgent' ? 'border-red-600' :
        task.priority === 'high' ? 'border-red-400' :
        task.priority === 'medium' ? 'border-yellow-400' :
        'border-green-400'
      } hover:bg-gray-700 transition-colors cursor-pointer animate-fade-in mb-3`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <h4 className="text-white text-sm font-medium mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.assigned_to ? (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" title="Przypisano">
              <User className="w-3 h-3 text-white" />
            </div>
          ) : (
             <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center" title="Nie przypisano">
              <User className="w-3 h-3 text-gray-400" />
            </div>
          )}
          {task.due_date && (
            <span className="text-xs text-gray-400">
              {new Date(task.due_date).toLocaleDateString('pl-PL')}
            </span>
          )}
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            task.priority === 'urgent' ? 'border-red-400 text-red-400' :
            task.priority === 'high' ? 'border-orange-400 text-orange-400' :
            task.priority === 'medium' ? 'border-yellow-400 text-yellow-400' :
            'border-green-400 text-green-400'
          }`}
        >
          {priorityLabels[task.priority]}
        </Badge>
      </div>
    </div>
  );
} 