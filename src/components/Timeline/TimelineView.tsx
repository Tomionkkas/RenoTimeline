import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TimelineViewProps {
  currentDate?: Date;
  selectedProject?: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ 
  currentDate: externalCurrentDate, 
  selectedProject: externalSelectedProject 
}) => {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [internalSelectedProject, setInternalSelectedProject] = useState<string>('all');
  
  // Use external props when available, otherwise use internal state
  const currentDate = externalCurrentDate || internalCurrentDate;
  const selectedProject = externalSelectedProject || internalSelectedProject;
  const { projects } = useProjects();
  const { tasks, loading, error } = useTasks(selectedProject === 'all' ? undefined : selectedProject);

  // Generowanie dni miesiąca
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Grupowanie zadań według daty
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: typeof tasks } = {};
    
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = format(parseISO(task.due_date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  const getTasksForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-red-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'review': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!externalCurrentDate) {
      setInternalCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Błąd: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - tylko gdy TimelineView jest standalone */}
      {!externalCurrentDate && !externalSelectedProject && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Timeline projektów</h1>
            <p className="text-gray-400 mt-2">Wizualizacja terminów i harmonogramów</p>
          </div>
        </div>
      )}

      {/* Kontrolki nawigacji i filtrów - tylko gdy TimelineView jest standalone */}
      {!externalCurrentDate && !externalSelectedProject && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={selectedProject} onValueChange={setInternalSelectedProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Wybierz projekt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie projekty</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setInternalCurrentDate(new Date())}
            >
              Dzisiaj
            </Button>
          </div>
        </div>
      )}

      {/* Kalendarz timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Kalendarz zadań</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Nagłówki dni tygodnia */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Dni miesiąca */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[120px] p-2 border rounded-lg
                    ${isToday ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}
                    hover:border-gray-500 transition-colors
                  `}
                >
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => {
                      const project = projects.find(p => p.id === task.project_id);
                      return (
                        <div
                          key={task.id}
                          className={`
                            text-xs p-1 rounded border-l-2 bg-gray-800/50
                            ${getPriorityColor(task.priority)}
                          `}
                        >
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                            <span className="truncate font-medium">{task.title}</span>
                          </div>
                          {project && (
                            <div className="text-gray-400 truncate">{project.name}</div>
                          )}
                        </div>
                      );
                    })}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{dayTasks.length - 3} więcej
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle>Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Status zadań</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Do zrobienia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">W trakcie</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Do przeglądu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Ukończone</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Priorytety</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-red-500" />
                  <span className="text-sm">Pilne</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-orange-500" />
                  <span className="text-sm">Wysokie</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-yellow-500" />
                  <span className="text-sm">Średnie</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-green-500" />
                  <span className="text-sm">Niskie</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineView;
