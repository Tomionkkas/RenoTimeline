
import { useState, useEffect } from 'react';

export const useDummyMode = () => {
  const [isDummyMode, setIsDummyMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('renotimeline_dummy_mode');
    setIsDummyMode(saved === 'true');
  }, []);

  const toggleDummyMode = () => {
    const newValue = !isDummyMode;
    setIsDummyMode(newValue);
    localStorage.setItem('renotimeline_dummy_mode', newValue.toString());
    
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'renotimeline_dummy_mode',
      newValue: newValue.toString()
    }));
  };

  return { isDummyMode, toggleDummyMode };
};
