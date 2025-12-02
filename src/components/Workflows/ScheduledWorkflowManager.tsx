import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Activity,
  TrendingUp,
  Zap,
  Timer
} from 'lucide-react';
import { ScheduledWorkflowManager, ScheduleConfig, DueDateConfig } from '@/lib/workflow/ScheduledWorkflowManager';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ScheduledWorkflowManagerProps {
  projectId: string;
}

const ScheduledWorkflowManagerComponent: React.FC<ScheduledWorkflowManagerProps> = ({
  projectId
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const { workflows, loading } = useWorkflows(projectId);
  const { toast } = useToast();

  // Filter scheduled and due date workflows
  const scheduledWorkflows = workflows.filter(w => w.trigger_type === 'scheduled');
  const dueDateWorkflows = workflows.filter(w => w.trigger_type === 'due_date_approaching');

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    const stats = ScheduledWorkflowManager.getCacheStats();
    setCacheStats(stats);
  };

  const runScheduledWorkflows = async () => {
    try {
      setIsRunning(true);
      await ScheduledWorkflowManager.processScheduledWorkflows();
      setLastRun(new Date());
      updateCacheStats();
      
      toast({
        title: 'Przepływy zaplanowane',
        description: 'Pomyślnie sprawdzono i wykonano zaplanowane przepływy',
      });
    } catch (error) {
      console.error('Error running scheduled workflows:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas wykonywania zaplanowanych przepływów',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runDueDateWorkflows = async () => {
    try {
      setIsRunning(true);
      await ScheduledWorkflowManager.processDueDateWorkflows();
      setLastRun(new Date());
      updateCacheStats();
      
      toast({
        title: 'Przepływy terminów',
        description: 'Pomyślnie sprawdzono zadania z zbliżającymi się terminami',
      });
    } catch (error) {
      console.error('Error running due date workflows:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas sprawdzania terminów zadań',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    ScheduledWorkflowManager.clearCache();
    updateCacheStats();
    toast({
      title: 'Cache wyczyszczony',
      description: 'Cache przepływów został wyczyszczony',
    });
  };

  const getScheduleDescription = (config: ScheduleConfig): string => {
    switch (config.schedule_type) {
      case 'daily':
        return `Codziennie o ${config.schedule_time}`;
      case 'weekly':
        const days = config.days_of_week?.map(d => 
          ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][d]
        ).join(', ');
        return `Co tydzień w ${days} o ${config.schedule_time}`;
      case 'monthly':
        return `Co miesiąc ${config.day_of_month} dnia o ${config.schedule_time}`;
      case 'cron':
        return `Cron: ${config.cron_expression}`;
      default:
        return 'Nieznany harmonogram';
    }
  };

  const getDueDateDescription = (config: DueDateConfig): string => {
    const priority = config.priority_filter?.length 
      ? ` (priorytet: ${config.priority_filter.join(', ')})` 
      : '';
    const timeOfDay = config.time_of_day || '09:00';
    return `${config.days_before} dni przed terminem o ${timeOfDay}${priority}`;
  };

  const getWorkflowStatus = (workflow: any): { status: 'active' | 'inactive' | 'error'; message: string } => {
    if (!workflow.is_active) {
      return { status: 'inactive', message: 'Nieaktywny' };
    }

    if (workflow.trigger_type === 'scheduled') {
      const config: ScheduleConfig = workflow.trigger_config || {};
      if (!config.schedule_type || !config.schedule_time) {
        return { status: 'error', message: 'Nieprawidłowa konfiguracja' };
      }
    }

    if (workflow.trigger_type === 'due_date_approaching') {
      const config: DueDateConfig = workflow.trigger_config || {};
      if (!config.days_before) {
        return { status: 'error', message: 'Brak konfiguracji dni' };
      }
    }

    return { status: 'active', message: 'Aktywny' };
  };

  const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'error'; message: string }> = ({ status, message }) => {
    const variant = status === 'active' 
      ? 'bg-gradient-to-r from-green-600 to-green-500 text-white border-0' 
      : status === 'error' 
      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-0' 
      : 'bg-gradient-to-r from-gray-600 to-gray-500 text-white border-0';
    const icon = status === 'active' ? <CheckCircle className="w-3 h-3" /> : 
                 status === 'error' ? <AlertTriangle className="w-3 h-3" /> : 
                 <Pause className="w-3 h-3" />;
    
    return (
      <Badge className={variant}>
        <div className="flex items-center gap-1">
          {icon}
          {message}
        </div>
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="text-center animate-slideUp">
        <div className="p-6 bg-orange-800/30 rounded-full mb-6 mx-auto w-fit">
          <Clock className="h-16 w-16 text-orange-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
          Zarządzanie Zaplanowanymi Przepływami
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Monitorowanie i testowanie automatyzacji czasowych
        </p>
      </div>

      {/* Enhanced Control Panel */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-orange-800/30 rounded-lg border border-orange-600/30">
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            Panel sterowania
          </CardTitle>
          <CardDescription className="text-gray-300">
            Uruchom testy i zarządzaj systemem automatyzacji
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={runScheduledWorkflows}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Uruchom Zaplanowane
            </Button>
            
            <Button
              onClick={runDueDateWorkflows}
              disabled={isRunning}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
              Sprawdź Terminy
            </Button>
            
            <Button
              onClick={clearCache}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Wyczyść Cache
            </Button>
          </div>

          {/* Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-blue-200 font-semibold">Cache Status</span>
              </div>
              <p className="text-white">{cacheStats.size} wpisów w cache</p>
              <p className="text-blue-300/70 text-sm">{cacheStats.keys.length} kluczy</p>
            </div>
            
            {lastRun && (
              <div className="p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-200 font-semibold">Ostatnie uruchomienie</span>
                </div>
                <p className="text-white">
                  {formatDistanceToNow(lastRun, { addSuffix: true, locale: pl })}
                </p>
              </div>
            )}
            
            <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Timer className="w-5 h-5 text-orange-400" />
                <span className="text-orange-200 font-semibold">Status systemu</span>
              </div>
              <p className="text-white">{isRunning ? 'Uruchomiony' : 'Gotowy'}</p>
              <p className="text-orange-300/70 text-sm">
                {scheduledWorkflows.length + dueDateWorkflows.length} aktywnych przepływów
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      <div className="animate-slideUp" style={{ animationDelay: '200ms' }}>
        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700 p-1">
            <TabsTrigger 
              value="scheduled"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Clock className="w-4 h-4" />
              Przepływy Zaplanowane ({scheduledWorkflows.length})
            </TabsTrigger>
            <TabsTrigger 
              value="due-dates"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Przepływy Terminów ({dueDateWorkflows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-6 mt-6">
            {scheduledWorkflows.length === 0 ? (
              <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl">
                <CardContent className="py-16 text-center">
                  <div className="p-6 bg-orange-800/30 rounded-full mb-6 mx-auto w-fit">
                    <Clock className="h-16 w-16 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Brak zaplanowanych przepływów</h3>
                  <p className="text-gray-300 text-lg">Nie masz jeszcze żadnych przepływów zaplanowanych czasowo</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {scheduledWorkflows.map((workflow, index) => {
                  const config = (workflow.trigger_config as any) || {};
                  const workflowStatus = getWorkflowStatus(workflow);
                  
                  return (
                    <Card 
                      key={workflow.id} 
                      className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl hover:border-gray-500 transition-all duration-300 transform hover:scale-105 animate-slideUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-orange-800/30 rounded-lg border border-orange-600/30">
                                <Clock className="w-6 h-6 text-orange-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white">{workflow.name}</h3>
                                <p className="text-gray-300">{workflow.description}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-300 text-sm font-semibold">Harmonogram</span>
                                </div>
                                <p className="text-white">{getScheduleDescription(config)}</p>
                              </div>
                              
                              {(workflow as any).last_executed && (
                                <div className="p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Info className="w-4 h-4 text-green-400" />
                                    <span className="text-green-300 text-sm font-semibold">Ostatnie wykonanie</span>
                                  </div>
                                  <p className="text-white">
                                    {formatDistanceToNow(
                                      new Date((workflow as any).last_executed), 
                                      { addSuffix: true, locale: pl }
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-6">
                            <StatusBadge status={workflowStatus.status} message={workflowStatus.message} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="due-dates" className="space-y-6 mt-6">
            {dueDateWorkflows.length === 0 ? (
              <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl">
                <CardContent className="py-16 text-center">
                  <div className="p-6 bg-red-800/30 rounded-full mb-6 mx-auto w-fit">
                    <Calendar className="h-16 w-16 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Brak przepływów dla terminów</h3>
                  <p className="text-gray-300 text-lg">Nie masz jeszcze żadnych przepływów reagujących na terminy zadań</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {dueDateWorkflows.map((workflow, index) => {
                  const config = (workflow.trigger_config as any) || {};
                  const workflowStatus = getWorkflowStatus(workflow);
                  
                  return (
                    <Card 
                      key={workflow.id} 
                      className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl hover:border-gray-500 transition-all duration-300 transform hover:scale-105 animate-slideUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-red-800/30 rounded-lg border border-red-600/30">
                                <Calendar className="w-6 h-6 text-red-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white">{workflow.name}</h3>
                                <p className="text-gray-300">{workflow.description}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="p-3 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-500/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                  <span className="text-red-300 text-sm font-semibold">Konfiguracja terminów</span>
                                </div>
                                <p className="text-white">{getDueDateDescription(config)}</p>
                              </div>
                              
                              {(workflow as any).last_executed && (
                                <div className="p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Info className="w-4 h-4 text-green-400" />
                                    <span className="text-green-300 text-sm font-semibold">Ostatnie wykonanie</span>
                                  </div>
                                  <p className="text-white">
                                    {formatDistanceToNow(
                                      new Date((workflow as any).last_executed), 
                                      { addSuffix: true, locale: pl }
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-6">
                            <StatusBadge status={workflowStatus.status} message={workflowStatus.message} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ScheduledWorkflowManagerComponent; 