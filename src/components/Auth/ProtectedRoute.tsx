
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from './AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force re-render when user state changes
    if (!loading) {
      setIsReady(false);
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
