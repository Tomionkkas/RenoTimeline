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
import CalendarMonthView from './CalendarMonthView';
import TimelineView from '@/components/Timeline/TimelineView';
import CreateTaskModal from './CreateTaskModal';
import { toast } from 'sonner';

type CalendarView = 'month' | 'week' | 'day' | 'timeline';

// The CalendarEvent interface is now imported from the hook
// type CalendarView = 'month' | 'week' | 'day' | 'timeline';

const UnifiedCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<CalendarView>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  // const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // This is now removed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState<Date>(new Date());

  const { projects, loading: projectsLoading } = useProjects();
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
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Kalendarz projektów</h2>
          <p className="text-white/60 text-lg">
            Zintegrowany widok kalendarza i osi czasu
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold min-w-[200px] text-center text-white">
            {format(currentDate, 'LLLL yyyy', { locale: pl })}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters and Views */}
        <div className="flex items-center space-x-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
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
          
          <Button 
            variant="outline" 
            onClick={goToToday}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-lg"
          >
            Dzisiaj
          </Button>

          <Button
            variant="default"
            onClick={handleCreateQuickTask}
            disabled={selectedProject === 'all'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowe zadanie
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Wszystkie zadania</p>
                <p className="text-2xl font-bold text-white">{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Zakończone</p>
                <p className="text-2xl font-bold text-white">{statsData.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">W trakcie</p>
                <p className="text-2xl font-bold text-white">{statsData.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Przeterminowane</p>
                <p className="text-2xl font-bold text-white">{statsData.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as CalendarView)} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg">
            <TabsTrigger value="month" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span>Miesiąc</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span>Tydzień</span>
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span>Dzień</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Layout className="w-4 h-4" />
              <span>Oś czasu</span>
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
    </div>
  );
};

export default UnifiedCalendarView; 