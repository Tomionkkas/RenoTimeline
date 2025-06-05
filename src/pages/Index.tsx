
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useDemoMode } from '@/hooks/useDemoMode';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentTasks from '@/components/Dashboard/RecentTasks';
import ProjectsList from '@/components/Projects/ProjectsList';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import DemoModeSelector from '@/components/Demo/DemoModeSelector';
import DemoDashboard from '@/components/Demo/DemoDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, FolderOpen, Kanban, Calendar, Users, Settings } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { isDemoMode, enableDemoMode, disableDemoMode } = useDemoMode();
  const [showAuthFlow, setShowAuthFlow] = useState(false);

  const handleSelectDemo = () => {
    enableDemoMode();
  };

  const handleSelectAuth = () => {
    setShowAuthFlow(true);
  };

  const handleExitDemo = () => {
    disableDemoMode();
    setShowAuthFlow(true);
  };

  // Show demo mode selector if not authenticated and not in demo mode and not showing auth flow
  if (!user && !isDemoMode && !showAuthFlow) {
    return (
      <DemoModeSelector 
        onSelectDemo={handleSelectDemo}
        onSelectAuth={handleSelectAuth}
      />
    );
  }

  // Show demo dashboard if in demo mode
  if (isDemoMode && !user) {
    return <DemoDashboard onExitDemo={handleExitDemo} />;
  }

  // Regular authenticated flow
  return (
    <ProtectedRoute>
      {onboardingLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Sprawdzanie konfiguracji...</p>
          </div>
        </div>
      ) : needsOnboarding ? (
        <OnboardingFlow onComplete={completeOnboarding} />
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Dashboard RenoTimeline
              </h1>
              <p className="text-gray-400">
                Witaj z powrotem, {user?.user_metadata?.first_name || 'Użytkowniku'}! 
                Zarządzaj swoimi projektami remontowymi.
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Projekty</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center space-x-2">
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center space-x-2" disabled>
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalendarz</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center space-x-2" disabled>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Zespół</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2" disabled>
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Ustawienia</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <DashboardStats />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecentTasks />
                  <div className="bg-card rounded-xl border border-gray-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Szybkie akcje</h2>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-300 text-sm">
                          🚀 Twoje aplikacja jest gotowa! Możesz teraz:
                        </p>
                        <ul className="mt-2 space-y-1 text-gray-400 text-sm">
                          <li>• Zarządzać projektami w zakładce "Projekty"</li>
                          <li>• Organizować zadania w tablicy "Kanban"</li>
                          <li>• Śledzić postępy w czasie rzeczywistym</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects">
                <ProjectsList />
              </TabsContent>

              <TabsContent value="kanban">
                <KanbanBoard />
              </TabsContent>

              <TabsContent value="calendar">
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Kalendarz w budowie</h3>
                  <p className="text-gray-400">Ta funkcja będzie dostępna wkrótce</p>
                </div>
              </TabsContent>

              <TabsContent value="team">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Zarządzanie zespołem w budowie</h3>
                  <p className="text-gray-400">Ta funkcja będzie dostępna wkrótce</p>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Ustawienia w budowie</h3>
                  <p className="text-gray-400">Ta funkcja będzie dostępna wkrótce</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default Index;
