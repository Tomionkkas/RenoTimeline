import React, { useEffect, useMemo } from 'react';
import { Control, FieldErrors, UseFormSetValue, useWatch } from 'react-hook-form';
import { useCustomFieldDefinitions } from '@/hooks/useCustomFieldDefinitions';
import { useCustomFieldValues } from '@/hooks/useCustomFieldValues';
import { useCustomFieldValidation } from '@/hooks/useCustomFieldValidation';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CustomFieldsSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  entityId?: string;
  entityType: 'task' | 'project';
  projectId: string;
  className?: string;
  enabledFieldIds?: string[]; // New prop to filter fields
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
  const { values, loading: valuesLoading, saveAllFieldValues } = useCustomFieldValues(entityType, entityId);
  const { validateAllFields } = useCustomFieldValidation();

  // Watch all form values for validation
  const watchedValues = useWatch({ control });
  
  // Extract custom field values from watched form values
  const customFieldValues = useMemo(() => {
    const fieldValues: Record<string, any> = {};
    definitions.forEach(def => {
      const fieldKey = `customField_${def.id}`;
      if (watchedValues && fieldKey in watchedValues) {
        fieldValues[def.id] = watchedValues[fieldKey];
      }
    });
    return fieldValues;
  }, [definitions, watchedValues]);

  // Debounced validation
  const debouncedFieldValues = useDebounce(customFieldValues, 500);
  
  // Real-time validation results
  const validationResult = useMemo(() => {
    if (definitions.length === 0) return { isValid: true, errors: [], warnings: [] };
    return validateAllFields(definitions, debouncedFieldValues);
  }, [definitions, debouncedFieldValues, validateAllFields]);

  // Initialize form fields with current values
  useEffect(() => {
    if (!values || Object.keys(values).length === 0) return;

    Object.entries(values).forEach(([fieldId, value]) => {
      const fieldKey = `customField_${fieldId}`;
      setValue(fieldKey, value);
    });
  }, [values, setValue]);

  // Filter definitions based on enabled fields for tasks
  const filteredDefinitions = entityType === 'task' && enabledFieldIds 
    ? definitions.filter(def => enabledFieldIds.includes(def.id))
    : definitions;

  // If still loading definitions, don't show anything yet
  if (definitionsLoading) {
    return null;
  }

  // No fields available - return null immediately
  if (filteredDefinitions.length === 0) {
    return null;
  }

  // Loading state - only show if we have fields but values are still loading
  if (valuesLoading) {
    return (
      <Card className={`${className} transition-all duration-300 ease-in-out`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4 animate-spin text-blue-400" />
            Ładowanie pól niestandardowych...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDefinitions.slice(0, 3).map((_, i) => (
              <div 
                key={i} 
                className="space-y-2"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="h-4 bg-gray-700/30 rounded-md animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                <div className="h-10 w-full bg-gray-700/20 rounded-md border border-gray-600/30 animate-pulse transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const requiredFields = filteredDefinitions.filter(def => def.is_required).length;
  const validationErrors = validationResult.errors.length;
  const validationWarnings = validationResult.warnings.length;

  return (
    <Card className={`${className} transition-all duration-300 ease-in-out animate-in fade-in-0 duration-300`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Pola niestandardowe
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500 transition-colors duration-200" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500 transition-colors duration-200" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {filteredDefinitions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredDefinitions.length} pól
              </Badge>
            )}
            {requiredFields > 0 && (
              <Badge variant="outline" className="text-xs">
                {requiredFields} wymaganych
              </Badge>
            )}
            {validationErrors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {validationErrors} błędów
              </Badge>
            )}
            {validationWarnings > 0 && (
              <Badge variant="secondary" className="text-xs text-orange-600">
                {validationWarnings} ostrzeżeń
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Summary */}
        {(validationErrors > 0 || validationWarnings > 0) && (
          <div className="mt-4 space-y-2">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Błędy walidacji:
                  </span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((error, idx) => (
                    <li key={idx}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">
                    Ostrzeżenia:
                  </span>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  {validationResult.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {filteredDefinitions.map((definition, index) => (
          <div 
            key={definition.id}
            className="animate-in fade-in-0 slide-in-from-top-2 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CustomFieldRenderer
              definition={definition}
              control={control}
              errors={errors}
            />
          </div>
        ))}
        
        {/* Auto-save indicator */}
        {entityId && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Automatyczne zapisywanie włączone
          </div>
        )}
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