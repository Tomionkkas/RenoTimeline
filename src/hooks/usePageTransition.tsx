import { useState, useCallback } from 'react';

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFromProjectOverview, setIsFromProjectOverview] = useState(false);

  const triggerTransition = useCallback((callback?: () => void, fromProjectOverview = false) => {
    setIsTransitioning(true);
    setIsFromProjectOverview(fromProjectOverview);
    
    // Longer transition duration
    setTimeout(() => {
      setIsTransitioning(false);
      setIsFromProjectOverview(false);
      callback?.();
    }, 1200); // Increased from 800ms to 1200ms
  }, []);

  return {
    isTransitioning,
    isFromProjectOverview,
    triggerTransition
  };
};
