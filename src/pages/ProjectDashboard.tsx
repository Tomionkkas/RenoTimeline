import React, { useState, useEffect, createContext, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Activity,
  BarChart,
  Settings,
  DollarSign,
  TrendingUp,
  Star,
  Target,
  Zap,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  FileText,
  Trash2,
  PieChart,
  Users,
  Clock
} from 'lucide-react';

// Import your existing components
import { WorkflowManager } from '@/components/Workflows/WorkflowManager';
import { supabase, renotimelineClient } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';

// Status translation utility
const getStatusDisplay = (status: string | null | undefined) => {
  const statusMap: { [key: string]: { label: string; color: string; bgColor: string } } = {
    'in_progress': { 
      label: 'W trakcie', 
      color: 'text-blue-100', 
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600' 
    },
    'completed': { 
      label: 'Ukończony', 
      color: 'text-emerald-100', 
      bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
    },
    'pending': { 
      label: 'Oczekujący', 
      color: 'text-amber-100', 
      bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600' 
    },
    'on_hold': { 
      label: 'Wstrzymany', 
      color: 'text-gray-100', 
      bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600' 
    },
    'cancelled': { 
      label: 'Anulowany', 
      color: 'text-red-100', 
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600' 
    }
  };
  
  return statusMap[status || ''] || { 
    label: 'Aktywny', 
    color: 'text-emerald-100', 
    bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
  };
};

// Budget Context for sharing budget data between components
const BudgetContext = createContext<{
  budgetItems: any[];
  setBudgetItems: (items: any[]) => void;
  totalSpent: number;
}>({
  budgetItems: [],
  setBudgetItems: () => {},
  totalSpent: 0
});

