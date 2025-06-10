import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import type { CustomFieldDefinition, EntityType } from './useCustomFieldDefinitions';

export type CustomFieldValue = Database['public']['Tables']['custom_field_values']['Row'];
export type CreateFieldValueData = Database['public']['Tables']['custom_field_values']['Insert'];
export type UpdateFieldValueData = Database['public']['Tables']['custom_field_values']['Update'];

export interface FieldValuePair {
  definition: CustomFieldDefinition;
  value?: CustomFieldValue;
}

export const useCustomFieldValues = (entityType?: EntityType, entityId?: string) => {
  const [values, setValues] = useState<CustomFieldValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchValues = async () => {
    if (!entityType || !entityId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (fetchError) throw fetchError;

      setValues(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch field values';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (fieldDefinitionId: string): CustomFieldValue | undefined => {
    return values.find(value => value.field_definition_id === fieldDefinitionId);
  };

  const saveFieldValue = async (fieldDefinitionId: string, value: any): Promise<boolean> => {
    if (!entityType || !entityId) return false;
    
    setLoading(true);
    setError(null);

    try {
      const existingValue = getFieldValue(fieldDefinitionId);
      
      if (existingValue) {
        // Update existing value
        const { data: updatedValue, error: updateError } = await supabase
          .from('custom_field_values')
          .update({ value })
          .eq('id', existingValue.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setValues(prev => 
          prev.map(v => v.id === existingValue.id ? updatedValue : v)
        );
      } else {
        // Create new value
        const { data: newValue, error: createError } = await supabase
          .from('custom_field_values')
          .insert([{
            field_definition_id: fieldDefinitionId,
            entity_type: entityType,
            entity_id: entityId,
            value
          }])
          .select()
          .single();

        if (createError) throw createError;

        setValues(prev => [...prev, newValue]);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save field value';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveAllFieldValues = async (fieldValues: Record<string, any>): Promise<boolean> => {
    if (!entityType || !entityId) return false;
    
    setLoading(true);
    setError(null);

    try {
      const promises = Object.entries(fieldValues).map(async ([fieldDefinitionId, value]) => {
        const existingValue = getFieldValue(fieldDefinitionId);
        
        if (existingValue) {
          // Update existing value
          return supabase
            .from('custom_field_values')
            .update({ value })
            .eq('id', existingValue.id)
            .select()
            .single();
        } else {
          // Create new value
          return supabase
            .from('custom_field_values')
            .insert([{
              field_definition_id: fieldDefinitionId,
              entity_type: entityType,
              entity_id: entityId,
              value
            }])
            .select()
            .single();
        }
      });

      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(errors[0].error.message);
      }

      // Update local state with all new/updated values
      const updatedValues = results.map(result => result.data).filter(Boolean);
      
      setValues(prev => {
        const newValues = [...prev];
        updatedValues.forEach(updatedValue => {
          const existingIndex = newValues.findIndex(v => v.id === updatedValue.id);
          if (existingIndex >= 0) {
            newValues[existingIndex] = updatedValue;
          } else {
            newValues.push(updatedValue);
          }
        });
        return newValues;
      });

      toast({
        title: 'Success',
        description: 'Custom fields saved successfully'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save field values';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFieldValue = async (fieldDefinitionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const existingValue = getFieldValue(fieldDefinitionId);
      if (!existingValue) return true; // Nothing to delete

      const { error: deleteError } = await supabase
        .from('custom_field_values')
        .delete()
        .eq('id', existingValue.id);

      if (deleteError) throw deleteError;

      setValues(prev => prev.filter(v => v.id !== existingValue.id));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete field value';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateFieldValue = (definition: CustomFieldDefinition, value: any): string | null => {
    // Check if required field is empty
    if (definition.is_required && (!value || value === '' || value === null || value === undefined)) {
      return `${definition.name} is required`;
    }

    // Type-specific validation
    switch (definition.field_type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${definition.name} must be a valid email address`;
        }
        break;
      
      case 'url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          return `${definition.name} must be a valid URL`;
        }
        break;
      
      case 'number':
        if (value && (isNaN(value) || isNaN(parseFloat(value)))) {
          return `${definition.name} must be a valid number`;
        }
        break;
      
      case 'date':
      case 'datetime':
        if (value && isNaN(Date.parse(value))) {
          return `${definition.name} must be a valid date`;
        }
        break;
      
      case 'select':
        if (value && definition.options) {
          const options = Array.isArray(definition.options) ? definition.options : [];
          if (!options.includes(value)) {
            return `${definition.name} must be one of the allowed options`;
          }
        }
        break;
      
      case 'multi_select':
        if (value && definition.options) {
          const options = Array.isArray(definition.options) ? definition.options : [];
          const values = Array.isArray(value) ? value : [];
          if (!values.every(v => options.includes(v))) {
            return `${definition.name} contains invalid options`;
          }
        }
        break;
    }

    return null; // No validation errors
  };

  const validateAllFields = (definitions: CustomFieldDefinition[], values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    definitions.forEach(definition => {
      const value = values[definition.id];
      const error = validateFieldValue(definition, value);
      if (error) {
        errors[definition.id] = error;
      }
    });

    return errors;
  };

  useEffect(() => {
    if (entityType && entityId) {
      fetchValues();
    }
  }, [entityType, entityId]);

  return {
    values,
    loading,
    error,
    fetchValues,
    getFieldValue,
    saveFieldValue,
    saveAllFieldValues,
    deleteFieldValue,
    validateFieldValue,
    validateAllFields
  };
}; 