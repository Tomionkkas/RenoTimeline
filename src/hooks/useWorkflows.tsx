import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { WorkflowDefinition, WorkflowExecution } from '../lib/types/workflow';
import type { Tables } from '../integrations/supabase/database.types';

// Mock data for testing
const mockWorkflows: WorkflowDefinition[] = [
  {
    id: '1',
    name: 'Auto-uzupełnianie podzadań',
    description: 'Automatycznie oznacza zadanie główne jako ukończone gdy wszystkie podzadania są gotowe',
    project_id: 'matejki-9',
    is_active: true,
    trigger_type: 'task_status_changed',
    trigger_config: { to_status: 'done' },
    conditions: { has_subtasks: true },
    actions: [
      {
        type: 'update_task',
        config: { status: 'done' }
      },
      {
        type: 'send_notification',
        config: { 
          recipient_id: 'user-1',
          message: 'Zadanie główne zostało automatycznie ukończone',
          notification_type: 'workflow_executed'
        }
      }
    ],
    created_by: 'user-1',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z'
  },
  {
    id: '2', 
    name: 'Powiadomienie o wysokim priorytecie',
    description: 'Wysyła powiadomienie do managera gdy zostanie utworzone zadanie o wysokim priorytecie',
    project_id: 'matejki-9',
    is_active: true,
    trigger_type: 'task_created',
    trigger_config: {},
    conditions: { priority: 'high' },
    actions: [
      {
        type: 'send_notification',
        config: { 
          recipient_id: 'manager-1',
          message: 'Nowe zadanie wysokiego priorytetu wymaga uwagi',
          notification_type: 'workflow_executed'
        }
      }
    ],
    created_by: 'user-1',
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T09:00:00Z'
  },
  {
    id: '3',
    name: 'Przypomnienie o terminie',
    description: 'Wysyła przypomnienie 24 godziny przed terminem zadania',
    project_id: 'matejki-9',
    is_active: false,
    trigger_type: 'due_date_approaching',
    trigger_config: { days_before: 1 },
    conditions: {},
    actions: [
      {
        type: 'send_notification',
        config: { 
          recipient_id: 'user-1',
          message: 'Przypomnienie: zadanie kończy się jutro!',
          notification_type: 'due_date_reminder'
        }
      }
    ],
    created_by: 'user-1',
    created_at: '2024-11-30T15:00:00Z',
    updated_at: '2024-11-30T15:00:00Z'
  }
];

