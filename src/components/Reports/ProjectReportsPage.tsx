
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProjectReportsPage = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { toast } = useToast();

  // Filtracja zadań według wybranego projektu
  const filteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(task => task.project_id === selectedProject);

  // Dane do wykresów
  const statusData = [
    { name: 'Do zrobienia', value: filteredTasks.filter(t => t.status === 'todo').length, color: '#ef4444' },
    { name: 'W trakcie', value: filteredTasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Do przeglądu', value: filteredTasks.filter(t => t.status === 'review').length, color: '#3b82f6' },
    { name: 'Ukończone', value: filteredTasks.filter(t => t.status === 'done').length, color: '#10b981' }
  ];

  const priorityData = [
    { name: 'Niska', value: filteredTasks.filter(t => t.priority === 'low').length },
    { name: 'Średnia', value: filteredTasks.filter(t => t.priority === 'medium').length },
    { name: 'Wysoka', value: filteredTasks.filter(t => t.priority === 'high').length },
    { name: 'Pilna', value: filteredTasks.filter(t => t.priority === 'urgent').length }
  ];

  const projectProgress = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      name: project.name,
      progress: Math.round(progress),
      completed: completedTasks,
      total: totalTasks
    };
  });

  const handleExportCSV = () => {
    const csvData = filteredTasks.map(task => ({
      'Tytuł': task.title,
      'Status': task.status,
      'Priorytet': task.priority,
      'Projekt': projects.find(p => p.id === task.project_id)?.name || 'Nieznany',
      'Termin': task.due_date || 'Brak',
      'Szacowane godziny': task.estimated_hours || 0,
      'Data utworzenia': new Date(task.created_at).toLocaleDateString('pl-PL')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raport_zadania_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Eksport zakończony',
      description: 'Raport został pobrany jako plik CSV',
    });
  };

  const handleExportPDF = () => {
    // Symulacja eksportu PDF
    toast({
      title: 'Eksport PDF',
      description: 'Funkcja eksportu PDF będzie dostępna wkrótce',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Raporty projektów</h1>
          <p className="text-gray-400 mt-2">Analizuj postęp i wydajność swoich projektów</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Eksport CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Eksport PDF
          </Button>
        </div>
      </div>

      {/* Filtr projektów */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Projekt</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statystyki ogólne */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Łączna liczba zadań</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukończone zadania</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {filteredTasks.filter(t => t.status === 'done').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zadania w trakcie</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {filteredTasks.filter(t => t.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procent ukończenia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.length > 0 
                ? Math.round((filteredTasks.filter(t => t.status === 'done').length / filteredTasks.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status zadań</CardTitle>
            <CardDescription>Rozkład zadań według statusu</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priorytety zadań</CardTitle>
            <CardDescription>Liczba zadań według priorytetu</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Postęp projektów */}
      <Card>
        <CardHeader>
          <CardTitle>Postęp projektów</CardTitle>
          <CardDescription>Procent ukończenia dla każdego projektu</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'progress' ? `${value}%` : value,
                  name === 'progress' ? 'Postęp' : name
                ]}
              />
              <Bar dataKey="progress" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectReportsPage;
