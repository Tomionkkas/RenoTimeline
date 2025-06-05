
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentTasks from '@/components/Dashboard/RecentTasks';
import ProjectsList from '@/components/Projects/ProjectsList';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import TeamOverview from '@/components/Team/TeamOverview';
import CalendarWidget from '@/components/Dashboard/CalendarWidget';
import SettingsPanel from '@/components/Settings/SettingsPanel';
import ProjectReportsPage from '@/components/Reports/ProjectReportsPage';
import TimelineView from '@/components/Timeline/TimelineView';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Kanban, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3, 
  Clock, 
  Bell 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, signOut, exitGuestMode } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { toast } = useToast();

  const isGuestMode = user && 'isGuest' in user;

  const handleSignOut = async () => {
    if (isGuestMode) {
      exitGuestMode();
      toast({
        title: 'Wyszedłeś z trybu gościa',
        description: 'Możesz się zalogować lub kontynuować jako gość',
      });
    } else {
      const { error } = await signOut();
      if (!error) {
        toast({
          title: 'Wylogowano pomyślnie',
          description: 'Do zobaczenia!',
        });
      }
    }
  };

  return (
    <ProtectedRoute>
      {onboardingLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center natural-fade">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Sprawdzanie konfiguracji...</p>
          </div>
        </div>
      ) : needsOnboarding && !isGuestMode ? (
        <div className="natural-fade">
          <OnboardingFlow onComplete={completeOnboarding} />
        </div>
      ) : (
        <div className="min-h-screen bg-background page-transition">
          {/* Header */}
          <div className="border-b border-gray-800 bg-gray-900/50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold gradient-text">RenoTimeline</h1>
                  {isGuestMode && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500 smooth-entrance">
                      Tryb gościa
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    Witaj, {user?.user_metadata?.first_name || 'Użytkowniku'}!
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="transition-all duration-300 hover:scale-105">
                    <LogOut className="w-4 h-4 mr-2" />
                    {isGuestMode ? 'Wyjdź z trybu gościa' : 'Wyloguj'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="mb-8 smooth-entrance">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Dashboard RenoTimeline
              </h2>
              <p className="text-gray-400">
                {isGuestMode 
                  ? 'Testuj funkcje aplikacji. Pamiętaj, że dane nie będą zachowane.'
                  : 'Zarządzaj swoimi projektami remontowymi.'
                }
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-9 slide-in-smooth">
                <TabsTrigger value="dashboard" className="flex items-center space-x-2 tab-transition">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center space-x-2 tab-transition">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Projekty</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center space-x-2 tab-transition">
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center space-x-2 tab-transition">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center space-x-2 tab-transition">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalendarz</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center space-x-2 tab-transition">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Raporty</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2 tab-transition">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Powiadomienia</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center space-x-2 tab-transition">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Zespół</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2 tab-transition">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Ustawienia</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6 natural-fade">
                <div className="stagger-animation">
                  <DashboardStats />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentTasks />
                    <div className="bg-card rounded-xl border border-gray-800 p-6 card-hover">
                      <h2 className="text-xl font-semibold text-white mb-4">Szybkie akcje</h2>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-gray-300 text-sm">
                            🚀 Aplikacja jest w pełni funkcjonalna! Możesz:
                          </p>
                          <ul className="mt-2 space-y-1 text-gray-400 text-sm">
                            <li>• Zarządzać projektami w zakładce "Projekty"</li>
                            <li>• Organizować zadania w tablicy "Kanban"</li>
                            <li>• Śledzić timeline w "Timeline"</li>
                            <li>• Analizować postęp w "Raporty"</li>
                            <li>• Otrzymywać powiadomienia o ważnych terminach</li>
                            <li>• Planować terminy w "Kalendarz"</li>
                            <li>• Współpracować z zespołem</li>
                          </ul>
                        </div>
                        {isGuestMode && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg smooth-entrance">
                            <p className="text-yellow-400 text-sm">
                              💡 Korzystasz z trybu gościa. Aby zachować swoje dane, 
                              <Button variant="link" className="text-yellow-400 p-0 h-auto font-normal transition-all duration-300 hover:scale-105" onClick={handleSignOut}>
                                utwórz konto
                              </Button>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="natural-fade">
                <ProjectsList />
              </TabsContent>

              <TabsContent value="kanban" className="natural-fade">
                <KanbanBoard />
              </TabsContent>

              <TabsContent value="timeline" className="natural-fade">
                <TimelineView />
              </TabsContent>

              <TabsContent value="calendar" className="natural-fade">
                <CalendarWidget />
              </TabsContent>

              <TabsContent value="reports" className="natural-fade">
                <ProjectReportsPage />
              </TabsContent>

              <TabsContent value="notifications" className="natural-fade">
                <NotificationCenter />
              </TabsContent>

              <TabsContent value="team" className="natural-fade">
                <TeamOverview />
              </TabsContent>

              <TabsContent value="settings" className="natural-fade">
                <SettingsPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default Index;
