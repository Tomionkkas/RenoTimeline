import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginTransition from './LoginTransition';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-pink-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-1s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">Ładowanie...</p>
            <p className="text-white/60">Sprawdzanie sesji...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is already logged in, render children directly
  if (user) {
    return <>{children}</>;
  }

  // If user is not logged in, render LoginTransition
  return (
    <LoginTransition onSuccess={() => {}}>
      {children}
    </LoginTransition>
  );
};

export default ProtectedRoute;
