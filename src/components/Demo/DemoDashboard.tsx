
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from '@/hooks/useDemoMode';
import { LogOut, Calendar, Users, BarChart3, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DemoDashboardProps {
  onExitDemo: () => void;
}

const DemoDashboard: React.FC<DemoDashboardProps> = ({ onExitDemo }) => {
  const { demoUser, demoProjects, demoTasks } = useDemoMode();

  const completedTasks = demoTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = demoTasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = demoTasks.filter(task => task.status === 'todo').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold gradient-text">RenoTimeline</h1>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                Tryb Demo
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Witaj, {demoUser.user_metadata.first_name}!
              </span>
              <Button variant="outline" size="sm" onClick={onExitDemo}>
                <LogOut className="w-4 h-4 mr-2" />
                Wyjdź z Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projekty</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoProjects.length}</div>
              <p className="text-xs text-muted-foreground">aktywne projekty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ukończone</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">zadania ukończone</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">W trakcie</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{inProgressTasks}</div>
              <p className="text-xs text-muted-foreground">zadania w trakcie</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Do zrobienia</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoTasks}</div>
              <p className="text-xs text-muted-foreground">zadania oczekujące</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Twoje Projekty</CardTitle>
              <CardDescription>
                Przegląd aktywnych projektów remontowych
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoProjects.map((project) => (
                  <div key={project.id} className="p-4 border border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{project.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Budżet: {project.budget.toLocaleString()} zł</span>
                      <span>Do: {new Date(project.end_date).toLocaleDateString('pl-PL')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Ostatnie Zadania</CardTitle>
              <CardDescription>
                Przegląd wszystkich zadań z projektów
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 border border-gray-800 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Info */}
        <Card className="mt-8 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-500">Tryb Demonstracyjny</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              Obecnie korzystasz z trybu demo z przykładowymi danymi. Możesz przeglądać wszystkie funkcje aplikacji, 
              ale zmiany nie będą zapisywane.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={onExitDemo}>
                Przełącz na pełną wersję
              </Button>
              <Button variant="outline" disabled>
                <Calendar className="w-4 h-4 mr-2" />
                Kalendarz (wkrótce)
              </Button>
              <Button variant="outline" disabled>
                <Users className="w-4 h-4 mr-2" />
                Zespół (wkrótce)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoDashboard;
