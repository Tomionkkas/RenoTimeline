import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from './AuthForm';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import DashboardEntrance from './DashboardEntrance';

interface LoginTransitionProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

const LoginTransitionInner: React.FC<LoginTransitionProps> = ({ children, onSuccess }) => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'auth' | 'transitioning' | 'dashboard'>('auth');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Generate particles for transition effect
  useEffect(() => {
    if (transitionPhase === 'transitioning') {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 1000,
      }));
      setParticles(newParticles);
    }
  }, [transitionPhase]);

  // Handle user state changes with enhanced transitions
  useEffect(() => {
    if (user && transitionPhase === 'auth') {
      // Start transition sequence
      setTransitionPhase('transitioning');
      
      // Hide auth form with animation
      setShowAuth(false);
      
      // After auth form fades out, show dashboard
      setTimeout(() => {
        setShowDashboard(true);
        setTransitionPhase('dashboard');
        
        // Call success callback after transition
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      }, 800);
    } else if (!user && transitionPhase !== 'auth') {
      // Reset to auth state
      setTransitionPhase('auth');
      setShowAuth(true);
      setShowDashboard(false);
      setParticles([]);
    }
  }, [user, transitionPhase, onSuccess]);

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
            <p className="text-white/60">Przygotowujemy Twoje środowisko pracy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse-slow"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce-slow"></div>
          </div>
        </div>
      </div>

      {/* Transition Particles */}
      {transitionPhase === 'transitioning' && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}ms`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Auth Form */}
      {showAuth && (
        <div 
          className={`absolute inset-0 z-10 transition-all duration-800 ease-in-out ${
            transitionPhase === 'transitioning' 
              ? 'opacity-0 scale-95 translate-y-4' 
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <AuthForm onSuccess={() => {}} />
        </div>
      )}

      {/* Dashboard Content */}
      {showDashboard && (
        <div className="relative z-20">
          <DashboardEntrance>
            {children}
          </DashboardEntrance>
        </div>
      )}

      {/* Success Animation Overlay */}
      {transitionPhase === 'transitioning' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-white animate-slideUp">Zalogowano pomyślnie!</p>
              <p className="text-white/60 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                Przekierowywanie do dashboardu...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog 
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

const LoginTransition: React.FC<LoginTransitionProps> = ({ children, onSuccess }) => {
  return <LoginTransitionInner children={children} onSuccess={onSuccess} />;
};

export default LoginTransition;
