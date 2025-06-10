import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, Layout, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendarManagement } from '@/hooks/useCalendarManagement';
import CalendarMonthView from './CalendarMonthView';
import TimelineView from '@/components/Timeline/TimelineView';
import CreateTaskModal from './CreateTaskModal';
import { toast } from 'sonner';

type CalendarView = 'month' | 'week' | 'day' | 'timeline';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
}

const UnifiedCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<CalendarView>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState<Date>(new Date());

  const { projects, loading: projectsLoading } = useProjects();
  const { events, loading: eventsLoading, getEventsForMonth } = useCalendarEvents();
  const { 
    loading: managementLoading, 
    createQuickTask, 
    moveTaskToDate, 
    getTasksForCalendar 
  } = useCalendarManagement();

  // Load calendar events when date or project changes
  useEffect(() => {
    // Wait for projects to load before fetching calendar events
    if (projectsLoading) return;
    
    const loadCalendarEvents = async () => {
      try {
        const tasks = await getTasksForCalendar(
          selectedProject === 'all' ? undefined : selectedProject
        );
        setCalendarEvents(tasks as CalendarEvent[]);
      } catch (error) {
        console.error('Error loading calendar events:', error);
        toast.error('Błąd podczas ładowania wydarzeń kalendarza');
      }
    };

    loadCalendarEvents();
  }, [currentDate, selectedProject, getTasksForCalendar, projectsLoading]);

  // Remove loading states that cause animations during operations
  // const loading = eventsLoading || managementLoading || projectsLoading;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: CalendarEvent) => {
    // TODO: Open task details dialog
    console.log('Event clicked:', event);
    toast.info(`Kliknięto: ${event.title}`);
  };

  const handleEventDoubleClick = (event: CalendarEvent) => {
    // TODO: Open task edit dialog
    console.log('Event double clicked:', event);
    toast.info(`Edytuj: ${event.title}`);
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
      setCalendarEvents(updatedEvents);
    }

    try {
      const result = await moveTaskToDate(eventId, newDate);
      if (result.success) {
        toast.success('Zadanie zostało przeniesione', { duration: 2000 });
      } else {
        // Revert optimistic update on failure
        const tasks = await getTasksForCalendar(
          selectedProject === 'all' ? undefined : selectedProject
        );
        setCalendarEvents(tasks as CalendarEvent[]);
        toast.error(result.error || 'Błąd podczas przenoszenia zadania');
      }
    } catch (error) {
      // Revert optimistic update on error
      const tasks = await getTasksForCalendar(
        selectedProject === 'all' ? undefined : selectedProject
      );
      setCalendarEvents(tasks as CalendarEvent[]);
      console.error('Error moving task:', error);
      toast.error('Błąd podczas przenoszenia zadania');
    }
  };

  const handleCreateTaskFromModal = async (taskData: {
    title: string;
    description: string;
    projectId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    // Create optimistic task immediately
    const tempId = `temp-${Date.now()}`;
    const project = projects.find(p => p.id === taskData.projectId);
    const optimisticTask: CalendarEvent = {
      id: tempId,
      title: taskData.title,
      date: taskData.date,
      projectId: taskData.projectId,
      projectName: project?.name || 'Project',
      status: 'todo',
      priority: taskData.priority,
      isAllDay: taskData.isAllDay,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      description: taskData.description
    };

    setCalendarEvents(prev => [...prev, optimisticTask]);

    try {
      const result = await createQuickTask({
        title: taskData.title,
        date: taskData.date,
        projectId: taskData.projectId,
        isAllDay: taskData.isAllDay,
        time: taskData.startTime
      });

      if (result.success) {
        toast.success('Zadanie zostało utworzone', { duration: 2000 });
        // Replace temp task with real one
        const tasks = await getTasksForCalendar(
          selectedProject === 'all' ? undefined : selectedProject
        );
        setCalendarEvents(tasks as CalendarEvent[]);
      } else {
        // Remove optimistic task on failure
        setCalendarEvents(prev => prev.filter(e => e.id !== tempId));
        toast.error(result.error || 'Błąd podczas tworzenia zadania');
      }
    } catch (error) {
      // Remove optimistic task on error
      setCalendarEvents(prev => prev.filter(e => e.id !== tempId));
      console.error('Error creating task:', error);
      toast.error('Błąd podczas tworzenia zadania');
    }
  };

  const handleCreateQuickTask = async (date: string) => {
    if (selectedProject === 'all') {
      toast.error('Wybierz projekt, aby utworzyć zadanie');
      return;
    }

    const title = prompt('Wprowadź tytuł zadania:');
    if (!title) return;

    // Create optimistic task immediately
    const tempId = `temp-${Date.now()}`;
    const project = projects.find(p => p.id === selectedProject);
    const optimisticTask: CalendarEvent = {
      id: tempId,
      title,
      date,
      projectId: selectedProject,
      projectName: project?.name || 'Project',
      status: 'todo',
      priority: 'medium',
      isAllDay: true
    };

    setCalendarEvents(prev => [...prev, optimisticTask]);

    try {
      const result = await createQuickTask({
        title,
        date,
        projectId: selectedProject,
        isAllDay: true
      });

      if (result.success) {
        toast.success('Zadanie zostało utworzone', { duration: 2000 });
        // Replace temp task with real one
        const tasks = await getTasksForCalendar(
          selectedProject === 'all' ? undefined : selectedProject
        );
        setCalendarEvents(tasks as CalendarEvent[]);
      } else {
        // Remove optimistic task on failure
        setCalendarEvents(prev => prev.filter(e => e.id !== tempId));
        toast.error(result.error || 'Błąd podczas tworzenia zadania');
      }
    } catch (error) {
      // Remove optimistic task on error
      setCalendarEvents(prev => prev.filter(e => e.id !== tempId));
      console.error('Error creating quick task:', error);
      toast.error('Błąd podczas tworzenia zadania');
    }
  };

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(event => 
      selectedProject === 'all' || event.projectId === selectedProject
    );
  }, [calendarEvents, selectedProject]);

  const statsData = useMemo(() => {
    const total = filteredEvents.length;
    const completed = filteredEvents.filter(e => e.status === 'done').length;
    const inProgress = filteredEvents.filter(e => e.status === 'in_progress').length;
    const overdue = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate < new Date() && e.status !== 'done';
    }).length;

    return { total, completed, inProgress, overdue };
  }, [filteredEvents]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Kalendarz projektów</h1>
          <p className="text-gray-400 mt-2">
            Zintegrowany widok kalendarza i osi czasu
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Navigation */}
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

        {/* Filters and Views */}
        <div className="flex items-center space-x-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
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
          
          <Button variant="outline" onClick={goToToday}>
            Dzisiaj
          </Button>

          <Button
            variant="default"
            onClick={() => handleCreateQuickTask(format(new Date(), 'yyyy-MM-dd'))}
            disabled={selectedProject === 'all'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowe zadanie
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm text-gray-500">Wszystkie zadania</p>
                <p className="text-2xl font-bold">{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm text-gray-500">Zakończone</p>
                <p className="text-2xl font-bold">{statsData.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <div>
                <p className="text-sm text-gray-500">W trakcie</p>
                <p className="text-2xl font-bold">{statsData.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <div>
                <p className="text-sm text-gray-500">Przeterminowane</p>
                <p className="text-2xl font-bold">{statsData.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as CalendarView)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Miesiąc</TabsTrigger>
          <TabsTrigger value="week">Tydzień</TabsTrigger>
          <TabsTrigger value="day">Dzień</TabsTrigger>
          <TabsTrigger value="timeline">Oś czasu</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
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

        <TabsContent value="week" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Layout className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Widok tygodniowy
              </h3>
              <p className="text-gray-500">
                Funkcjonalność będzie dostępna wkrótce
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Layout className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Widok dzienny
              </h3>
              <p className="text-gray-500">
                Funkcjonalność będzie dostępna wkrótce
              </p>
            </CardContent>
          </Card>
                  </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView 
            currentDate={currentDate}
            selectedProject={selectedProject}
          />
        </TabsContent>

      </Tabs>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTaskFromModal}
        selectedDate={selectedModalDate}
        projects={projects}
        selectedProjectId={selectedProject === 'all' ? undefined : selectedProject}
      />
    </div>
  );
};

export default UnifiedCalendarView; 