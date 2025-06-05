
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import WelcomeStep from './WelcomeStep';
import ProjectSetupStep from './ProjectSetupStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const userName = user?.user_metadata?.first_name || 'Użytkowniku';

  const handleWelcomeNext = () => {
    setCurrentStep(1);
  };

  const handleProjectComplete = () => {
    onComplete();
  };

  const handleProjectSkip = () => {
    onComplete();
  };

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

export default OnboardingFlow;
