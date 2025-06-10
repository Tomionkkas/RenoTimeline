import React from 'react';
import { Clock, User, CheckCircle2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const priorityColors = {
  urgent: 'bg-red-400/10 text-red-400',
  high: 'bg-red-400/10 text-red-400',
  medium: 'bg-yellow-400/10 text-yellow-400',
  low: 'bg-green-400/10 text-green-400',
};

const priorityLabels = {
  urgent: 'Pilny',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski',
};

const statusColors = {
  done: 'bg-green-400/10 text-green-400',
  in_progress: 'bg-blue-400/10 text-blue-400',
  review: 'bg-yellow-400/10 text-yellow-400',
  todo: 'bg-gray-400/10 text-gray-400',
};

const statusLabels = {
  done: 'Ukończone',
  in_progress: 'W toku',
  review: 'Do przeglądu',
  todo: 'Do zrobienia',
};

interface RecentTasksProps {
  onTaskSelect: (task: any) => void;
}

const RecentTasks: React.FC<RecentTasksProps> = ({ onTaskSelect }) => {
  const { tasks, loading } = useTasks();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie zadania</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get last 5 tasks, sorted by creation date
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'Brak terminu';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Jutro';
    if (diffDays === -1) return 'Wczoraj';
    if (diffDays > 1) return `Za ${diffDays} dni`;
    if (diffDays < -1) return `${Math.abs(diffDays)} dni temu`;
    
    return due.toLocaleDateString('pl-PL');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">Ostatnie zadania</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Brak zadań do wyświetlenia</p>
            <p className="text-sm">Utwórz swoje pierwsze zadanie w tablicy Kanban</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-200 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-medium flex-1 line-clamp-2">{task.title}</h3>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium ${priorityColors[task.priority]}`}
                    >
                      {priorityLabels[task.priority]}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium ${statusColors[task.status]}`}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{task.assigned_to ? 'Przypisane' : 'Nieprzypisane'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDueDate(task.due_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTasks;
