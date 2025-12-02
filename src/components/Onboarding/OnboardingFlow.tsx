
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import WelcomeStep from './WelcomeStep';
import ProjectSetupStep from './ProjectSetupStep';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { user } = useAuth();

  const userName = user?.user_metadata?.first_name || 'Użytkowniku';

  const handleWelcomeNext = async () => {
    setIsTransitioning(true);
    setDirection('forward');
    
    // Wait for exit animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentStep(1);
    setIsTransitioning(false);
  };

  const handleProjectComplete = async () => {
    setIsTransitioning(true);
    setDirection('forward');
    
    // Wait for exit animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onComplete();
  };

  const handleProjectSkip = async () => {
    setIsTransitioning(true);
    setDirection('forward');
    
    // Wait for exit animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onComplete();
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setDirection('backward');
      
      // Wait for exit animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
    }
  };

  const steps = [
    { title: 'Witamy!', description: 'Poznaj możliwości aplikacji' },
    { title: 'Tworzenie projektu', description: 'Stwórz swój pierwszy projekt' }
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep 
            onNext={handleWelcomeNext}
            userName={userName}
          />
        );
      case 1:
        return (
          <ProjectSetupStep 
            onComplete={handleProjectComplete}
            onSkip={handleProjectSkip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Progress indicator */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-6 bg-white/10 backdrop-blur-xl rounded-full px-8 py-4 border border-white/20 shadow-lg">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' 
                  : 'bg-white/30'
              }`} />
              <span className={`text-sm font-medium transition-all duration-500 ${
                index <= currentStep ? 'text-white' : 'text-white/50'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-6 h-0.5 transition-all duration-500 ${
                  index < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/30'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      {currentStep > 0 && (
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 z-20 flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Wstecz</span>
        </button>
      )}

      {/* Main content with transition */}
      <div className={`transition-all duration-500 ease-in-out ${
        isTransitioning 
          ? direction === 'forward' 
            ? 'opacity-0 translate-x-8 scale-95' 
            : 'opacity-0 -translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100'
      }`}>
        {renderCurrentStep()}
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
