import { useState, useEffect } from 'react';

interface TaskCustomFieldsManager {
  enabledFields: string[];
  toggleField: (fieldId: string, enabled: boolean) => void;
  isFieldEnabled: (fieldId: string) => boolean;
  getEnabledFields: () => string[];
  isLoaded: boolean; // Add loading state
}

export const useTaskCustomFields = (taskId: string): TaskCustomFieldsManager => {
  const [enabledFields, setEnabledFields] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key for this specific task
  const storageKey = `task_custom_fields_${taskId}`;

  // Load enabled fields from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEnabledFields(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn('Failed to parse stored custom fields for task:', taskId);
        setEnabledFields([]);
      }
    }
    setIsLoaded(true);
    

  }, [taskId, storageKey]);

  // Save to localStorage whenever enabledFields changes
  useEffect(() => {
    if (isLoaded) { // Only save after initial load to avoid overwriting with empty array
      localStorage.setItem(storageKey, JSON.stringify(enabledFields));
    }
  }, [enabledFields, storageKey, isLoaded]);

  const toggleField = (fieldId: string, enabled: boolean) => {
    setEnabledFields(prev => {
      const newFields = enabled 
        ? (prev.includes(fieldId) ? prev : [...prev, fieldId])
        : prev.filter(id => id !== fieldId);
      
      return newFields;
    });
  };

  const isFieldEnabled = (fieldId: string): boolean => {
    return enabledFields.includes(fieldId);
  };

  const getEnabledFields = (): string[] => {
    return [...enabledFields];
  };

  return {
    enabledFields,
    toggleField,
    isFieldEnabled,
    getEnabledFields,
    isLoaded
  };
}; 