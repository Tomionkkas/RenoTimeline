import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isActive?: boolean;
  onTransitionComplete?: () => void;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  isActive = false, 
  onTransitionComplete 
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    if (isActive) {
      setIsTransitioning(true);
      setShowContent(false);
      
      // Longer transition duration
      setTimeout(() => {
        setShowContent(true);
        setIsTransitioning(false);
        onTransitionComplete?.();
      }, 600); // Increased from 300ms to 600ms
    }
  }, [isActive, onTransitionComplete]);

  return (
    <div className="relative min-h-screen">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse-slow"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-full blur-3xl animate-bounce-slow"></div>
              </div>
            </div>
          </div>

          {/* Loading spinner */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '-1s' }}></div>
              </div>
              <div className="space-y-3">
                <p className="text-xl font-semibold text-white animate-pulse">Ładowanie...</p>
                <p className="text-white/60 text-base">Przygotowujemy nową stronę</p>
              </div>
            </div>
          </div>

          {/* Animated particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3000}ms`,
                  animationDuration: `${4 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        className={`transition-all duration-500 ease-in-out ${
          showContent 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PageTransition;
