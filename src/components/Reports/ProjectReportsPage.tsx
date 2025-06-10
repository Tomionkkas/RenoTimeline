import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProjectReportsPage = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { projects } = useProjects();
  const { tasks, loading, error } = useTasks(selectedProject === 'all' ? undefined : selectedProject);
  const { toast } = useToast();

  // Dane do wykresów
  const statusData = [
    { name: 'Do zrobienia', value: tasks.filter(t => t.status === 'todo').length, color: '#ef4444' },
    { name: 'W trakcie', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Do przeglądu', value: tasks.filter(t => t.status === 'review').length, color: '#3b82f6' },
    { name: 'Ukończone', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' }
  ];

  const priorityData = [
    { name: 'Niska', value: tasks.filter(t => t.priority === 'low').length },
    { name: 'Średnia', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Wysoka', value: tasks.filter(t => t.priority === 'high').length },
    { name: 'Pilna', value: tasks.filter(t => t.priority === 'urgent').length }
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
    if (tasks.length === 0) {
      toast({
        title: 'Brak danych do eksportu',
        description: 'Wybierz projekt z zadaniami, aby wygenerować raport.',
        variant: 'destructive',
      });
      return;
    }

    const csvData = tasks.map(task => ({
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
    try {
      if (tasks.length === 0) {
        toast({
          title: 'Brak danych do eksportu',
          description: 'Wybierz projekt z zadaniami, aby wygenerować raport PDF.',
          variant: 'destructive',
        });
        return;
      }

      const doc = new jsPDF();
      const project = projects.find(p => p.id === selectedProject);
      const title = `Raport Zadań dla: ${project ? project.name : 'Wszystkich Projektów'}`;
      const date = `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`;

      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(date, 14, 30);

      const tableColumn = ["Tytuł", "Status", "Priorytet", "Termin"];
      const tableRows: (string | number | null)[][] = [];

      tasks.forEach(task => {
        const taskData = [
          task.title || 'Brak tytułu',
          task.status || 'Brak statusu',
          task.priority || 'Brak priorytetu',
          task.due_date ? new Date(task.due_date).toLocaleDateString('pl-PL') : 'Brak',
        ];
        tableRows.push(taskData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
      });

      doc.save(`raport_zadan_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Eksport PDF zakończony',
        description: 'Raport został pobrany jako plik PDF',
      });
    } catch (error) {
      console.error("Błąd podczas generowania PDF:", error);
      toast({
        title: 'Błąd eksportu PDF',
        description: 'Nie udało się wygenerować raportu. Sprawdź konsolę, aby uzyskać więcej informacji.',
        variant: 'destructive',
      });
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
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukończone zadania</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tasks.filter(t => t.status === 'done').length}
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
              {tasks.filter(t => t.status === 'in_progress').length}
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
              {tasks.length > 0 
                ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
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
