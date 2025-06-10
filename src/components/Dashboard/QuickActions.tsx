import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Zap, 
  BarChart3, 
  Settings,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';

interface QuickActionsProps {
  onCreateTask?: () => void;
  onCreateProject?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onCreateTask, onCreateProject }) => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  // Calculate quick stats for actions
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status !== 'done';
  }).length;

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    return new Date(task.due_date).toDateString() === today && task.status !== 'done';
  }).length;

  const activeProjects = projects.filter(p => p.status === 'active' || !p.status).length;

  const quickActions = [
    {
      id: 'create-task',
      title: 'Nowe zadanie',
      description: 'Szybko dodaj zadanie do projektu',
      icon: Plus,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-blue-100',
      bgGradient: 'from-blue-900/20 to-blue-800/10',
      borderColor: 'border-blue-500/30',
      action: () => onCreateTask?.(),
      badge: null
    },
    {
      id: 'view-calendar',
      title: 'Kalendarz',
      description: 'Sprawdź harmonogram i terminy',
      icon: Calendar,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      textColor: 'text-purple-100',
      bgGradient: 'from-purple-900/20 to-purple-800/10',
      borderColor: 'border-purple-500/30',
      action: () => navigate('/', { state: { tab: 'calendar' } }),
      badge: todayTasks > 0 ? `${todayTasks} dzisiaj` : null
    },
    {
      id: 'create-project',
      title: 'Nowy projekt',
      description: 'Rozpocznij nowy projekt remontowy',
      icon: Target,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      textColor: 'text-green-100',
      bgGradient: 'from-green-900/20 to-green-800/10',
      borderColor: 'border-green-500/30',
      action: () => onCreateProject?.(),
      badge: null
    },
    {
      id: 'view-reports',
      title: 'Raporty',
      description: 'Analizuj postęp projektów',
      icon: BarChart3,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      textColor: 'text-orange-100',
      bgGradient: 'from-orange-900/20 to-orange-800/10',
      borderColor: 'border-orange-500/30',
      action: () => navigate('/', { state: { tab: 'reports' } }),
      badge: `${activeProjects} aktywne`
    },
    {
      id: 'manage-team',
      title: 'Zespół',
      description: 'Zarządzaj członkami zespołu',
      icon: Users,
      color: 'bg-cyan-600',
      hoverColor: 'hover:bg-cyan-700',
      textColor: 'text-cyan-100',
      bgGradient: 'from-cyan-900/20 to-cyan-800/10',
      borderColor: 'border-cyan-500/30',
      action: () => navigate('/', { state: { tab: 'team' } }),
      badge: null
    },
    {
      id: 'workflows',
      title: 'Automatyzacje',
      description: 'Skonfiguruj przepływy pracy',
      icon: Zap,
      color: 'bg-yellow-600',
      hoverColor: 'hover:bg-yellow-700',
      textColor: 'text-yellow-100',
      bgGradient: 'from-yellow-900/20 to-yellow-800/10',
      borderColor: 'border-yellow-500/30',
      action: () => navigate('/', { state: { tab: 'kanban' } }), // Workflows are in kanban for now
      badge: 'Nowe!'
    }
  ];

  const urgentActions = [
    ...(overdueTasks > 0 ? [{
      id: 'overdue-tasks',
      title: 'Zaległe zadania',
      description: `${overdueTasks} zadań po terminie`,
      icon: Clock,
      urgent: true,
      action: () => navigate('/', { state: { tab: 'kanban' } })
    }] : []),
    ...(todayTasks > 0 ? [{
      id: 'today-tasks',
      title: 'Zadania na dziś',
      description: `${todayTasks} zadań do wykonania`,
      icon: Target,
      urgent: false,
      action: () => navigate('/', { state: { tab: 'calendar' } })
    }] : [])
  ];

  return (
    <Card className="bg-card rounded-xl border border-gray-800 card-hover">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          Szybkie akcje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Actions */}
        {urgentActions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Wymagają uwagi
            </h3>
            {urgentActions.map((action) => (
              <div
                key={action.id}
                onClick={action.action}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  action.urgent 
                    ? 'bg-red-900/20 border border-red-500/30 hover:bg-red-900/30' 
                    : 'bg-yellow-900/20 border border-yellow-500/30 hover:bg-yellow-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      action.urgent ? 'bg-red-600/20' : 'bg-yellow-600/20'
                    }`}>
                      <action.icon className={`w-4 h-4 ${
                        action.urgent ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{action.title}</p>
                      <p className={`text-xs ${
                        action.urgent ? 'text-red-300' : 'text-yellow-300'
                      }`}>{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${
                    action.urgent ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Często używane</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.slice(0, 4).map((action) => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;
              
              return (
                <div
                  key={action.id}
                  onClick={action.action}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-br ${action.bgGradient} border ${action.borderColor} hover:border-opacity-60 transform hover:scale-105`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-lg ${action.color} ${action.hoverColor} transition-colors`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{action.title}</p>
                      <p className="text-gray-400 text-xs">{action.description}</p>
                      {action.badge && (
                        <Badge variant="outline" className="mt-1 text-xs bg-gray-800/50 text-gray-300 border-gray-600">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Więcej opcji</h3>
          <div className="space-y-2">
            {quickActions.slice(4).map((action) => {
              const Icon = action.icon;
              
              return (
                <div
                  key={action.id}
                  onClick={action.action}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r ${action.bgGradient} border ${action.borderColor} hover:border-opacity-60`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{action.title}</p>
                        <p className="text-gray-400 text-xs">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.badge && (
                        <Badge variant="outline" className="text-xs bg-gray-800/50 text-gray-300 border-gray-600">
                          {action.badge}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Link */}
        <div className="pt-2 border-t border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/', { state: { tab: 'settings' } })}
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Ustawienia aplikacji
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions; 