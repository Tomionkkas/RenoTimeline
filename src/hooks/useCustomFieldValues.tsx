import { useState, useEffect } from 'react';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CustomFieldDefinition } from './useCustomFieldDefinitions';
import { useAuth } from './useAuth';

// Manual type definition based on the new schema
export interface CustomFieldValue {
  id: string;
  definition_id: string;
  entity_id: string;
  value?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFieldValueData extends Omit<CustomFieldValue, 'id' | 'created_at' | 'updated_at'> {}
export interface UpdateFieldValueData extends Partial<Omit<CustomFieldValue, 'id' | 'created_at' | 'updated_at'>> {}


export interface FieldValuePair {
  definition: CustomFieldDefinition;
  value?: CustomFieldValue;
}

export const useCustomFieldValues = (entityId?: string) => {
  const [values, setValues] = useState<CustomFieldValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchValues = async () => {
    if (!entityId || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await renotimelineClient
        .from('custom_field_values')
        .select('*')
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

  const getFieldValue = (definitionId: string): CustomFieldValue | undefined => {
    return values.find(value => value.definition_id === definitionId);
  };

  const saveFieldValue = async (definitionId: string, value: any): Promise<boolean> => {
    if (!entityId) return false;
    
    setLoading(true);
    setError(null);

    try {
      const existingValue = getFieldValue(definitionId);
      
      if (existingValue) {
        // Update existing value
        const { data: updatedValue, error: updateError } = await renotimelineClient
          .from('custom_field_values')
          .update({ value: value ?? null })
          .eq('id', existingValue.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setValues(prev => 
          prev.map(v => v.id === existingValue.id ? updatedValue : v)
        );
      } else {
        // Create new value
        const { data: newValue, error: createError } = await renotimelineClient
          .from('custom_field_values')
          .insert([{
            definition_id: definitionId,
            entity_id: entityId,
            value: value ?? null
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
    if (!entityId) return false;
    
    setLoading(true);
    setError(null);

    try {
      const upsertData = Object.entries(fieldValues).map(([definitionId, value]) => {
        const existingValue = getFieldValue(definitionId);
        return {
          id: existingValue?.id, // This will be ignored on insert
          definition_id: definitionId,
          entity_id: entityId,
          value: value ?? null,
        };
      });

      const { data: upsertedValues, error: upsertError } = await renotimelineClient
        .from('custom_field_values')
        .upsert(upsertData, { onConflict: 'definition_id,entity_id' })
        .select();

      if (upsertError) throw upsertError;

      // Refetch to get the most accurate state
      await fetchValues();

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


  useEffect(() => {
    if (entityId && user) {
      fetchValues();
    }
  }, [entityId, user]);

  return {
    values,
    loading,
    error,
    fetchValues,
    getFieldValue,
    saveFieldValue,
    saveAllFieldValues,
  };
}; 