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
  Target,
  AlertTriangle
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
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      borderColor: 'border-blue-500/30',
      action: () => onCreateTask?.(),
      badge: null
    },
    {
      id: 'view-calendar',
      title: 'Kalendarz',
      description: 'Sprawdź harmonogram i terminy',
      icon: Calendar,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      borderColor: 'border-purple-500/30',
      action: () => navigate('/', { state: { tab: 'calendar' } }),
      badge: todayTasks > 0 ? `${todayTasks} dzisiaj` : null
    },
    {
      id: 'create-project',
      title: 'Nowy projekt',
      description: 'Rozpocznij nowy projekt remontowy',
      icon: Target,
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      borderColor: 'border-emerald-500/30',
      action: () => onCreateProject?.(),
      badge: null
    },
    {
      id: 'view-reports',
      title: 'Raporty',
      description: 'Analizuj postęp projektów',
      icon: BarChart3,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      borderColor: 'border-amber-500/30',
      action: () => navigate('/', { state: { tab: 'reports' } }),
      badge: `${activeProjects} aktywne`
    },
    {
      id: 'manage-team',
      title: 'Zespół',
      description: 'Zarządzaj członkami zespołu',
      icon: Users,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600',
      borderColor: 'border-cyan-500/30',
      action: () => navigate('/', { state: { tab: 'team' } }),
      badge: null
    },
    {
      id: 'workflows',
      title: 'Automatyzacje',
      description: 'Skonfiguruj przepływy pracy',
      icon: Zap,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      borderColor: 'border-orange-500/30',
      action: () => navigate('/', { state: { tab: 'kanban' } }), // Workflows are in kanban for now
      badge: 'Nowe!'
    }
  ];

  const urgentActions = [
    ...(overdueTasks > 0 ? [{
      id: 'overdue-tasks',
      title: 'Zaległe zadania',
      description: `${overdueTasks} zadań po terminie`,
      icon: AlertTriangle,
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
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          Szybkie akcje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Urgent Actions */}
        {urgentActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              Wymagają uwagi
            </h3>
            {urgentActions.map((action) => (
              <div
                key={action.id}
                onClick={action.action}
                className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-sm border ${
                  action.urgent 
                    ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20 animate-pulse-slow' 
                    : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20'
                } hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg backdrop-blur-sm ${
                      action.urgent ? 'bg-red-500/20 border border-red-500/40' : 'bg-amber-500/20 border border-amber-500/40'
                    }`}>
                      <action.icon className={`w-4 h-4 ${
                        action.urgent ? 'text-red-300' : 'text-amber-300'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{action.title}</p>
                      <p className={`text-xs ${
                        action.urgent ? 'text-red-200' : 'text-amber-200'
                      }`}>{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                    action.urgent ? 'text-red-300' : 'text-amber-300'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">Często używane</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.slice(0, 4).map((action) => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;
              
              return (
                <div
                  key={action.id}
                  onClick={action.action}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 hover:scale-105 overflow-hidden`}
                >
                  {/* Subtle background overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-lg ${action.color} ${action.hoverColor} transition-colors`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{action.title}</p>
                      <p className="text-white/80 text-xs mt-1">{action.description}</p>
                      {action.badge && (
                        <Badge className="mt-2 text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm">
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
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">Więcej opcji</h3>
          <div className="space-y-3">
            {quickActions.slice(4).map((action) => {
              const Icon = action.icon;
              
              return (
                <div
                  key={action.id}
                  onClick={action.action}
                  className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color} ${action.hoverColor} transition-colors`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{action.title}</p>
                        <p className="text-white/80 text-xs">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.badge && (
                        <Badge className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          {action.badge}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Link */}
        <div className="pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/', { state: { tab: 'settings' } })}
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
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