import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from './AuthForm';
import TransitionWrapper from './TransitionWrapper';
import { useDummyMode } from '@/hooks/useDummyMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isDummyMode } = useDummyMode();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user && !isDummyMode) {
        // Quick delay before showing auth
        setTimeout(() => {
          setShowAuth(true);
        }, 100);
      } else {
        setShowAuth(false);
      }
    }
  }, [user, loading, isDummyMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center natural-fade">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <TransitionWrapper show={true} exitDuration={200}>
        <AuthForm onSuccess={() => setShowAuth(false)} />
      </TransitionWrapper>
    );
  }

  return (
    <TransitionWrapper show={!!user || isDummyMode} delay={50} className="page-transition" exitDuration={200}>
      {children}
    </TransitionWrapper>
  );
};

export default ProtectedRoute;
