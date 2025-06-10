import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { WorkflowEngine } from '../lib/workflow/WorkflowEngine';
import type { 
  WorkflowExecution, 
  WorkflowTriggerType, 
  TriggerData,
  WorkflowExecutionStatus
} from '../lib/types/workflow';

export function useWorkflowExecution(workflowId?: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch execution history for a specific workflow or all executions
   */
  const fetchExecutionHistory = async (workflowIdFilter?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('workflow_executions' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (workflowIdFilter || workflowId) {
        query = query.eq('workflow_id', workflowIdFilter || workflowId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setExecutions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch execution history');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually trigger workflow evaluation for a specific trigger type
   */
  const triggerWorkflow = async (triggerType: WorkflowTriggerType, triggerData: TriggerData) => {
    try {
      setError(null);
      await WorkflowEngine.evaluateWorkflows(triggerType, triggerData);
      
      // Refresh execution history after trigger
      await fetchExecutionHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger workflow';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Retry a failed workflow execution
   */
  const retryFailedExecution = async (executionId: string) => {
    try {
      setError(null);
      
      // Get the original execution details
      const { data: execution, error: fetchError } = await supabase
        .from('workflow_executions' as any)
        .select('*')
        .eq('id', executionId)
        .single();

      if (fetchError) throw fetchError;
      if (!execution) throw new Error('Execution not found');

      if (execution.status !== 'failed') {
        throw new Error('Only failed executions can be retried');
      }

      // Re-trigger the workflow with the original context
      const triggerData = execution.trigger_data as TriggerData;
      await WorkflowEngine.executeWorkflow(execution.workflow_id, triggerData);
      
      // Refresh execution history
      await fetchExecutionHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry execution';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get execution statistics for a workflow
   */
  const getExecutionStats = async (workflowIdFilter?: string) => {
    try {
      let query = supabase
        .from('workflow_executions' as any)
        .select('status');

      if (workflowIdFilter || workflowId) {
        query = query.eq('workflow_id', workflowIdFilter || workflowId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const stats = {
        total: data?.length || 0,
        successful: data?.filter(e => e.status === 'completed').length || 0,
        failed: data?.filter(e => e.status === 'failed').length || 0,
        running: data?.filter(e => e.status === 'running').length || 0,
      };

      return {
        ...stats,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get execution stats');
      return { total: 0, successful: 0, failed: 0, running: 0, successRate: 0 };
    }
  };

  /**
   * Cancel a running workflow execution
   */
  const cancelExecution = async (executionId: string) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('workflow_executions' as any)
        .update({ 
          status: 'cancelled',
          finished_at: new Date().toISOString(),
          error_message: 'Cancelled by user'
        })
        .eq('id', executionId)
        .eq('status', 'running'); // Only cancel running executions

      if (updateError) throw updateError;
      
      // Refresh execution history
      await fetchExecutionHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel execution';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Delete execution records (cleanup)
   */
  const deleteExecution = async (executionId: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('workflow_executions' as any)
        .delete()
        .eq('id', executionId);

      if (deleteError) throw deleteError;
      
      setExecutions(prev => prev.filter(e => e.id !== executionId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete execution';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get recent executions (last 10)
   */
  const getRecentExecutions = async (limit: number = 10) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('workflow_executions' as any)
        .select('*, workflow_definitions!inner(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent executions');
      return [];
    }
  };

  // Auto-fetch execution history when workflowId changes
  useEffect(() => {
    if (workflowId) {
      fetchExecutionHistory();
    }
  }, [workflowId]);

  return {
    executions,
    loading,
    error,
    
    // Core functions
    triggerWorkflow,
    retryFailedExecution,
    cancelExecution,
    deleteExecution,
    
    // Data fetching
    fetchExecutionHistory,
    getExecutionStats,
    getRecentExecutions,
    
    // Utility
    refetch: () => fetchExecutionHistory(workflowId)
  };
} 