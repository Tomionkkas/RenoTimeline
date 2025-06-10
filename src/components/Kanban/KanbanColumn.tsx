import { useDrop } from 'react-dnd';
import { Task } from '@/hooks/useTasks';
import { DraggableTask, ItemTypes } from './DraggableTask';
import { MoreHorizontal } from 'lucide-react';

interface KanbanColumnProps {
  status: string;
  title: string;
  tasks: Task[];
  onDrop: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
}

const statusTitleMap: { [key: string]: string } = {
  todo: 'Do zrobienia',
  in_progress: 'W toku',
  review: 'Do przeglądu',
  done: 'Ukończone'
};

const statusColorMap: { [key: string]: string } = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-400',
  review: 'bg-yellow-400',
  done: 'bg-green-400'
};

export function KanbanColumn({ status, tasks, onDrop, onTaskClick }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const title = statusTitleMap[status] || 'Nieznany';
  const color = statusColorMap[status] || 'bg-gray-500';

  return (
    <div
      ref={drop}
      className={`bg-card rounded-xl border-gray-800 p-4 animate-fade-in transition-colors ${isOver ? 'bg-gray-800/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-gray-700 rounded">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
} 