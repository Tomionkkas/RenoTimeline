import React from 'react';
import { ArrowRight, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { differenceInDays } from 'date-fns';

interface FocusCardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const FocusCard = ({ tasks, onTaskClick }: FocusCardProps) => {
  // Find the most important task
  // Logic: High priority (3 or 4) > Overdue or Due Soon > In Progress or Pending
  const focusTask = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'blocked');
    
    return activeTasks.sort((a, b) => {
      // 1. Priority desc
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // 2. Due date asc (null last)
      if (a.end_date && b.end_date) return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      if (a.end_date) return -1;
      if (b.end_date) return 1;
      
      return 0;
    })[0];
  }, [tasks]);

  if (!focusTask) return null;

  const isOverdue = focusTask.end_date && new Date(focusTask.end_date) < new Date();
  const daysLeft = focusTask.end_date ? differenceInDays(new Date(focusTask.end_date), new Date()) : null;

  return (
    <Card className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border-blue-500/30 overflow-hidden relative group">
      <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-400/20">
                Główny priorytet
              </span>
              {isOverdue && (
                <span className="inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-400/20">
                  Po terminie
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
              {focusTask.name}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-2">
              {focusTask.description || 'Brak opisu'}
            </p>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center text-sm text-slate-400 space-x-4">
            {focusTask.end_date && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {isOverdue 
                    ? `Opóźnione o ${Math.abs(daysLeft || 0)} dni`
                    : daysLeft === 0 
                      ? 'Dziś' 
                      : `Za ${daysLeft} dni`
                  }
                </span>
              </div>
            )}
            <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                    focusTask.priority >= 3 ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <span>Priorytet {focusTask.priority}</span>
            </div>
          </div>

          <Button 
            onClick={() => onTaskClick(focusTask)}
            className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20"
          >
            Zobacz szczegóły <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

