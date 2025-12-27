import React, { useEffect, useState } from 'react';
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

import ProjectReportsPage from '@/components/Reports/ProjectReportsPage';
import TimelineView from '@/components/Timeline/TimelineView';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import FileManager from '@/components/Files/FileManager';
import UnifiedCalendarView from '@/components/Calendar/UnifiedCalendarView';
import SettingsPanel from '@/components/Settings/SettingsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FolderOpen,
  Kanban,
  Users,
  LogOut,
  BarChart3,
  Bell,
  Folder,
  Calendar,
  Settings,
  Search,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GlobalSearch from '@/components/ui/GlobalSearch';
import { useTasks } from '@/hooks/useTasks';
import TaskDetailsDialog from '@/components/Tasks/TaskDetailsDialog';
import { Toaster } from 'react-hot-toast';
import { useDashboardDispatch, useDashboardState } from '@/contexts/DashboardContext';
import EditProjectDialog from '@/components/Projects/EditProjectDialog';
import PageTransition from '@/components/ui/PageTransition';
import { usePageTransition } from '@/hooks/usePageTransition';

import { GreetingHeader } from '@/components/Dashboard/GreetingHeader';
import { FocusCard } from '@/components/Dashboard/FocusCard';
import { CommandCenter } from '@/components/CommandCenter/CommandCenter';
import { FeedbackFeed } from '@/components/Feedback/FeedbackFeed';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/ui/mobile-bottom-nav';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [platformKey, setPlatformKey] = useState('Ctrl');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
                    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      setPlatformKey(isMac ? '⌘' : 'Ctrl');
    }
  }, []);
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { isTransitioning, triggerTransition } = usePageTransition();

  
  const state = useDashboardState();
  const dispatch = useDashboardDispatch();
  const { activeTab, selectedTask, editingProject } = state;

  // Handle tab changes - no transitions
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      // Regular tab change without transition
      dispatch({ type: 'SET_TAB', tab: newTab });
    }
  };

  // Trigger transition on page refresh/load
  useEffect(() => {
    // Check if this is a page refresh (no previous tab state)
    if (!activeTab || activeTab === 'dashboard') {
      triggerTransition(() => {
        // Transition completed, no additional action needed
      });
    }
  }, []); // Only run on mount

  useEffect(() => {
    const { tab, itemId, action } = location.state || {};
    
    if (action === 'create-task') {
      dispatch({ type: 'CREATE_TASK' });
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (action === 'create-project') {
      dispatch({ type: 'CREATE_PROJECT' });
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

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
  }, [location.state, navigate, dispatch, tasks]);

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
    try {
      await signOut();
      toast({
        title: 'Wylogowano pomyślnie',
        description: 'Do zobaczenia!',
      });
      
      // Navigate using React Router instead of window reload
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, still redirect and clear state
      toast({
        title: 'Wylogowano',
        description: 'Sesja została wyczyszczona',
      });
      
      navigate('/', { replace: true });
    }
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-pink-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-1s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">Sprawdzanie konfiguracji...</p>
            <p className="text-white/60">Przygotowujemy Twoje środowisko pracy</p>
          </div>
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
    <PageTransition isActive={isTransitioning}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden max-w-full">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse-slow"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce-slow"></div>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 md:h-16">
              {/* Logo and Search */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <img src="/renotimeline-logo.png" alt="RenoTimeline Logo" className="h-8 w-auto" />
                  <h1 className="hidden md:block text-xl font-bold gradient-text-animated">RenoTimeline</h1>
                </div>
                <div className="hidden md:block">
                  <Button
                    variant="outline"
                    className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-white/70 bg-white/10 border-white/10 hover:bg-white/20 hover:text-white"
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                  >
                    <Search className="h-4 w-4 xl:mr-2" />
                    <span className="hidden xl:inline-flex">Search...</span>
                    <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex text-white/50 border-white/20 bg-black/20">
                      <span className="text-xs">{platformKey}</span>K
                    </kbd>
                  </Button>
                </div>
                {/* Mobile Search Icon */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2 md:space-x-4">
                <span className="hidden md:inline text-white/80 text-sm">Witaj, {user?.user_metadata?.first_name || 'Użytkowniku'}!</span>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size={isMobile ? "icon" : "sm"}
                  className={`text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''}`}
                  title="Wyloguj"
                >
                  <LogOut className={`w-4 h-4 ${isMobile ? '' : 'mr-2'}`} />
                  <span className="hidden md:inline">Wyloguj</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 w-full overflow-x-hidden ${isMobile ? 'pb-24' : ''}`}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-8 w-full overflow-x-hidden">
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex justify-center mb-8 overflow-x-auto overflow-y-hidden max-w-full px-2">
                <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg flex-shrink-0">
                <TabsTrigger value="dashboard" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Projekty</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <Folder className="w-4 h-4" />
                  <span className="hidden sm:inline">Pliki</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Zadania</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalendarz</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Zespół</span>
                </TabsTrigger>
                 <TabsTrigger value="reports" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Raporty</span>
                </TabsTrigger>
                 <TabsTrigger value="notifications" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Powiadomienia</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Opinie</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2 tab-transition bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Ustawienia</span>
                </TabsTrigger>
              </TabsList>
            </div>
            )}

            <TabsContent value="dashboard" className="space-y-8 animate-fadeIn">
              <GreetingHeader />
              {tasks && tasks.length > 0 && (
                <FocusCard 
                  tasks={tasks} 
                  onTaskClick={(task) => dispatch({ type: 'SELECT_TASK', task })} 
                />
              )}
              <div className="stagger-animation">
                <DashboardStats />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RecentTasks onTaskSelect={(task) => dispatch({ type: 'SELECT_TASK', task })}/>
                  <QuickActions 
                    onCreateTask={() => dispatch({ type: 'CREATE_TASK' })}
                    onCreateProject={() => dispatch({ type: 'CREATE_PROJECT' })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="animate-fadeIn">
              <ProjectsList onEditProject={(project) => dispatch({ type: 'EDIT_PROJECT', project })} />
            </TabsContent>

            <TabsContent value="files" className="animate-fadeIn">
              <FileManager />
            </TabsContent>

            <TabsContent value="kanban" className="animate-fadeIn">
              <KanbanBoard onTaskClick={(task) => dispatch({ type: 'SELECT_TASK', task })} />
            </TabsContent>

            <TabsContent value="calendar" className="animate-fadeIn">
              <UnifiedCalendarView />
            </TabsContent>

            <TabsContent value="team" className="animate-fadeIn">
              <TeamOverview />
            </TabsContent>
            
             <TabsContent value="reports" className="animate-fadeIn">
              <ProjectReportsPage />
            </TabsContent>
            
             <TabsContent value="notifications" className="animate-fadeIn">
              <NotificationCenter />
            </TabsContent>
            
            <TabsContent value="settings" className="animate-fadeIn">
              <SettingsPanel />
            </TabsContent>

            <TabsContent value="feedback" className="animate-fadeIn">
              <FeedbackFeed />
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </PageTransition>
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
    <CommandCenter />

    {/* Mobile Bottom Navigation */}
    {isMobile && (
      <MobileBottomNav
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'projects', label: 'Projekty', icon: FolderOpen },
          { id: 'kanban', label: 'Zadania', icon: Kanban },
          { id: 'calendar', label: 'Kalendarz', icon: Calendar },
        ]}
        moreMenuItems={[
          { id: 'files', label: 'Pliki', icon: Folder },
          { id: 'team', label: 'Zespół', icon: Users },
          { id: 'reports', label: 'Raporty', icon: BarChart3 },
          { id: 'notifications', label: 'Powiadomienia', icon: Bell },
          { id: 'feedback', label: 'Opinie', icon: MessageSquare },
          { id: 'settings', label: 'Ustawienia', icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    )}
    </>
  );
};

export default Dashboard; 