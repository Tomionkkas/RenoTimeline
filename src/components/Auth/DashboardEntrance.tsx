import React, { useState, useEffect } from 'react';

interface DashboardEntranceProps {
  children: React.ReactNode;
}

const DashboardEntrance: React.FC<DashboardEntranceProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition from login
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      {children}
    </div>
  );
};

export default DashboardEntrance;