export function useWorkflows(projectId?: string) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchWorkflows = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use real Supabase data - tables exist!
      const { data, error: fetchError } = await supabase
        .from('workflow_definitions' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching workflows:', fetchError);
        throw fetchError;
      }
      
      console.log('✅ Fetched workflows from Supabase:', data?.length || 0, 'workflows for project:', projectId);
      setWorkflows((data || []) as unknown as WorkflowDefinition[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać przepływów pracy';
      console.error('Failed to fetch workflows:', err);
      setError(errorMessage);
      setWorkflows([]); // No fallback to mock data - show real state
    } finally {
      setLoading(false);
    }
  };

  // Temporarily disable real-time subscriptions to fix state conflicts
  // TODO: Re-enable after fixing subscription management
  /*
  useEffect(() => {
    if (!projectId) return;

    console.log('Setting up real-time subscription for workflows in project:', projectId);
    
    const channelName = `workflow_changes_${projectId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_definitions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('🔄 Real-time workflow change received:', payload);
          
          switch (payload.eventType) {
            case 'UPDATE':
              const updatedWorkflow = payload.new as unknown as WorkflowDefinition;
              setWorkflows(prev => prev.map(w => 
                w.id === updatedWorkflow.id 
                  ? updatedWorkflow 
                  : w
              ));
              console.log('🔄 Updated workflow via real-time:', updatedWorkflow.name);
              break;
            case 'DELETE':
              setWorkflows(prev => prev.filter(w => w.id !== payload.old.id));
              console.log('🗑️ Deleted workflow via real-time:', payload.old.id);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Real-time subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription for channel:', channelName);
      channel.unsubscribe();
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [projectId]);
  */

  const createWorkflow = async (workflowData: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('createWorkflow called with data:', workflowData);
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create in Supabase database
      const { data, error: createError } = await supabase
        .from('workflow_definitions' as any)
        .insert({
          ...workflowData,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) {
        console.error('Supabase creation error:', createError);
        throw createError;
      }
      
      const createdWorkflow = data as unknown as WorkflowDefinition;
      console.log('✅ Workflow created successfully in Supabase:', createdWorkflow);
      
      // Immediately add to local state
      console.log('✅ Adding workflow to local state:', createdWorkflow.name);
      setWorkflows(prev => {
        const exists = prev.some(w => w.id === createdWorkflow.id);
        if (!exists) {
          console.log('✅ Added workflow to state. New count:', prev.length + 1);
          return [createdWorkflow, ...prev];
        }
        console.log('⚠️ Workflow already exists in state');
        return prev;
      });
      
      return createdWorkflow;
    } catch (err) {
      console.error('Full createWorkflow error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się utworzyć przepływu pracy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<WorkflowDefinition>) => {
    try {
      // Real Supabase integration
      const { data, error: updateError } = await supabase
        .from('workflow_definitions' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }
      
      const updatedWorkflow = data as unknown as WorkflowDefinition;
      console.log('✅ Workflow updated successfully in Supabase:', updatedWorkflow);
      
      // Immediately update local state
      setWorkflows(prev => prev.map(w => 
        w.id === id ? updatedWorkflow : w
      ));
      
      return updatedWorkflow;
    } catch (err) {
      console.error('Full updateWorkflow error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zaktualizować przepływu pracy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      // Real Supabase integration
      const { error: deleteError } = await supabase
        .from('workflow_definitions' as any)
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Workflow deleted successfully from Supabase');
      
      // Immediately update local state
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Full deleteWorkflow error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się usunąć przepływu pracy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    return updateWorkflow(id, { is_active: isActive });
  };

  useEffect(() => {
    if (projectId) {
      fetchWorkflows();
    }
  }, [projectId]);

  /**
   * Get workflows by status (active/inactive)
   */
  const getWorkflowsByStatus = (isActive: boolean) => {
    return workflows.filter(workflow => workflow.is_active === isActive);
  };

  /**
   * Duplicate a workflow
   */
  const duplicateWorkflow = async (sourceWorkflow: WorkflowDefinition) => {
    try {
      const duplicatedData = {
        name: `${sourceWorkflow.name} (Kopia)`,
        description: sourceWorkflow.description,
        project_id: sourceWorkflow.project_id,
        is_active: false, // Start duplicated workflows as inactive
        trigger_type: sourceWorkflow.trigger_type,
        trigger_config: sourceWorkflow.trigger_config,
        conditions: sourceWorkflow.conditions,
        actions: sourceWorkflow.actions,
        created_by: 'current-user'
      };

      return await createWorkflow(duplicatedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zduplikować przepływu pracy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get workflow statistics for the project
   */
  const getWorkflowStats = () => {
    const total = workflows.length;
    const active = workflows.filter(w => w.is_active).length;
    const inactive = total - active;
    
    return {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? (active / total) * 100 : 0
    };
  };

  /**
   * Search workflows by name or description
   */
  const searchWorkflows = (searchTerm: string) => {
    if (!searchTerm.trim()) return workflows;
    
    const term = searchTerm.toLowerCase();
    return workflows.filter(workflow => 
      workflow.name.toLowerCase().includes(term) ||
      (workflow.description && workflow.description.toLowerCase().includes(term))
    );
  };

  return {
    workflows,
    loading,
    error,
    realtimeConnected,
    
    // CRUD operations
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    duplicateWorkflow,
    
    // Data filtering & search
    getWorkflowsByStatus,
    searchWorkflows,
    getWorkflowStats,
    
    // Utility
    refetch: fetchWorkflows
  };
} 