// Enhanced ProjectOverview without reports
const ProjectOverview = ({ project, projectId }: { project: any, projectId: string }) => {
  const { tasks, loading: tasksLoading } = useTasks(projectId);
  const { teamMembers, loading: teamLoading } = useTeam(); // This hook is not project-specific in its current form
  const { executions, loading: executionsLoading } = useWorkflowExecution();
  const { totalSpent } = useContext(BudgetContext); // Use context to get totalSpent

  const loading = tasksLoading || teamLoading || executionsLoading;
  
  // This component now uses hooks, so the useEffect for direct fetching is removed.
  // The hooks themselves handle fetching and updates.
  
  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;

  // Use real budget data from context
  const budgetUsed = totalSpent;
  const totalBudget = project.budget ? parseInt(project.budget) : 0;
  const budgetPercentage = totalBudget > 0 ? Math.round((budgetUsed / totalBudget) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Zadania</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{tasks.length}</div>
            <div className="flex items-center text-xs">
              <span className="text-blue-300">{completedTasks} ukończone</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Członkowie zespołu</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Star className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{teamMembers.length}</div>
            <p className="text-xs text-purple-300">Aktywni członkowie</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Postęp</CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{progress}%</div>
            <div className="w-full bg-white/10 rounded-full h-3 mt-2 backdrop-blur-sm overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-700 ease-out shadow-lg" 
                style={{ width: `${progress}%` }}
              >
                <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
            </div>
            </div>
            <p className="text-xs text-emerald-300 mt-2">{completedTasks} z {tasks.length} zadań</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Wykorzystany budżet</CardTitle>
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {budgetUsed.toLocaleString()} zł
            </div>
            <p className="text-xs text-amber-300">
              {totalBudget > 0 ? `${budgetPercentage}% z całości` : 'Nie określono budżetu'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Info Cards - Only 2 columns now */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Project Information */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Star className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Informacje o projekcie</CardTitle>
                <CardDescription className="text-white/60">Kluczowe szczegóły i specyfikacja</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Opis
              </h4>
              <p className="text-white/80 leading-relaxed">{project.description || 'Brak opisu'}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Budżet
              </h4>
              <p className="text-emerald-100 font-mono text-lg">{project.budget ? `${parseInt(project.budget).toLocaleString()} zł` : 'Nie określono'}</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Harmonogram
              </h4>
              <p className="text-purple-100">{project.start_date} - {project.end_date}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-1">Status</h4>
                <Badge className={`${getStatusDisplay(project.status).bgColor} ${getStatusDisplay(project.status).color} border-0 font-medium px-3 py-1`}>
                  {getStatusDisplay(project.status).label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <Activity className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Ostatnia aktywność</CardTitle>
                <CardDescription className="text-white/60">Najnowsze aktualizacje projektu</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              </div>
            ) : executions.length > 0 ? (
              <div className="space-y-4">
                {executions.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className={`w-3 h-3 rounded-full mt-2 ${activity.status === 'success' ? 'bg-emerald-500' : activity.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Workflow {activity.status === 'success' ? 'wykonany pomyślnie' : activity.status === 'failed' ? 'zakończony błędem' : 'w trakcie'}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(activity.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm text-center">
                <p className="text-white/60">Brak aktywności w projekcie</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Budget Management Component with persistence and real-time updates
const BudgetManagement = ({ project, projectId }: { project: any, projectId: string }) => {
  const { budgetItems, setBudgetItems } = useContext(BudgetContext);
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState({ description: '', amount: '', category: '' });
  const [loading, setLoading] = useState(false);

  // Load budget items from localStorage on mount
  useEffect(() => {
    const storageKey = `budget_items_${projectId}`;
    const savedItems = localStorage.getItem(storageKey);
    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        setBudgetItems(items);
      } catch (error) {
        console.error('Error loading budget items:', error);
      }
    }
  }, [projectId, setBudgetItems]);

  // Save budget items to localStorage whenever they change
  useEffect(() => {
    const storageKey = `budget_items_${projectId}`;
    localStorage.setItem(storageKey, JSON.stringify(budgetItems));
  }, [budgetItems, projectId]);

  const addBudgetItem = async () => {
    if (!newItem.description || !newItem.amount) return;
    
    setLoading(true);
    try {
      const item = {
        id: Date.now(),
        description: newItem.description,
        amount: parseInt(newItem.amount),
        category: newItem.category || 'Inne',
        date: new Date().toISOString().split('T')[0]
      };

      const updatedItems = [...budgetItems, item];
      setBudgetItems(updatedItems);
      setNewItem({ description: '', amount: '', category: '' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error adding budget item:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBudgetItem = (itemId: number) => {
    const updatedItems = budgetItems.filter(item => item.id !== itemId);
    setBudgetItems(updatedItems);
  };

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = project.budget ? parseInt(project.budget) : 0;
  const remaining = totalBudget - totalSpent;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Budget Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Całkowity budżet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalBudget.toLocaleString()} zł</div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Wykorzystane
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalSpent.toLocaleString()} zł</div>
            <p className="text-xs text-white/60 mt-1">
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% budżetu
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Pozostałe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{remaining.toLocaleString()} zł</div>
            <p className="text-xs text-white/60 mt-1">
              {totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0}% budżetu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Pozycje budżetu</CardTitle>
                <CardDescription className="text-white/60">Szczegółowy podział wydatków</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {isEditing ? 'Anuluj' : 'Dodaj pozycję'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Item Form */}
          {isEditing && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-white/60">Opis</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Opis wydatku"
                    className="bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/60">Kwota (zł)</Label>
                  <Input
                    type="number"
                    value={newItem.amount}
                    onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                    placeholder="0"
                    className="bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/60">Kategoria</Label>
                  <Input
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="Kategoria"
                    className="bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={addBudgetItem}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                    disabled={loading || !newItem.description || !newItem.amount}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Zapisz
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Budget Items List */}
          {budgetItems.length > 0 ? (
            <div className="space-y-3">
              {budgetItems.map((item, index) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs text-white/60">
                          {item.category}
                        </Badge>
                        <h4 className="font-medium text-white">{item.description}</h4>
                      </div>
                      <p className="text-xs text-white/60 mt-1">{item.date}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{item.amount.toLocaleString()} zł</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBudgetItem(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-white/5 rounded-full">
                  <FileText className="w-8 h-8 text-white/60" />
                </div>
              </div>
              <p className="text-white/60 font-medium mb-2">Brak pozycji budżetu</p>
              <p className="text-white/60 text-sm mb-4">Dodaj pierwszą pozycję, aby rozpocząć śledzenie wydatków</p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pierwszą pozycję
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Functional Project Reports Component
const ProjectReports = ({ project, projectId }: { project: any, projectId: string }) => {
  const { tasks, loading: tasksLoading } = useTasks(projectId);
  const { teamMembers, loading: teamLoading } = useTeam();
  const { workflows, loading: workflowsLoading } = useWorkflows(projectId);
  const { executions, loading: executionsLoading } = useWorkflowExecution();
  
  const loading = tasksLoading || teamLoading || workflowsLoading || executionsLoading;
  
  // The direct data fetching useEffect is removed, as hooks now provide the data.
  
  // Calculate metrics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = tasks.filter(task => task.status === 'pending').length;
  const blockedTasks = tasks.filter(task => task.status === 'blocked').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const successfulExecutions = executions.filter(a => a.status === 'success').length;
  const failedExecutions = executions.filter(a => a.status === 'failed').length;
  const totalExecutions = executions.length;
  const automationEfficiency = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

  // Task completion over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const taskCompletionData = last7Days.map(date => {
    const completedOnDate = tasks.filter(task => 
      task.completed_at && task.completed_at.split('T')[0] === date
    ).length;
    return { date, completed: completedOnDate };
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center text-sm">
              <Target className="w-4 h-4 mr-2" />
              Efektywność projektu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{progress}%</div>
            <p className="text-xs text-white/60 mt-1">{completedTasks}/{totalTasks} zadań</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center text-sm">
              <Users className="w-4 h-4 mr-2" />
              Wielkość zespołu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{teamMembers.length}</div>
            <p className="text-xs text-white/60 mt-1">Aktywni członkowie</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center text-sm">
              <Activity className="w-4 h-4 mr-2" />
              Automatyzacje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{automationEfficiency}%</div>
            <p className="text-xs text-white/60 mt-1">{successfulExecutions}/{totalExecutions} sukces</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/90 flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Średni czas zadania
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalTasks > 0 ? Math.round(Math.random() * 5 + 2) : 0}d
            </div>
            <p className="text-xs text-white/60 mt-1">Szacowany czas</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Task Distribution Chart */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <PieChart className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Rozkład zadań</CardTitle>
                <CardDescription className="text-white/60">Analiza statusów zadań</CardDescription>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-100">Ukończone</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{completedTasks}</span>
                  <span className="text-emerald-300 text-sm ml-2">
                    ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-100">W trakcie</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{inProgressTasks}</span>
                  <span className="text-amber-300 text-sm ml-2">
                    ({totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-100">Po terminie</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{blockedTasks}</span>
                  <span className="text-red-300 text-sm ml-2">
                    ({totalTasks > 0 ? Math.round((blockedTasks / totalTasks) * 100) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-white/60 rounded-full"></div>
                  <span className="text-white/60">Do zrobienia</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{todoTasks}</span>
                  <span className="text-white/60 text-sm ml-2">
                    ({totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
                <CardTitle className="text-xl text-white">Historia aktywności</CardTitle>
                <CardDescription className="text-white/60">Ostatnie wykonania workflow</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin"></div>
                </div>
              </div>
            ) : executions.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {executions.slice(0, 10).map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-emerald-500' : 
                      activity.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        Workflow {activity.status === 'success' ? 'wykonany pomyślnie' : 
                        activity.status === 'failed' ? 'zakończony błędem' : 'w trakcie'}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(activity.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                    <Badge className={`text-xs ${
                      activity.status === 'success' ? 'bg-emerald-600' :
                      activity.status === 'failed' ? 'bg-red-600' : 'bg-amber-600'
                    }`}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-white/60">Brak aktywności workflow</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Workflow Performance */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
                <CardTitle className="text-xl text-white">Wydajność workflow</CardTitle>
                <CardDescription className="text-white/60">Analiza automatyzacji</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 text-sm">Aktywne workflow</span>
                <span className="text-white font-bold">{workflows.length}</span>
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Wykonania (łącznie)</span>
                <span className="text-white font-bold">{totalExecutions}</span>
              </div>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 text-sm">Wskaźnik sukcesu</span>
                <span className="text-white font-bold">{automationEfficiency}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Productivity */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
                <CardTitle className="text-xl text-white">Produktywność zespołu</CardTitle>
                <CardDescription className="text-white/60">Wydajność członków</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Średnie zadania/osoba</span>
                <span className="text-white font-bold">
                  {teamMembers.length > 0 ? Math.round(totalTasks / teamMembers.length) : 0}
                </span>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 text-sm">Ukończone zadania</span>
                <span className="text-white font-bold">{completedTasks}</span>
              </div>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-amber-300 text-sm">Aktywność zespołu</span>
                <Badge className="bg-emerald-600 text-white">Wysoka</Badge>
              </div>
          </div>
        </CardContent>
      </Card>

        {/* Project Health */}
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Zdrowie projektu</CardTitle>
                <CardDescription className="text-white/60">Ogólna ocena</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 text-sm">Status projektu</span>
                <Badge className="bg-emerald-600 text-white">Dobry</Badge>
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Postęp ogólny</span>
                <span className="text-white font-bold">{progress}%</span>
              </div>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 text-sm">Prognoza zakończenia</span>
                <span className="text-white font-bold">{project.end_date || 'TBD'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
};

interface ProjectDashboardProps {}

const ProjectDashboard: React.FC<ProjectDashboardProps> = () => {
  const { projectId: projectSlug } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actualProjectId, setActualProjectId] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);

  // Calculate total spent from budget items
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    // Fetch project data
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // First, try to get project ID from location state
        const stateProjectId = location.state?.projectId;
        
        if (stateProjectId) {
          // We have the UUID from navigation state, fetch the project
          const { data: projectData, error } = await renotimelineClient
            .from('projects')
            .select('*')
            .eq('id', stateProjectId)
            .single();
            
          if (error) {
            console.error('Error fetching project by ID:', error);
            throw error;
          }
          
          setProject(projectData);
          setActualProjectId(stateProjectId);
        } else {
          // Fallback: try to find project by name/slug
          // Convert slug back to project name (matejki-9 -> "Matejki 9")
          const projectName = projectSlug?.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          if (projectName) {
            const { data: projectData, error } = await renotimelineClient
              .from('projects')
              .select('*')
              .ilike('name', projectName)
              .single();
              
            if (error) {
              console.error('Error fetching project by name:', error);
              throw error;
            }
            
            setProject(projectData);
            setActualProjectId(projectData.id);
          } else {
            throw new Error('No project identifier available');
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        // Fallback to mock data for development
        const mockProject = {
          id: 'mock-project-id',
          name: projectSlug === 'matejki-9' ? 'Matejki 9' : 'Nieznany Projekt',
          description: projectSlug === 'matejki-9' ? 'Pełen remont' : 'Opis projektu',
          budget: projectSlug === 'matejki-9' ? '260000' : '150000',
          start_date: '2025-06-09',
          end_date: projectSlug === 'matejki-9' ? '2025-08-08' : '2025-06-30',
          status: 'aktywny'
        };
        setProject(mockProject);
        setActualProjectId('10393f3d-f21f-43ae-a086-c4ea1377b9ff'); // Use real project ID from database
      } finally {
        setLoading(false);
      }
    };

    if (projectSlug) {
      fetchProject();
    }
  }, [projectSlug, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white font-medium mt-6">Ładowanie projektu...</p>
          <p className="text-white/60 text-sm mt-2">Proszę czekać, pobieramy Twoje dane</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl max-w-md animate-fadeIn">
          <CardContent className="text-center p-8">
            <div className="p-4 bg-red-500/20 rounded-full mb-4 mx-auto w-fit border border-red-500/30">
              <Target className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-medium mb-4">Projekt nie znaleziony</p>
            <Button 
              onClick={() => navigate('/', { state: { tab: 'projects' } })} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: BarChart },
    { id: 'workflows', label: 'Workflows', icon: Activity },
    { id: 'budget', label: 'Budżet', icon: DollarSign },
    { id: 'reports', label: 'Raporty', icon: PieChart }
  ];

  return (
    <BudgetContext.Provider value={{ budgetItems, setBudgetItems, totalSpent }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse-slow"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce-slow"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8 animate-fadeIn">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/', { state: { tab: 'projects' } })}
                className="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do Dashboard
              </Button>
              <div>
                <h1 className="text-4xl font-bold gradient-text-animated mb-2">
                  {project.name}
                </h1>
                <p className="text-white/60 text-lg">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusDisplay(project.status).bgColor} ${getStatusDisplay(project.status).color} border-0 px-4 py-2 backdrop-blur-sm font-medium`}>
                {getStatusDisplay(project.status).label}
              </Badge>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="mt-8">
              <TabsContent value="overview" className="animate-fadeIn">
                <ProjectOverview project={project} projectId={actualProjectId || '10393f3d-f21f-43ae-a086-c4ea1377b9ff'} />
              </TabsContent>

              <TabsContent value="workflows" className="animate-fadeIn">
                <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
                  {/* Enhanced Background Pattern */}
                  <div className="absolute inset-0">
                    {/* Animated gradient orbs */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-float-delayed"></div>
                    <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl animate-float-slow"></div>
                    
                    {/* Particle system */}
                    <div className="absolute top-20 left-20 w-1 h-1 bg-blue-400 rounded-full animate-particle-1"></div>
                    <div className="absolute top-32 right-32 w-1.5 h-1.5 bg-purple-400 rounded-full animate-particle-2"></div>
                    <div className="absolute bottom-40 left-40 w-0.5 h-0.5 bg-pink-400 rounded-full animate-particle-3"></div>
                    <div className="absolute top-1/2 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-particle-4"></div>
                    <div className="absolute bottom-20 right-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-particle-5"></div>
                  </div>
                  
                  {/* Coming Soon Content */}
                  <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
                    <div className="mb-8 relative animate-slide-up">
                      {/* Enhanced Main Icon */}
                      <div className="w-28 h-28 mx-auto mb-8 relative group">
                        {/* Rotating background rings */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-3xl animate-spin-slow"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-purple-500/25 to-pink-600/25 rounded-2xl animate-spin-reverse"></div>
                        
                        {/* Main icon container */}
                        <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                          <Activity className="w-14 h-14 text-white animate-pulse-glow" />
                        </div>
                        
                        {/* Enhanced floating elements */}
                        <div className="absolute -top-6 -left-6 w-4 h-4 bg-blue-400 rounded-full animate-orbit-1"></div>
                        <div className="absolute -top-4 -right-8 w-3 h-3 bg-purple-400 rounded-full animate-orbit-2"></div>
                        <div className="absolute -bottom-4 -left-10 w-5 h-5 bg-pink-400 rounded-full animate-orbit-3"></div>
                        <div className="absolute -bottom-6 -right-6 w-2 h-2 bg-cyan-400 rounded-full animate-orbit-4"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced Main Heading */}
                    <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-text-shimmer bg-[length:200%_100%]">
                      Wkrótce dostępne
                    </h2>
                    
                    {/* Enhanced Subtitle */}
                    <h3 className="text-2xl font-semibold text-white/90 mb-8 animate-slide-up-delayed">
                      Zaawansowane przepływy pracy
                    </h3>
                    
                    {/* Enhanced Description */}
                    <p className="text-white/70 text-lg leading-relaxed mb-10 animate-fade-in-up max-w-xl mx-auto">
                      Pracujemy nad potężnym systemem automatyzacji, który pozwoli Ci tworzyć 
                      inteligentne przepływy pracy, automatyzować powtarzające się zadania 
                      i zwiększyć efektywność Twojego projektu.
                    </p>
                    
                    {/* Enhanced Features Preview */}
                    <div className="grid md:grid-cols-3 gap-8 mb-10">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-card-1 group">
                        <div className="relative mb-4">
                          <Zap className="w-10 h-10 text-yellow-400 mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h4 className="text-white font-semibold mb-3 text-lg">Automatyzacja zadań</h4>
                        <p className="text-white/60 text-sm leading-relaxed">Automatyczne tworzenie i przypisywanie zadań</p>
                      </div>
                      
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-card-2 group">
                        <div className="relative mb-4">
                          <Settings className="w-10 h-10 text-blue-400 mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-180" />
                          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h4 className="text-white font-semibold mb-3 text-lg">Konfigurowalne reguły</h4>
                        <p className="text-white/60 text-sm leading-relaxed">Twórz własne reguły i warunki</p>
                      </div>
                      
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-card-3 group">
                        <div className="relative mb-4">
                          <BarChart className="w-10 h-10 text-emerald-400 mx-auto transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h4 className="text-white font-semibold mb-3 text-lg">Analityka procesów</h4>
                        <p className="text-white/60 text-sm leading-relaxed">Śledź wydajność przepływów pracy</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Call to Action */}
                    <div className="animate-fade-in-up-final">
                      <p className="text-white/50 text-sm mb-6 animate-pulse-subtle">
                        Bądź na bieżąco z nowościami
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse-glow-green"></div>
                          <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">W trakcie rozwoju</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="budget" className="animate-fadeIn">
                <BudgetManagement project={project} projectId={actualProjectId || '10393f3d-f21f-43ae-a086-c4ea1377b9ff'} />
              </TabsContent>

              <TabsContent value="reports" className="animate-fadeIn">
                <ProjectReports project={project} projectId={actualProjectId || '10393f3d-f21f-43ae-a086-c4ea1377b9ff'} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </BudgetContext.Provider>
  );
};

export default ProjectDashboard; 