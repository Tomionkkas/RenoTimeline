import { useState, useEffect } from 'react';
import { renotimelineClient } from '../integrations/supabase/client';
import { WorkflowEngine } from '../lib/workflow/WorkflowEngine'; // Assuming this engine is schema-agnostic
import { useAuth } from './useAuth';

export interface WorkflowExecution {
  id: string;
  project_id: string;
  workflow_id: string;
  current_step: number;
  status: 'active' | 'completed' | 'failed';
  execution_data?: any; // JSONB
  started_at: string;
  completed_at?: string;
}

export function useWorkflowExecution(workflowId?: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchExecutionHistory = async (workflowIdFilter?: string, limit: number = 50) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      let query = renotimelineClient
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

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

  // ... (The trigger and retry logic would need a significant overhaul
  // as the WorkflowEngine itself needs to be adapted to the new schema.
  // For now, I will focus on migrating the data access parts.)

  const getExecutionStats = async (workflowIdFilter?: string) => {
    try {
      let query = renotimelineClient
        .from('workflow_executions')
        .select('status');

      if (workflowIdFilter || workflowId) {
        query = query.eq('workflow_id', workflowIdFilter || workflowId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const executions = (data as any) || [];
      const stats = {
        total: executions.length,
        completed: executions.filter((e: any) => e.status === 'completed').length,
        failed: executions.filter((e: any) => e.status === 'failed').length,
        active: executions.filter((e: any) => e.status === 'active').length,
      };

      return {
        ...stats,
        successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get execution stats');
      return { total: 0, completed: 0, failed: 0, active: 0, successRate: 0 };
    }
  };
  
  const deleteExecution = async (executionId: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await renotimelineClient
        .from('workflow_executions')
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

  useEffect(() => {
    if (workflowId && user) {
      fetchExecutionHistory(workflowId);
    }
  }, [workflowId, user]);

  return {
    executions,
    loading,
    error,
    deleteExecution,
    fetchExecutionHistory,
    getExecutionStats,
    refetch: () => fetchExecutionHistory(workflowId),
  };
} 