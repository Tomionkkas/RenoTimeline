import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';

const ProjectReportsPage = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(selectedProject === 'all' ? undefined : selectedProject);
  const { teamMembers, loading: teamLoading, error: teamError } = useTeam();
  const { toast } = useToast();

  // Debug logging
  console.log('ProjectReportsPage Debug:', {
    projects: projects?.length || 0,
    tasks: tasks?.length || 0,
    teamMembers: teamMembers?.length || 0,
    projectsLoading,
    tasksLoading,
    teamLoading,
    projectsError,
    tasksError,
    teamError
  });

  // Define calculateAverageCompletionTime before useMemo to avoid hoisting issues
  const calculateAverageCompletionTime = (tasks: any[]) => {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.end_date);
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.updated_at);
      return sum + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return Math.round(totalDays / completedTasks.length);
  };

  // Enhanced data calculations
  const reportData = useMemo(() => {
    console.log('Calculating report data with:', {
      tasks: tasks?.length || 0,
      dateRange,
      selectedProject,
      teamMembers: teamMembers?.length || 0
    });

    const filteredTasks = tasks.filter(task => {
      if (dateRange === 'all') return true;
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return new Date(task.created_at) >= cutoffDate;
    });

    console.log('Filtered tasks:', filteredTasks.length);

    // Status distribution
    const allStatusData = [
      { 
        name: 'Do zrobienia', 
        value: filteredTasks.filter(t => t.status === 'pending').length, 
        color: '#64748b',
        percentage: 0
      },
      { 
        name: 'W toku', 
        value: filteredTasks.filter(t => t.status === 'in_progress').length, 
        color: '#3b82f6',
        percentage: 0
      },
      { 
        name: 'Ukończone', 
        value: filteredTasks.filter(t => t.status === 'completed').length, 
        color: '#10b981',
        percentage: 0
      },
      { 
        name: 'Po Terminie', 
        value: filteredTasks.filter(t => t.status === 'blocked').length, 
        color: '#ef4444',
        percentage: 0
      }
    ];

    // Filter out statuses with 0 tasks
    const statusData = allStatusData.filter(item => item.value > 0);

    // Calculate percentages
    const total = statusData.reduce((sum, item) => sum + item.value, 0);
    statusData.forEach(item => {
      item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
    });

    // Priority distribution
    const priorityData = [
      {
        name: 'Niski',
        value: filteredTasks.filter(t => t.priority === 1).length,
        color: '#22c55e'
      },
      {
        name: 'Średni',
        value: filteredTasks.filter(t => t.priority === 2).length,
        color: '#eab308'
      },
      {
        name: 'Wysoki',
        value: filteredTasks.filter(t => t.priority === 3).length,
        color: '#f97316'
      },
      {
        name: 'Pilny',
        value: filteredTasks.filter(t => t.priority === 4).length,
        color: '#ef4444'
      }
    ].filter(item => item.value > 0);

    // Productivity over time (last 30 days)
    const productivityData = [];
    const days = dateRange === 'all' ? 30 : Math.min(parseInt(dateRange), 30);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate.toDateString() === date.toDateString();
      });
      
      const completed = dayTasks.filter(t => t.status === 'completed').length;
      const total = dayTasks.length;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      productivityData.push({
        date: format(date, 'dd/MM'),
        productivity,
        completed,
        total
      });
    }

    // Team performance
    const teamPerformance = teamMembers.map(member => {
      const memberTasks = filteredTasks.filter(task => task.assigned_to === member.id);
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      const total = memberTasks.length;
      const performance = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: member.first_name || member.email,
        completed,
        total,
        performance
      };
    }).filter(member => member.total > 0);

    const result = {
      statusData,
      priorityData,
      productivityData,
      teamPerformance,
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(t => t.status === 'completed').length,
      overdueTasks: filteredTasks.filter(t => {
        if (!t.end_date || t.status === 'completed') return false;
        return new Date(t.end_date) < new Date();
      }).length,
      averageCompletionTime: calculateAverageCompletionTime(filteredTasks)
    };

    console.log('Report data calculated:', result);
    return result;
  }, [tasks, dateRange, selectedProject, teamMembers]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Raport Projektowy', 20, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Projekt: ${selectedProject === 'all' ? 'Wszystkie projekty' : projects.find(p => p.id === selectedProject)?.name}`, 20, 40);
    doc.text(`Okres: ${dateRange === 'all' ? 'Wszystkie' : `Ostatnie ${dateRange} dni`}`, 20, 50);
    doc.text(`Data raportu: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 60);
    
    // Statistics
    doc.setFontSize(14);
    doc.text('Statystyki', 20, 80);
    doc.setFontSize(10);
    doc.text(`Łącznie zadań: ${reportData.totalTasks}`, 20, 90);
    doc.text(`Ukończone: ${reportData.completedTasks}`, 20, 100);
    doc.text(`Przeterminowane: ${reportData.overdueTasks}`, 20, 110);
    doc.text(`Średni czas ukończenia: ${reportData.averageCompletionTime} dni`, 20, 120);
    
    // Team performance table
    if (reportData.teamPerformance.length > 0) {
      doc.setFontSize(14);
      doc.text('Wydajność zespołu', 20, 150);
      
      const tableData = reportData.teamPerformance.map(member => [
        member.name,
        member.completed.toString(),
        member.total.toString(),
        `${member.performance}%`
      ]);
      
      autoTable(doc, {
        head: [['Członek zespołu', 'Ukończone', 'Łącznie', 'Wydajność']],
        body: tableData,
        startY: 160,
        theme: 'grid'
      });
    }
    
    doc.save(`raport-projektowy-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({
      title: 'Raport wyeksportowany',
      description: 'PDF został pobrany pomyślnie.',
    });
  };

  // Show loading state
  if (projectsLoading || tasksLoading || teamLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" style={{ animationDelay: '-1s' }}></div>
            </div>
            <p className="text-white/60 text-lg">Ładowanie raportów...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (projectsError || tasksError || teamError) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Błąd ładowania danych</h3>
            <p className="text-white/60 max-w-md">
              {projectsError?.message || tasksError?.message || teamError?.message || 'Wystąpił nieoczekiwany błąd podczas ładowania raportów.'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Odśwież
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <BarChart3 className="w-16 h-16 text-white/40 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Brak projektów</h3>
            <p className="text-white/60 max-w-md">
              Nie masz jeszcze żadnych projektów. Utwórz pierwszy projekt, aby zobaczyć raporty.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Raporty projektowe</h2>
          <p className="text-white/60 text-lg">Analizuj postęp i wydajność projektów</p>
        </div>
        <Button 
          onClick={handleExportPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Eksportuj PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Okres" />
            </SelectTrigger>
            <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
              <SelectItem value="7" className="text-white/80 hover:text-white hover:bg-white/20">Ostatnie 7 dni</SelectItem>
              <SelectItem value="30" className="text-white/80 hover:text-white hover:bg-white/20">Ostatnie 30 dni</SelectItem>
              <SelectItem value="90" className="text-white/80 hover:text-white hover:bg-white/20">Ostatnie 90 dni</SelectItem>
              <SelectItem value="all" className="text-white/80 hover:text-white hover:bg-white/20">Wszystkie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Łącznie zadań</p>
                <p className="text-2xl font-bold text-white">{reportData.totalTasks}</p>
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
                <p className="text-sm text-white/60">Ukończone</p>
                <p className="text-2xl font-bold text-white">{reportData.completedTasks}</p>
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
                <p className="text-2xl font-bold text-white">{reportData.overdueTasks}</p>
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
                <p className="text-sm text-white/60">Średni czas (dni)</p>
                <p className="text-2xl font-bold text-white">{reportData.averageCompletionTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <BarChart3 className="w-4 h-4" />
              <span>Przegląd</span>
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <TrendingUp className="w-4 h-4" />
              <span>Wydajność</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Users className="w-4 h-4" />
              <span>Zespół</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Rozkład statusów</CardTitle>
                <CardDescription className="text-white/60">Podział zadań według statusu</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                      >
                        {reportData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-white/60">
                    Brak danych do wyświetlenia
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Rozkład priorytetów</CardTitle>
                <CardDescription className="text-white/60">Podział zadań według priorytetu</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-white/60">
                    Brak danych do wyświetlenia
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="animate-fadeIn">
          <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Wydajność w czasie</CardTitle>
              <CardDescription className="text-white/60">Trend wydajności w ostatnim okresie</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.productivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.productivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="#3b82f6" 
                      fill="rgba(59, 130, 246, 0.3)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-white/60">
                  Brak danych do wyświetlenia
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="animate-fadeIn">
          <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Wydajność zespołu</CardTitle>
              <CardDescription className="text-white/60">Porównanie wydajności członków zespołu</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.teamPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="performance" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-white/60">
                  Brak danych do wyświetlenia
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectReportsPage;
