import React from 'react';
import { Clock, User, CheckCircle2, Calendar, ArrowRight, Folder } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PriorityKey = 'urgent' | 'high' | 'medium' | 'low';
const priorityKeyMap: Record<number, PriorityKey> = {
  4: 'urgent',
  3: 'high',
  2: 'medium',
  1: 'low',
};
const getPriorityKey = (priority: number): PriorityKey => priorityKeyMap[priority] || 'low';

const priorityColors: Record<PriorityKey, string> = {
  urgent: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const priorityLabels: Record<PriorityKey, string> = {
  urgent: 'Pilny',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski',
};

type StatusKey = 'completed' | 'in_progress' | 'pending' | 'blocked';
const statusColors: Record<StatusKey, string> = {
  completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  in_progress: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  pending: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  blocked: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
};

const statusLabels: Record<StatusKey, string> = {
  completed: 'Ukończone',
  in_progress: 'W toku',
  pending: 'Do zrobienia',
  blocked: 'Zablokowane',
};

interface RecentTasksProps {
  onTaskSelect: (task: Task) => void;
}

const RecentTasks: React.FC<RecentTasksProps> = ({ onTaskSelect }) => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  const loading = tasksLoading || projectsLoading;

  if (loading) {
    return (
      <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Ostatnie zadania</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get last 5 tasks, sorted by creation date
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Nieznany projekt';
  };

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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          Ostatnie zadania
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Brak zadań do wyświetlenia</p>
            <p className="text-sm">Utwórz swoje pierwsze zadanie w tablicy Kanban</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className="group relative p-5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 animate-fade-in cursor-pointer backdrop-blur-sm hover:shadow-md hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Timeline indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Overdue indicator */}
                {isOverdue(task.end_date) && task.status !== 'completed' && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-white font-semibold flex-1 line-clamp-2 pr-4 group-hover:text-blue-300 transition-colors">
                    {task.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                </div>
                
                {task.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`text-xs font-medium px-3 py-1 rounded-md ${priorityColors[getPriorityKey(task.priority)]}`}
                    >
                      {priorityLabels[getPriorityKey(task.priority)]}
                    </Badge>
                    <Badge 
                      className={`text-xs font-medium px-3 py-1 rounded-md ${statusColors[task.status as StatusKey]}`}
                    >
                      {statusLabels[task.status as StatusKey]}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-white/60">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{task.assigned_to ? 'Przypisane' : 'Nieprzypisane'}</span>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span>{getProjectName(task.project_id)}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${isOverdue(task.end_date) && task.status !== 'completed' ? 'text-red-400' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{formatDueDate(task.end_date)}</span>
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
