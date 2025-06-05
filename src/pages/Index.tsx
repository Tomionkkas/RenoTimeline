
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useDemoMode } from '@/hooks/useDemoMode';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import DemoModeSelector from '@/components/Demo/DemoModeSelector';
import DemoDashboard from '@/components/Demo/DemoDashboard';

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
                Oto przegląd Twoich projektów.
              </p>
            </div>
            
            <DashboardStats />
            
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                To jest początek Twojego dashboardu. Następnie zaimplementujemy:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-gray-300">
                <li>• Listę projektów</li>
                <li>• Tablicę Kanban z zadaniami</li>
                <li>• Kalendarz</li>
                <li>• Zarządzanie zespołem</li>
                <li>• Ustawienia</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default Index;
