import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentTasks from '@/components/Dashboard/RecentTasks';
import QuickActions from '@/components/Dashboard/QuickActions';
import ProjectsList from '@/components/Projects/ProjectsList';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import TeamOverview from '@/components/Team/TeamOverview';
import SettingsPanel from '@/components/Settings/SettingsPanel';
import ProjectReportsPage from '@/components/Reports/ProjectReportsPage';
import TimelineView from '@/components/Timeline/TimelineView';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import FileManager from '@/components/Files/FileManager';
import UnifiedCalendarView from '@/components/Calendar/UnifiedCalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Kanban, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3, 
  Bell,
  Folder,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GlobalSearch from '@/components/ui/GlobalSearch';
import { useTasks } from '@/hooks/useTasks';
import TaskDetailsDialog from '@/components/Kanban/TaskDetailsDialog';
import { Toaster } from 'react-hot-toast';
import { useDashboardDispatch, useDashboardState } from '@/contexts/DashboardContext';
import EditProjectDialog from '@/components/Projects/EditProjectDialog';
import { useDummyMode } from '@/hooks/useDummyMode';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { isDummyMode } = useDummyMode();
  
  const state = useDashboardState();
  const dispatch = useDashboardDispatch();
  const { activeTab, selectedTask, editingProject } = state;

  useEffect(() => {
    const { tab, itemId } = location.state || {};
    if (tab) {
      dispatch({ type: 'SET_TAB', tab });
      if (tab === 'kanban' && itemId && tasks.length > 0) {
        const taskToOpen = tasks.find(t => t.id === itemId);
        if (taskToOpen) {
          dispatch({ type: 'SELECT_TASK', task: taskToOpen });
          navigate(location.pathname, { replace: true, state: {} });
        }
      } else if (itemId) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate, dispatch]);

  // Separate effect to handle task selection when tasks are loaded
  useEffect(() => {
    const { tab, itemId } = location.state || {};
    if (tab === 'kanban' && itemId && tasks.length > 0 && activeTab === 'kanban') {
      const taskToOpen = tasks.find(t => t.id === itemId);
      if (taskToOpen) {
        dispatch({ type: 'SELECT_TASK', task: taskToOpen });
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [tasks, location.state, activeTab, navigate, dispatch]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Wylogowano pomyślnie',
      description: 'Do zobaczenia!',
    });
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center natural-fade">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Sprawdzanie konfiguracji...</p>
        </div>
      </div>
    );
  }

  if (user && needsOnboarding) {
    return (
      <div className="natural-fade">
        <OnboardingFlow onComplete={completeOnboarding} />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background page-transition">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold gradient-text">RenoTimeline</h1>
              <GlobalSearch />
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  Witaj, {user?.user_metadata?.first_name || 'Użytkowniku'}!
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="transition-all duration-300 hover:scale-105">
                  <LogOut className="w-4 h-4 mr-2" />
                  Wyloguj
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 smooth-entrance">
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Dashboard RenoTimeline
          </h2>
          <p className="text-gray-400">
            {isDummyMode
              ? 'Jesteś w trybie demo. Dane są przykładowe i nie zostaną zapisane.'
              : 'Zarządzaj swoimi projektami remontowymi.'
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(tab) => dispatch({ type: 'SET_TAB', tab })} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 slide-in-smooth">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 tab-transition">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2 tab-transition">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projekty</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2 tab-transition">
              <Folder className="w-4 h-4" />
              <span className="hidden sm:inline">Pliki</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center space-x-2 tab-transition">
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Zadania</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2 tab-transition">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Kalendarz</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2 tab-transition">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Zespół</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2 tab-transition">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ustawienia</span>
            </TabsTrigger>
             <TabsTrigger value="reports" className="flex items-center space-x-2 tab-transition">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Raporty</span>
            </TabsTrigger>
             <TabsTrigger value="notifications" className="flex items-center space-x-2 tab-transition">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Powiadomienia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 natural-fade">
            <div className="stagger-animation">
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentTasks onTaskSelect={(task) => dispatch({ type: 'SELECT_TASK', task })}/>
                <QuickActions 
                  onCreateTask={() => dispatch({ type: 'CREATE_TASK' })}
                  onCreateProject={() => dispatch({ type: 'CREATE_PROJECT' })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="natural-fade">
            <ProjectsList onEditProject={(project) => dispatch({ type: 'EDIT_PROJECT', project })} />
          </TabsContent>

          <TabsContent value="files" className="natural-fade">
            <FileManager />
          </TabsContent>

          <TabsContent value="kanban" className="natural-fade">
            <KanbanBoard onTaskClick={(task) => dispatch({ type: 'SELECT_TASK', task })} />
          </TabsContent>

          <TabsContent value="calendar" className="natural-fade">
            <UnifiedCalendarView />
          </TabsContent>

          <TabsContent value="team" className="natural-fade">
            <TeamOverview />
          </TabsContent>

          <TabsContent value="settings" className="natural-fade">
            <SettingsPanel />
          </TabsContent>
          
           <TabsContent value="reports" className="natural-fade">
            <ProjectReportsPage />
          </TabsContent>
          
           <TabsContent value="notifications" className="natural-fade">
            <NotificationCenter />
          </TabsContent>

        </Tabs>
      </div>
    </div>
    {selectedTask && (
      <TaskDetailsDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={() => dispatch({ type: 'CLOSE_MODALS' })}
      />
    )}
    {editingProject && (
      <EditProjectDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={() => dispatch({ type: 'CLOSE_MODALS' })}
      />
    )}
    <Toaster position="top-center" reverseOrder={false} />
    </>
  );
};

export default Dashboard; 