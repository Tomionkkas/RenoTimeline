import { useState, useEffect } from 'react';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

// Assuming types will be regenerated, but for now, let's define them manually based on the new schema.
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';
export type EntityType = 'task' | 'project';

export interface CustomFieldDefinition {
  id: string;
  project_id: string;
  name: string;
  field_type: FieldType;
  entity_type: EntityType;
  options?: any; // JSONB
  default_value?: string;
  is_required: boolean;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFieldDefinitionData extends Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'> {}
export interface UpdateFieldDefinitionData extends Partial<Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>> {}


export const useCustomFieldDefinitions = (projectId?: string, entityType?: EntityType) => {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDefinitions = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = renotimelineClient
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
      const { data: newDefinition, error: createError } = await renotimelineClient
        .from('custom_field_definitions')
        .insert([{
          ...data,
          position: data.position ?? definitions.length
        }])
        .select()
        .single();

      if (createError) throw createError;

      setDefinitions(prev => [...prev, newDefinition].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
      
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
      const { data: updatedDefinition, error: updateError } = await renotimelineClient
        .from('custom_field_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setDefinitions(prev => 
        prev.map(def => def.id === id ? updatedDefinition : def)
           .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
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
      const { error: deleteError } = await renotimelineClient
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
      const updates = reorderedDefinitions.map((def, index) => ({
        id: def.id,
        position: index
      }));

      // Supabase doesn't support batch updates in a single request through the JS client like this.
      // It's better to loop or use an RPC function for this.
      for (const update of updates) {
        const { error: updateError } = await renotimelineClient
          .from('custom_field_definitions')
          .update({ position: update.position })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }
      
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
    if (projectId && user) {
      fetchDefinitions();
    }
  }, [projectId, entityType, user]);

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