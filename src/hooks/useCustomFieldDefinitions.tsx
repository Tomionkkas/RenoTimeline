import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type FieldType = Database['public']['Enums']['field_type'];
export type EntityType = Database['public']['Enums']['entity_type'];
export type CustomFieldDefinition = Database['public']['Tables']['custom_field_definitions']['Row'];
export type CreateFieldDefinitionData = Database['public']['Tables']['custom_field_definitions']['Insert'];
export type UpdateFieldDefinitionData = Database['public']['Tables']['custom_field_definitions']['Update'];

export const useCustomFieldDefinitions = (projectId?: string, entityType?: EntityType) => {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDefinitions = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDefinitions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch field definitions';
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

  const createDefinition = async (data: CreateFieldDefinitionData): Promise<CustomFieldDefinition | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: newDefinition, error: createError } = await supabase
        .from('custom_field_definitions')
        .insert([{
          ...data,
          position: data.position || definitions.length
        }])
        .select()
        .single();

      if (createError) throw createError;

      setDefinitions(prev => [...prev, newDefinition].sort((a, b) => (a.position || 0) - (b.position || 0)));
      
      toast({
        title: 'Success',
        description: 'Custom field created successfully'
      });

      return newDefinition;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create field definition';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateDefinition = async (id: string, updates: UpdateFieldDefinitionData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedDefinition, error: updateError } = await supabase
        .from('custom_field_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setDefinitions(prev => 
        prev.map(def => def.id === id ? updatedDefinition : def)
           .sort((a, b) => (a.position || 0) - (b.position || 0))
      );

      toast({
        title: 'Success',
        description: 'Custom field updated successfully'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update field definition';
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

  const deleteDefinition = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDefinitions(prev => prev.filter(def => def.id !== id));

      toast({
        title: 'Success',
        description: 'Custom field deleted successfully'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete field definition';
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

  const reorderDefinitions = async (reorderedDefinitions: CustomFieldDefinition[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Update positions for all definitions
      const updates = reorderedDefinitions.map((def, index) => ({
        id: def.id,
        position: index
      }));

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('custom_field_definitions')
          .update({ position: update.position })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      // Update local state
      setDefinitions(reorderedDefinitions);

      toast({
        title: 'Success',
        description: 'Field order updated successfully'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder fields';
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
    if (projectId) {
      fetchDefinitions();
    }
  }, [projectId, entityType]);

  return {
    definitions,
    loading,
    error,
    fetchDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    reorderDefinitions
  };
}; 