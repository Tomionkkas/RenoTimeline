
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from './AuthForm';
import TransitionWrapper from './TransitionWrapper';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user && !showAuth) {
        // Add small delay before showing auth
        setTimeout(() => {
          setShowAuth(true);
        }, 200);
      } else if (user && showAuth) {
        // Smooth transition from auth to app
        setIsTransitioning(true);
        setTimeout(() => {
          setShowAuth(false);
          setIsTransitioning(false);
        }, 300);
      }
    }
  }, [user, loading, showAuth]);

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

  if (showAuth || isTransitioning) {
    return (
      <TransitionWrapper show={showAuth && !isTransitioning}>
        <AuthForm onSuccess={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setShowAuth(false);
            setIsTransitioning(false);
          }, 300);
        }} />
      </TransitionWrapper>
    );
  }

  return (
    <TransitionWrapper show={!!user} delay={100} className="page-transition">
      {children}
    </TransitionWrapper>
  );
};

export default ProtectedRoute;
