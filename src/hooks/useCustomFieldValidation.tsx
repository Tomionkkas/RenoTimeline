import { useCallback } from 'react';
import type { CustomFieldDefinition } from './useCustomFieldDefinitions';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'range' | 'length' | 'options';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export const useCustomFieldValidation = () => {
  const validateFieldValue = useCallback((
    definition: CustomFieldDefinition,
    value: any
  ): ValidationError | null => {
    const fieldName = definition.name;

    // Check required fields
    if (definition.is_required && (!value || value === '' || value === null || value === undefined)) {
      return {
        field: definition.id,
        message: `${fieldName} jest wymagane`,
        type: 'required'
      };
    }

    // Skip validation for empty optional fields
    if (!value && !definition.is_required) {
      return null;
    }

    // Type-specific validation
    switch (definition.field_type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return {
            field: definition.id,
            message: `${fieldName} musi być poprawnym adresem email`,
            type: 'format'
          };
        }
        break;

      case 'url':
        if (value) {
          try {
            new URL(value);
          } catch {
            return {
              field: definition.id,
              message: `${fieldName} musi być poprawnym adresem URL`,
              type: 'format'
            };
          }
        }
        break;

      case 'number':
        if (value !== null && value !== undefined && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return {
              field: definition.id,
              message: `${fieldName} musi być liczbą`,
              type: 'format'
            };
          }
          // Additional range validation could be added here
          if (numValue < 0 && definition.field_type === 'number') {
            // Could add min/max validation based on field configuration
          }
        }
        break;

      case 'date':
      case 'datetime':
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return {
              field: definition.id,
              message: `${fieldName} musi być poprawną datą`,
              type: 'format'
            };
          }
          // Could add date range validation
          const now = new Date();
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const tenYearsFromNow = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
          
          if (date < oneYearAgo || date > tenYearsFromNow) {
            return {
              field: definition.id,
              message: `${fieldName} musi być w rozsądnym zakresie dat`,
              type: 'range'
            };
          }
        }
        break;

      case 'select':
        if (value && Array.isArray(definition.options)) {
          const options = definition.options as string[];
          if (!options.includes(value)) {
            return {
              field: definition.id,
              message: `${fieldName} zawiera nieprawidłową opcję`,
              type: 'options'
            };
          }
        }
        break;

      case 'multi_select':
        if (value && Array.isArray(value) && Array.isArray(definition.options)) {
          const options = definition.options as string[];
          const invalidOptions = value.filter(v => !options.includes(v));
          if (invalidOptions.length > 0) {
            return {
              field: definition.id,
              message: `${fieldName} zawiera nieprawidłowe opcje: ${invalidOptions.join(', ')}`,
              type: 'options'
            };
          }
          // Limit selection count
          if (value.length > 10) {
            return {
              field: definition.id,
              message: `${fieldName} może zawierać maksymalnie 10 opcji`,
              type: 'length'
            };
          }
        }
        break;

      case 'text':
        if (value && typeof value === 'string') {
          if (value.length > 500) {
            return {
              field: definition.id,
              message: `${fieldName} może zawierać maksymalnie 500 znaków`,
              type: 'length'
            };
          }
        }
        break;

      case 'textarea':
        if (value && typeof value === 'string') {
          if (value.length > 5000) {
            return {
              field: definition.id,
              message: `${fieldName} może zawierać maksymalnie 5000 znaków`,
              type: 'length'
            };
          }
        }
        break;

      case 'boolean':
        if (value !== null && value !== undefined && typeof value !== 'boolean') {
          // Try to convert string values
          if (value === 'true' || value === 'false') {
            break; // Valid string boolean
          }
          return {
            field: definition.id,
            message: `${fieldName} musi być wartością logiczną`,
            type: 'format'
          };
        }
        break;
    }

    return null;
  }, []);

  const validateAllFields = useCallback((
    definitions: CustomFieldDefinition[],
    values: Record<string, any>
  ): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    definitions.forEach(definition => {
      const value = values[definition.id];
      const error = validateFieldValue(definition, value);
      if (error) {
        errors.push(error);
      }

      // Add warnings for potential issues
      if (definition.field_type === 'email' && value && !value.includes('.')) {
        warnings.push(`${definition.name}: Adres email może być niepoprawny`);
      }

      if (definition.field_type === 'url' && value && !value.startsWith('http')) {
        warnings.push(`${definition.name}: URL powinien zaczynać się od http:// lub https://`);
      }

      if (definition.field_type === 'number' && value && value < 0) {
        warnings.push(`${definition.name}: Wartość ujemna może być nieprawidłowa`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [validateFieldValue]);

  const getFieldValidationRules = useCallback((definition: CustomFieldDefinition) => {
    const rules: any = {};

    if (definition.is_required) {
      rules.required = `${definition.name} jest wymagane`;
    }

    switch (definition.field_type) {
      case 'email':
        rules.pattern = {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: `${definition.name} musi być poprawnym adresem email`
        };
        break;

      case 'url':
        rules.validate = (value: string) => {
          if (!value) return true;
          try {
            new URL(value);
            return true;
          } catch {
            return `${definition.name} musi być poprawnym adresem URL`;
          }
        };
        break;

      case 'number':
        rules.validate = (value: any) => {
          if (!value) return true;
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return `${definition.name} musi być liczbą`;
          }
          return true;
        };
        break;

      case 'text':
        rules.maxLength = {
          value: 500,
          message: `${definition.name} może zawierać maksymalnie 500 znaków`
        };
        break;

      case 'textarea':
        rules.maxLength = {
          value: 5000,
          message: `${definition.name} może zawierać maksymalnie 5000 znaków`
        };
        break;

      case 'select':
        if (Array.isArray(definition.options)) {
          rules.validate = (value: any) => {
            if (!value) return true;
            const options = definition.options as string[];
            return options.includes(value) || 
              `${definition.name} zawiera nieprawidłową opcję`;
          };
        }
        break;

      case 'multi_select':
        if (Array.isArray(definition.options)) {
          rules.validate = (value: any) => {
            if (!value || !Array.isArray(value)) return true;
            const options = definition.options as string[];
            const invalidOptions = value.filter(v => !options.includes(v));
            if (invalidOptions.length > 0) {
              return `${definition.name} zawiera nieprawidłowe opcje`;
            }
            if (value.length > 10) {
              return `${definition.name} może zawierać maksymalnie 10 opcji`;
            }
            return true;
          };
        }
        break;
    }

    return rules;
  }, []);

  return {
    validateFieldValue,
    validateAllFields,
    getFieldValidationRules
  };
}; 