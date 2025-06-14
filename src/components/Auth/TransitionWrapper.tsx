
import React, { useState, useEffect } from 'react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  show: boolean;
  delay?: number;
  className?: string;
  exitDuration?: number;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ 
  children, 
  show, 
  delay = 0,
  className = '',
  exitDuration = 300
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShouldRender(true);
        // Small delay to ensure DOM is ready before animation
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, exitDuration);
      return () => clearTimeout(timer);
    }
  }, [show, delay, exitDuration]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`
        transition-all duration-500 ease-in-out
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;
