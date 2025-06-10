import { supabase } from '../../integrations/supabase/client';
import { EnhancedActionExecutors } from './EnhancedActionExecutors';
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionContext,
  WorkflowTriggerType,
  TriggerData,
  WorkflowAction,
  WorkflowExecutionStatus,
} from '../types/workflow';

/**
 * Enhanced Workflow Engine that uses Enhanced Action Executors
 * This is a simplified version that focuses on production-ready execution
 */
export class WorkflowEngineEnhanced {
  /**
   * Execute a specific workflow with Enhanced Action Executors
   */
  static async executeWorkflow(
    workflowId: string,
    triggerData: TriggerData
  ): Promise<WorkflowExecution> {
    const executionStart = new Date().toISOString();
    let status: WorkflowExecutionStatus = 'success';
    let errorMessage: string | undefined;
    const executedActions: WorkflowAction[] = [];

    try {
      // Get workflow definition
      const { data: workflow, error: workflowError } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Helper function to safely extract user_id from different trigger data types
      const getUserIdFromTriggerData = (triggerData: TriggerData): string => {
        if ('user_id' in triggerData) {
          return triggerData.user_id;
        }
        if ('created_by' in triggerData) {
          return triggerData.created_by;
        }
        if ('assigned_by' in triggerData) {
          return triggerData.assigned_by;
        }
        if ('changed_by' in triggerData) {
          return triggerData.changed_by;
        }
        if ('uploaded_by' in triggerData) {
          return triggerData.uploaded_by;
        }
        return workflow.created_by;
      };

      // Create execution context
      const context: WorkflowExecutionContext = {
        user_id: getUserIdFromTriggerData(triggerData),
        project_id: triggerData.project_id,
        trigger_data: triggerData,
        workflow: workflow as WorkflowDefinition
      };

      // Execute each action in sequence using Enhanced Executors
      for (const action of workflow.actions || []) {
        try {
          console.log(`🎯 Executing enhanced action: ${action.type}`);
          await EnhancedActionExecutors.executeAction(action, context);
          executedActions.push(action);
          console.log(`✅ Enhanced action completed: ${action.type}`);
        } catch (actionError) {
          console.error(`❌ Enhanced action failed: ${action.type}`, actionError);
          status = 'partial';
          if (!errorMessage) {
            errorMessage = `Failed to execute action: ${action.type}`;
          }
        }
      }

    } catch (error) {
      console.error('❌ Enhanced workflow execution failed:', error);
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    // Log execution
    const execution = await this.logExecution(
      workflowId,
      triggerData,
      executedActions,
      status,
      errorMessage
    );

    // Create notification for execution result
    if (status === 'success') {
      console.log(`🎉 Enhanced workflow completed successfully: ${workflowId}`);
    } else if (status === 'failed') {
      console.log(`💥 Enhanced workflow failed: ${workflowId} - ${errorMessage}`);
    } else {
      console.log(`⚠️ Enhanced workflow partially completed: ${workflowId} - ${errorMessage}`);
    }

    return execution;
  }

  /**
   * Log workflow execution
   */
  private static async logExecution(
    workflowId: string,
    triggerData: TriggerData,
    executedActions: WorkflowAction[],
    status: WorkflowExecutionStatus,
    errorMessage?: string
  ): Promise<WorkflowExecution> {
    const executionData = {
      workflow_id: workflowId,
      status,
      execution_time: new Date().toISOString(),
      trigger_data: triggerData as any,
      executed_actions: executedActions as any,
      error_message: errorMessage || null
    };

    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert(executionData)
        .select()
        .single();

      if (error) {
        console.error('Failed to log workflow execution:', error);
        // Return a mock execution if logging fails
        return {
          id: `mock-${Date.now()}`,
          workflow_id: workflowId,
          status,
          execution_time: new Date().toISOString(),
          trigger_data: triggerData as any,
          executed_actions: executedActions,
          error_message: errorMessage || null
        };
      }

      return data as WorkflowExecution;
    } catch (error) {
      console.error('Error logging workflow execution:', error);
      // Return a mock execution if logging fails
      return {
        id: `mock-${Date.now()}`,
        workflow_id: workflowId,
        status,
        execution_time: new Date().toISOString(),
        trigger_data: triggerData as any,
        executed_actions: executedActions,
        error_message: errorMessage || null
      };
    }
  }

  /**
   * Get active workflows for a trigger type and project
   */
  static async getActiveWorkflows(
    triggerType: WorkflowTriggerType,
    projectId: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('project_id', projectId)
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching workflows:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveWorkflows:', error);
      return [];
    }
  }

  /**
   * Check if trigger conditions are met (simplified)
   */
  static checkTriggerConditions(
    workflow: any,
    triggerData: TriggerData
  ): boolean {
    try {
      const config = workflow.trigger_config || {};

      switch (workflow.trigger_type) {
        case 'task_status_changed': {
          const data = triggerData as any;
          if (config.from_status && config.from_status !== data.from_status) return false;
          if (config.to_status && config.to_status !== data.to_status) return false;
          return true;
        }

        case 'task_created': {
          const data = triggerData as any;
          if (config.assigned_to && config.assigned_to !== data.assigned_to) return false;
          return true;
        }

        case 'task_assigned': {
          const data = triggerData as any;
          if (config.from_user && config.from_user !== data.from_user) return false;
          if (config.to_user && config.to_user !== data.to_user) return false;
          return true;
        }

        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking trigger conditions:', error);
      return false;
    }
  }

  /**
   * Evaluate and execute matching workflows
   */
  static async evaluateWorkflows(
    triggerType: WorkflowTriggerType,
    triggerData: TriggerData
  ): Promise<void> {
    try {
      console.log(`🔍 Enhanced evaluation for trigger: ${triggerType}`);
      
      // Get all active workflows for this trigger type and project
      const workflows = await this.getActiveWorkflows(triggerType, triggerData.project_id);
      
      console.log(`📋 Found ${workflows.length} active workflows`);

      // Execute each matching workflow
      for (const workflow of workflows) {
        if (this.checkTriggerConditions(workflow, triggerData)) {
          console.log(`🚀 Executing enhanced workflow: ${workflow.name} (${workflow.id})`);
          await this.executeWorkflow(workflow.id, triggerData);
        } else {
          console.log(`⏭️ Skipping workflow (conditions not met): ${workflow.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in enhanced workflow evaluation:', error);
    }
  }
} 