import React, { useEffect, useMemo } from 'react';
import { Control, FieldErrors, UseFormSetValue, useWatch } from 'react-hook-form';
import { useCustomFieldDefinitions } from '@/hooks/useCustomFieldDefinitions';
import { useCustomFieldValues } from '@/hooks/useCustomFieldValues';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CustomFieldsSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  entityId?: string;
  entityType: 'task' | 'project';
  projectId: string;
  className?: string;
  enabledFieldIds?: string[];
}

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  control,
  setValue,
  errors,
  entityId,
  entityType,
  projectId,
  className = '',
  enabledFieldIds
}) => {
  const { definitions, loading: definitionsLoading } = useCustomFieldDefinitions(projectId, entityType);
  const { values, loading: valuesLoading, saveAllFieldValues } = useCustomFieldValues(entityId);

  const watchedValues = useWatch({ control });
  
  const customFieldFormValues = useMemo(() => {
    const fieldValues: Record<string, any> = {};
    definitions.forEach(def => {
      const fieldKey = `customField_${def.id}`;
      if (watchedValues && fieldKey in watchedValues) {
        fieldValues[def.id] = watchedValues[fieldKey];
      }
    });
    return fieldValues;
  }, [definitions, watchedValues]);

  const debouncedFormValues = useDebounce(customFieldFormValues, 1000);

  // Auto-save logic
  useEffect(() => {
    if (entityId && Object.keys(debouncedFormValues).length > 0) {
      const save = async () => {
        const success = await saveAllFieldValues(debouncedFormValues);
        if (success) {
          toast.success("Custom fields auto-saved!");
        } else {
          toast.error("Failed to auto-save custom fields.");
        }
      };
      save();
    }
  }, [entityId, debouncedFormValues, saveAllFieldValues]);


  // Initialize form fields with current values from the database
  useEffect(() => {
    if (values.length > 0) {
      values.forEach(value => {
        const fieldKey = `customField_${value.definition_id}`;
        setValue(fieldKey, value.value, { shouldDirty: false, shouldTouch: false });
      });
    }
  }, [values, setValue]);

  const filteredDefinitions = useMemo(() => {
    return enabledFieldIds 
      ? definitions.filter(def => enabledFieldIds.includes(def.id))
      : definitions;
  }, [definitions, enabledFieldIds]);

  if (definitionsLoading) {
    return null; // Or a skeleton loader
  }

  if (filteredDefinitions.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Custom Fields
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {filteredDefinitions.map((definition) => (
          <div key={definition.id}>
            <CustomFieldRenderer
              definition={definition}
              control={control}
              errors={errors}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Helper function to extract custom field data from form values
export const extractCustomFieldData = (formValues: any, definitions: any[]): Record<string, any> => {
  const customFieldData: Record<string, any> = {};
  
  definitions.forEach(definition => {
    const fieldKey = `customField_${definition.id}`;
    if (fieldKey in formValues) {
      customFieldData[definition.id] = formValues[fieldKey];
    }
  });
  
  return customFieldData;
};

// Helper function to merge custom field data into form values
export const mergeCustomFieldData = (formValues: any, customFieldData: Record<string, any>): any => {
  const mergedValues = { ...formValues };
  
  Object.entries(customFieldData).forEach(([fieldId, value]) => {
    const fieldKey = `customField_${fieldId}`;
    mergedValues[fieldKey] = value;
  });
  
  return mergedValues;
}; 