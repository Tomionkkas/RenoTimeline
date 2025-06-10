import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface DummyModeContextType {
  isDummyMode: boolean;
  toggleDummyMode: () => void;
}

const DummyModeContext = createContext<DummyModeContextType | undefined>(undefined);

export const DummyModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDummyMode, setIsDummyMode] = useState(() => {
    // Initialize state from localStorage if available
    return localStorage.getItem('dummyMode') === 'true';
  });

  const toggleDummyMode = () => {
    setIsDummyMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('dummyMode', JSON.stringify(newMode));
      return newMode;
    });
  };
  
  const value = useMemo(() => ({ isDummyMode, toggleDummyMode }), [isDummyMode]);

  return (
    <DummyModeContext.Provider value={value}>
      {children}
    </DummyModeContext.Provider>
  );
};

export const useDummyMode = (): DummyModeContextType => {
  const context = useContext(DummyModeContext);
  if (context === undefined) {
    throw new Error('useDummyMode must be used within a DummyModeProvider');
  }
  return context;
}; 