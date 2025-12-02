import React from 'react';
import { useDrop } from 'react-dnd';
import { Task } from '@/hooks/useTasks';
import { DraggableTask, ItemTypes } from './DraggableTask';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  status: Task['status'];
  title: string;
  tasks: Task[];
  onDrop: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Task['status']) => void;
  color?: string;
  bgGradient?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const statusTitleMap: { [key: string]: string } = {
  pending: 'Do zrobienia',
  in_progress: 'W toku',
  completed: 'Ukończone',
  blocked: 'Po Terminie'
};

const statusColorMap: { [key: string]: string } = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-400',
  completed: 'bg-green-400',
  blocked: 'bg-red-400'
};

const emptyStateMessages: { [key: string]: string } = {
  pending: 'Brak nowych zadań',
  in_progress: 'Nic się nie dzieje',
  completed: 'Jeszcze nic nie ukończono',
  blocked: 'Brak zadań po terminie'
};

export function KanbanColumn({ 
  status, 
  tasks, 
  onDrop, 
  onTaskClick, 
  onAddTask,
  color = 'text-gray-300',
  bgGradient = 'from-gray-500/20 to-gray-600/20',
  icon: IconComponent
}: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const title = statusTitleMap[status] || 'Nieznany';
  const fallbackColor = statusColorMap[status] || 'bg-gray-500';

  const getProgressPercentage = () => {
    if (tasks.length === 0) return 0;
    return Math.min((tasks.length / 10) * 100, 100); // Assume max 10 tasks for full progress
  };

  return (
    <div
      ref={drop}
      className={`
        relative overflow-hidden rounded-2xl border border-gray-700/30 
        bg-gradient-to-b ${bgGradient} backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isOver ? 'border-blue-400/50 bg-blue-500/10 scale-[1.02] shadow-2xl shadow-blue-500/20' : 'hover:border-gray-600/50'}
        min-h-[600px] flex flex-col
      `}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50">
        <div 
          className={`h-full bg-gradient-to-r ${bgGradient.replace('/20', '/60')} transition-all duration-500`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Column Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${color}`}>
              {IconComponent && <IconComponent className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${color}`}>{title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full bg-gray-700/50 ${color}`}>
                  {tasks.length} {tasks.length === 1 ? 'zadanie' : 'zadań'}
                </span>
                {tasks.length > 0 && (
                  <div className={`w-2 h-2 rounded-full ${fallbackColor.replace('bg-', 'bg-')} animate-pulse`} />
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700/50">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* Quick Add Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-gray-600/50 text-gray-400 hover:bg-gray-700/50 hover:border-gray-500/50 hover:text-gray-300"
          onClick={() => onAddTask(status)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj zadanie
        </Button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 px-6 pb-6 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className={`mb-3 opacity-50 ${color}`}>
              {IconComponent && <IconComponent className="w-12 h-12" />}
            </div>
            <p className="text-gray-400 text-sm mb-2">{emptyStateMessages[status]}</p>
            <p className="text-gray-500 text-xs">Przeciągnij zadanie tutaj lub dodaj nowe</p>
          </div>
        ) : (
          /* Tasks List */
          tasks.map((task, index) => (
            <div 
              key={task.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <DraggableTask task={task} onTaskClick={onTaskClick} />
            </div>
          ))
        )}
      </div>

      {/* Drop Zone Indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400/50 border-dashed rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-400/30">
            <p className="text-blue-300 font-medium">Upuść zadanie tutaj</p>
          </div>
        </div>
      )}
    </div>
  );
} 