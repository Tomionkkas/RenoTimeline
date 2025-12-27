import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, Layout, Settings, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useCalendarManagement } from '@/hooks/useCalendarManagement';
import { useTasks, Task } from '@/hooks/useTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import CalendarMonthView from './CalendarMonthView';
import TimelineView from '@/components/Timeline/TimelineView';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsDialog from '@/components/Tasks/TaskDetailsDialog';
import { toast } from 'sonner';

type CalendarView = 'month' | 'week' | 'day' | 'timeline';

// The CalendarEvent interface is now imported from the hook
// type CalendarView = 'month' | 'week' | 'day' | 'timeline';

const UnifiedCalendarView: React.FC = () => {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<CalendarView>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  // const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // This is now removed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  const { projects, loading: projectsLoading } = useProjects();
  const { tasks } = useTasks();
  // We now get events directly from this hook
  const { events: calendarEvents, loading: eventsLoading, fetchEventsForDateRange } = useCalendarEvents();
  
  const { 
    loading: managementLoading, 
    // createQuickTask, // Assuming these are removed or will be part of a future refactor
    // moveTaskToDate, 
  } = useCalendarManagement();

  // This useEffect is now the single source of truth for fetching events
  useEffect(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    fetchEventsForDateRange(start, end);
  }, [currentDate, fetchEventsForDateRange]);

  // The old useEffect calling getTasksForCalendar is removed.

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Find the task by ID and open the task details dialog
    const task = tasks.find(t => t.id === event.id);
    if (task) {
      setSelectedTask(task);
      setShowTaskDialog(true);
    } else {
      toast.error('Nie można znaleźć zadania');
    }
  };

  const handleEventDoubleClick = (event: CalendarEvent) => {
    // Open task details dialog (same as single click)
    const task = tasks.find(t => t.id === event.id);
    if (task) {
      setSelectedTask(task);
      setShowTaskDialog(true);
    } else {
      toast.error('Nie można znaleźć zadania');
    }
  };

  const handleDayClick = (date: Date) => {
    console.log('Day clicked:', date);
  };

  const handleDayDoubleClick = (date: Date) => {
    setSelectedModalDate(date);
    setShowCreateModal(true);
  };

  const handleEventDrop = async (eventId: string, newDate: string) => {
    // Optimistically update the UI immediately
    const eventToMove = calendarEvents.find(e => e.id === eventId);
    if (eventToMove) {
      const updatedEvents = calendarEvents.map(event => 
        event.id === eventId ? { ...event, date: newDate } : event
      );
      // setCalendarEvents(updatedEvents); // This line is removed
    }

    try {
      // Assuming moveTaskToDate is removed or will be part of a future refactor
      // const result = await moveTaskToDate(eventId, newDate);
      // if (result.success) {
        toast.success('Zadanie zostało przeniesione', { duration: 2000 });
      // } else {
        // Revert optimistic update on failure
        // const tasks = await getTasksForCalendar(
        //   selectedProject === 'all' ? undefined : selectedProject
        // );
        // setCalendarEvents(tasks as CalendarEvent[]);
        // toast.error(result.error || 'Błąd podczas przenoszenia zadania');
      // }
    } catch (error) {
      // Revert optimistic update on error
      // const tasks = await getTasksForCalendar(
      //   selectedProject === 'all' ? undefined : selectedProject
      // );
      // setCalendarEvents(tasks as CalendarEvent[]);
      console.error('Error moving task:', error);
      toast.error('Błąd podczas przenoszenia zadania');
    }
  };

  const handleCreateQuickTask = () => {
    if (selectedProject === 'all') {
      toast.error('Wybierz projekt, aby utworzyć zadanie');
      return;
    }
    
    // Open the new glassmorphic modal instead of using prompt()
    setSelectedModalDate(new Date());
    setShowCreateModal(true);
  };

  // Refresh calendar events when modal is closed
  const handleModalClose = async () => {
    setShowCreateModal(false);
    // Refresh events to show newly created tasks
    try {
      // Assuming getTasksForCalendar is removed or will be part of a future refactor
      // const tasks = await getTasksForCalendar(
      //   selectedProject === 'all' ? undefined : selectedProject
      // );
      // setCalendarEvents(tasks as CalendarEvent[]);
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
    }
  };

  // Helper to convert priority number to string
  const getPriorityString = (priority: number): 'low' | 'medium' | 'high' | 'urgent' => {
    switch (priority) {
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      case 4: return 'urgent';
      default: return 'medium';
    }
  };

  // Transform events to match CalendarMonthView interface and filter by project
  const filteredEvents = useMemo(() => {
    return calendarEvents
      .filter(event =>
        selectedProject === 'all' || event.extendedProps?.projectId === selectedProject
      )
      .map(event => ({
        id: event.id,
        title: event.title,
        date: event.end, // Use end date as the display date
        projectId: event.extendedProps?.projectId || '',
        projectName: event.extendedProps?.projectName || '',
        status: event.extendedProps?.status || 'pending',
        priority: getPriorityString(event.extendedProps?.priority || 2),
        isAllDay: event.allDay,
        startTime: undefined,
        endTime: undefined,
        description: undefined
      }));
  }, [calendarEvents, selectedProject]);

  const statsData = useMemo(() => {
    const total = filteredEvents.length;
    const completed = filteredEvents.filter(e => e.status === 'completed').length;
    const inProgress = filteredEvents.filter(e => e.status === 'in_progress').length;
    const overdue = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate < new Date() && e.status !== 'completed';
    }).length;

    return { total, completed, inProgress, overdue };
  }, [filteredEvents]);

  return (
    <div className="space-y-4 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Kalendarz projektów</h2>
          <p className="text-white/60 text-sm md:text-lg">
            Zintegrowany widok kalendarza i osi czasu
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:gap-6">
        {/* Navigation */}
        <div className="flex items-center justify-between md:justify-start md:space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg h-9 w-9 md:h-10 md:w-auto md:px-4"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h2 className="text-base md:text-xl font-semibold min-w-[160px] md:min-w-[200px] text-center text-white">
            {format(currentDate, isMobile ? 'MMM yyyy' : 'LLLL yyyy', { locale: pl })}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg h-9 w-9 md:h-10 md:w-auto md:px-4"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters and Views */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-white h-10">
              <SelectValue placeholder="Wybierz projekt" />
            </SelectTrigger>
            <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
              <SelectItem value="all" className="text-white/80 hover:text-white hover:bg-white/20">Wszystkie projekty</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id} className="text-white/80 hover:text-white hover:bg-white/20">
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 md:gap-4">
            <Button
              variant="outline"
              onClick={goToToday}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg flex-1 sm:flex-none h-10"
            >
              Dzisiaj
            </Button>

            <Button
              variant="default"
              onClick={handleCreateQuickTask}
              disabled={selectedProject === 'all'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 md:px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex-1 sm:flex-none h-10"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Nowe zadanie</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="p-2 md:p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-white/60">Wszystkie</p>
                <p className="text-lg md:text-2xl font-bold text-white">{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="p-2 md:p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-white/60">Zakończone</p>
                <p className="text-lg md:text-2xl font-bold text-white">{statsData.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="p-2 md:p-3 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-white/60">W trakcie</p>
                <p className="text-lg md:text-2xl font-bold text-white">{statsData.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="p-2 md:p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-red-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-white/60">Przeterminowane</p>
                <p className="text-lg md:text-2xl font-bold text-white">{statsData.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as CalendarView)} className="w-full overflow-x-hidden">
        <div className="flex justify-center mb-4 md:mb-6 overflow-x-auto max-w-full">
          <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg flex-shrink-0">
            <TabsTrigger value="month" className="flex items-center space-x-1 md:space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-2 md:px-4 py-2 flex-1 md:flex-none whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Miesiąc</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center space-x-1 md:space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-2 md:px-4 py-2 flex-1 md:flex-none whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Tydzień</span>
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center space-x-1 md:space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-2 md:px-4 py-2 flex-1 md:flex-none whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Dzień</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-1 md:space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-2 md:px-4 py-2 flex-1 md:flex-none whitespace-nowrap">
              <Layout className="w-4 h-4" />
              <span className="text-xs md:text-sm">Oś czasu</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="month" className="animate-fadeIn">
          <CalendarMonthView
            currentDate={currentDate}
            events={filteredEvents}
            selectedProjectId={selectedProject}
            onEventClick={handleEventClick}
            onEventDoubleClick={handleEventDoubleClick}
            onDayClick={handleDayClick}
            onDayDoubleClick={handleDayDoubleClick}
            onEventDrop={handleEventDrop}
            onCreateQuickTask={handleCreateQuickTask}
          />
        </TabsContent>

        <TabsContent value="week" className="animate-fadeIn">
          <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Layout className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Widok tygodniowy
              </h3>
              <p className="text-white/60 text-lg">
                Funkcjonalność będzie dostępna wkrótce
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="animate-fadeIn">
          <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Layout className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Widok dzienny
              </h3>
              <p className="text-white/60 text-lg">
                Funkcjonalność będzie dostępna wkrótce
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="animate-fadeIn">
          <TimelineView 
            currentDate={currentDate}
            selectedProject={selectedProject}
          />
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={handleModalClose}
        selectedDate={format(selectedModalDate, 'yyyy-MM-dd')}
        projectId={selectedProject === 'all' ? undefined : selectedProject}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        task={selectedTask}
      />
    </div>
  );
};

export default UnifiedCalendarView; 