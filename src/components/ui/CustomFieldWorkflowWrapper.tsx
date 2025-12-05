import React, { useRef, useEffect } from 'react';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';
import { useCustomFieldDefinitions } from '../../hooks/useCustomFieldDefinitions';

interface CustomFieldWorkflowWrapperProps {
  entityType: 'task' | 'project';
  entityId: string;
  projectId: string;
  values: Record<string, any>;
  onFieldChange?: (fieldId: string, oldValue: any, newValue: any) => void;
}

/**
 * Wrapper component that monitors custom field changes and triggers workflows
 */
export const CustomFieldWorkflowWrapper: React.FC<CustomFieldWorkflowWrapperProps> = ({
  entityType,
  entityId,
  projectId,
  values,
  onFieldChange
}) => {
  const prevValuesRef = useRef<Record<string, any>>({});
  const { definitions } = useCustomFieldDefinitions(projectId, entityType);
  
  useEffect(() => {
    const prevValues = prevValuesRef.current;
    
    // Check for changes in field values
    Object.entries(values).forEach(([fieldId, newValue]) => {
      const oldValue = prevValues[fieldId];
      
      // Only trigger if value actually changed (and not initial load)
      if (oldValue !== undefined && oldValue !== newValue) {
        // Find field definition to get the field name
        const fieldDefinition = definitions.find(def => def.id === fieldId);
        const fieldName = fieldDefinition?.name || fieldId;

        // WORKFLOW EXECUTION DISABLED - Will be implemented in the future
        /*
        // Trigger workflow for custom field change
        WorkflowTriggers.onCustomFieldChanged(
          entityType,
          entityId,
          projectId,
          fieldId,
          oldValue,
          newValue,
          'current-user-id' // This should come from auth context
        ).catch(error => {
          console.error(`Failed to trigger workflow for custom field change: ${fieldName}`, error);
        });
        */
        
        // Call the optional callback
        if (onFieldChange) {
          onFieldChange(fieldId, oldValue, newValue);
        }
      }
    });
    
    // Update previous values reference
    prevValuesRef.current = { ...values };
  }, [values, entityType, entityId, projectId, definitions, onFieldChange]);

  return null; // This component doesn't render anything
};

/**
 * Hook to use custom field workflow tracking
 */
export const useCustomFieldWorkflowTracking = (
  entityType: 'task' | 'project',
  entityId: string,
  projectId: string,
  enabled: boolean = true
) => {
  const prevValuesRef = useRef<Record<string, any>>({});
  const { definitions } = useCustomFieldDefinitions(projectId, entityType);

  const trackFieldChange = React.useCallback((
    fieldId: string,
    newValue: any,
    oldValue?: any
  ) => {
    if (!enabled) return;
    
    const actualOldValue = oldValue !== undefined ? oldValue : prevValuesRef.current[fieldId];
    
    // Only trigger if value actually changed
    if (actualOldValue !== undefined && actualOldValue !== newValue) {
      const fieldDefinition = definitions.find(def => def.id === fieldId);
      const fieldName = fieldDefinition?.name || fieldId;

      // WORKFLOW EXECUTION DISABLED - Will be implemented in the future
      /*
      // Trigger workflow for custom field change
      WorkflowTriggers.onCustomFieldChanged(
        entityType,
        entityId,
        projectId,
        fieldId,
        actualOldValue,
        newValue,
        'current-user-id' // This should come from auth context
      ).catch(error => {
        console.error(`Failed to trigger workflow for custom field change: ${fieldName}`, error);
      });
      */
    }
    
    // Update the tracked value
    prevValuesRef.current[fieldId] = newValue;
  }, [enabled, entityType, entityId, projectId, definitions]);

  const initializeTracking = React.useCallback((initialValues: Record<string, any>) => {
    prevValuesRef.current = { ...initialValues };
  }, []);

  return {
    trackFieldChange,
    initializeTracking
  };
};

export default CustomFieldWorkflowWrapper; 