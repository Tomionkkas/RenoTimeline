import { supabase } from '../../integrations/supabase/client';
import { VariableSubstitution } from './VariableSubstitution';
import { EnhancedActionExecutors } from './EnhancedActionExecutors';
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionContext,
  WorkflowTriggerType,
  TriggerData,
  WorkflowAction,
  WorkflowExecutionStatus,
  TaskStatusChangedData,
  TaskCreatedData,
  TaskAssignedData,
} from '../types/workflow';

export class WorkflowEngine {
  /**
   * Main entry point for triggering workflows
   * Called whenever an event occurs that might trigger a workflow
   */
  static async evaluateWorkflows(
    triggerType: WorkflowTriggerType,
    triggerData: TriggerData
  ): Promise<void> {
    try {
      // Get all active workflows for this trigger type and project
      const workflows = await this.getActiveWorkflows(triggerType, triggerData.project_id);
      
      // Execute each matching workflow
      for (const workflow of workflows) {
        if (await this.checkConditions(workflow, triggerData)) {
          await this.executeWorkflow(workflow.id, triggerData);
        }
      }
    } catch (error) {
      console.error('Error evaluating workflows:', error);
    }
  }

  /**
   * Get all active workflows for a specific trigger type and project
   */
  private static async getActiveWorkflows(
    triggerType: WorkflowTriggerType,
    projectId: string
  ): Promise<WorkflowDefinition[]> {
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

    return (data as unknown as WorkflowDefinition[]) || [];
  }

  /**
   * Check if workflow conditions are met
   */
  private static async checkConditions(
    workflow: WorkflowDefinition,
    triggerData: TriggerData
  ): Promise<boolean> {
    try {
      // Check trigger-specific configuration
      if (!this.checkTriggerConfig(workflow, triggerData)) {
        return false;
      }

      // Check additional conditions
      if (!await this.checkAdditionalConditions(workflow, triggerData)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking workflow conditions:', error);
      return false;
    }
  }

  /**
   * Check trigger-specific configuration
   */
  private static checkTriggerConfig(
    workflow: WorkflowDefinition,
    triggerData: TriggerData
  ): boolean {
    const config = workflow.trigger_config as any;

    switch (workflow.trigger_type) {
      case 'task_status_changed': {
        const data = triggerData as TaskStatusChangedData;
        if (config.from_status && config.from_status !== data.from_status) return false;
        if (config.to_status && config.to_status !== data.to_status) return false;
        return true;
      }

      case 'task_created': {
        const data = triggerData as TaskCreatedData;
        if (config.assigned_to && config.assigned_to !== data.assigned_to) return false;
        return true;
      }

      case 'task_assigned': {
        const data = triggerData as TaskAssignedData;
        if (config.from_user && config.from_user !== data.from_user) return false;
        if (config.to_user && config.to_user !== data.to_user) return false;
        return true;
      }

      // Add more trigger types as needed
      default:
        return true;
    }
  }

  /**
   * Check additional workflow conditions
   */
  private static async checkAdditionalConditions(
    workflow: WorkflowDefinition,
    triggerData: TriggerData
  ): Promise<boolean> {
    const conditions = workflow.conditions;
    
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // For task-related triggers, get task data to check conditions
    const taskId = this.getTaskIdFromTriggerData(triggerData);
    if (taskId) {
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) return false;

      // Check priority condition
      if (conditions.priority && conditions.priority !== task.priority) {
        return false;
      }

      // Check assigned_to condition
      if (conditions.assigned_to && conditions.assigned_to !== task.assigned_to) {
        return false;
      }

      // Add more condition checks as needed
    }

    return true;
  }

  /**
   * Helper function to safely extract task_id from different trigger data types
   */
  private static getTaskIdFromTriggerData(triggerData: TriggerData): string | null {
    if ('task_id' in triggerData) {
      return triggerData.task_id;
    }
    return null;
  }

  /**
   * Helper function to safely extract user_id from different trigger data types
   */
  private static getUserIdFromTriggerData(triggerData: TriggerData): string | null {
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
    return null;
  }

  /**
   * Execute a specific workflow
   */
  static async executeWorkflow(
    workflowId: string,
    triggerData: TriggerData
  ): Promise<WorkflowExecution> {
    const executionStart = new Date().toISOString();
    let status: WorkflowExecutionStatus = 'success';
    let errorMessage: string | undefined;
    const executedActions: WorkflowAction[] = [];
    let workflow: any = null;

    try {
      // Get workflow definition
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflowData) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      workflow = workflowData;

      // Create execution context
      const context: WorkflowExecutionContext = {
        user_id: this.getUserIdFromTriggerData(triggerData) || workflow.created_by,
        project_id: triggerData.project_id,
        trigger_data: triggerData,
        workflow: workflow as WorkflowDefinition
      };

      // Execute each action in sequence
      for (const action of workflow.actions) {
        try {
          await this.executeAction(action, context);
          executedActions.push(action);
        } catch (actionError) {
          console.error(`Error executing action ${action.type}:`, actionError);
          status = 'partial';
          if (!errorMessage) {
            errorMessage = `Failed to execute action: ${action.type}`;
          }
        }
      }

    } catch (error) {
      console.error('Error executing workflow:', error);
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

    // Create notification for execution result (only if workflow was loaded)
    if (workflow) {
      if (status === 'success') {
        await this.createWorkflowNotification(workflow, execution, triggerData, 'workflow_executed');
      } else if (status === 'failed') {
        await this.createWorkflowNotification(workflow, execution, triggerData, 'workflow_failed', errorMessage);
      }
    }

    return execution;
  }

  /**
   * Execute a single workflow action using Enhanced Action Executors
   */
  private static async executeAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Use Enhanced Action Executors for all action types
    return EnhancedActionExecutors.executeAction(action, context);
  }

  /**
   * Execute update_task action
   */
  private static async executeUpdateTaskAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || this.getTaskIdFromTriggerData(context.trigger_data);
    if (!taskId) {
      throw new Error('No task ID available for update_task action');
    }

    const updateData: any = {};
    
    if (action.config.status) updateData.status = action.config.status;
    if (action.config.priority) updateData.priority = action.config.priority;
    if (action.config.assigned_to) updateData.assigned_to = action.config.assigned_to;
    if (action.config.due_date) updateData.due_date = action.config.due_date;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }
    }
  }

  /**
   * Execute create_task action
   */
  private static async executeCreateTaskAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskData = {
      title: action.config.title,
      description: action.config.description,
      project_id: action.config.project_id || context.project_id,
      assigned_to: action.config.assigned_to,
      priority: action.config.priority || 'medium' as const,
      due_date: action.config.due_date,
      created_by: context.user_id,
      status: 'todo' as const
    };

    const { error } = await supabase
      .from('tasks')
      .insert(taskData);

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Execute send_notification action
   */
  private static async executeSendNotificationAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Get recipient - either specified or task assignee
    let recipientId = action.config.recipient_id;
    
    if (!recipientId) {
      const taskId = this.getTaskIdFromTriggerData(context.trigger_data);
      if (taskId) {
        const { data: task } = await supabase
          .from('tasks')
          .select('assigned_to')
          .eq('id', taskId)
          .single();
        
        recipientId = task?.assigned_to;
      }
    }

    if (!recipientId) {
      throw new Error('No recipient specified for notification');
    }

    // Create real notification in the database
    const notificationData = {
      user_id: recipientId,
      project_id: context.project_id,
      type: 'automated_action' as const,
      title: action.config.title || 'Automatyczna akcja',
      message: action.config.message || 'Wykonano automatyczną akcję',
      task_id: this.getTaskIdFromTriggerData(context.trigger_data) || null,
      workflow_id: context.workflow.id,
      priority: action.config.priority || 'medium',
      metadata: {
        workflow_name: context.workflow.name,
        action_type: 'send_notification',
        triggered_by: action.config.triggered_by || 'workflow'
      }
    };

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create notification:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }

    console.log(`✅ Notification created in database:`, {
      id: notification?.id,
      user_id: recipientId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      workflow_name: context.workflow.name
    });
  }

  /**
   * Execute add_comment action
   */
  private static async executeAddCommentAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || this.getTaskIdFromTriggerData(context.trigger_data);
    if (!taskId) {
      throw new Error('No task ID available for add_comment action');
    }

    // This would integrate with a comments system when implemented
    console.log(`Adding comment to task ${taskId}: ${action.config.comment}`);
  }

  /**
   * Execute assign_to_user action
   */
  private static async executeAssignToUserAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || this.getTaskIdFromTriggerData(context.trigger_data);
    if (!taskId) {
      throw new Error('No task ID available for assign_to_user action');
    }

    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to: action.config.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }
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
      trigger_data: triggerData as any,
      executed_actions: executedActions as any,
      status,
      error_message: errorMessage,
      execution_time: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert(executionData)
      .select()
      .single();

    if (error) {
      console.error('Failed to log workflow execution:', error);
      // Return a mock execution if logging fails
      return {
        id: 'mock-id',
        workflow_id: workflowId,
        trigger_data: triggerData as any,
        executed_actions: executedActions,
        status,
        error_message: errorMessage,
        execution_time: new Date().toISOString()
      };
    }

    return data as WorkflowExecution;
  }

  /**
   * Create workflow notification
   */
  private static async createWorkflowNotification(
    workflow: any,
    execution: WorkflowExecution,
    triggerData: TriggerData,
    notificationType: 'workflow_executed' | 'workflow_failed' | 'automated_action',
    errorMessage?: string
  ): Promise<void> {
    try {
      const notificationData = {
        user_id: workflow.created_by,
        project_id: triggerData.project_id,
        type: notificationType,
        title: this.getNotificationTitle(notificationType, workflow.name),
        message: this.getNotificationMessage(notificationType, workflow.name, errorMessage),
        workflow_id: workflow.id,
        workflow_execution_id: execution.id,
        priority: notificationType === 'workflow_failed' ? 'high' : 'medium',
        metadata: {
          workflow_name: workflow.name,
          execution_status: execution.status,
          executed_actions: execution.executed_actions,
          error: errorMessage
        }
      };

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create workflow notification:', error);
      } else {
        console.log('✅ Workflow notification created:', {
          id: notification?.id,
          type: notificationType,
          title: notificationData.title,
          user_id: workflow.created_by,
          workflow_name: workflow.name
        });
      }
    } catch (error) {
      console.error('Failed to create workflow notification:', error);
    }
  }

  private static getNotificationTitle(
    type: 'workflow_executed' | 'workflow_failed' | 'automated_action',
    workflowName: string
  ): string {
    switch (type) {
      case 'workflow_executed':
        return `Przepływ "${workflowName}" wykonany`;
      case 'workflow_failed':
        return `Błąd przepływu "${workflowName}"`;
      case 'automated_action':
        return `Akcja automatyczna: ${workflowName}`;
      default:
        return 'Powiadomienie o automatyzacji';
    }
  }

  private static getNotificationMessage(
    type: 'workflow_executed' | 'workflow_failed' | 'automated_action',
    workflowName: string,
    errorMessage?: string
  ): string {
    switch (type) {
      case 'workflow_executed':
        return `Automatyzacja "${workflowName}" została pomyślnie wykonana.`;
      case 'workflow_failed':
        return `Wystąpił błąd podczas wykonywania automatyzacji "${workflowName}".${errorMessage ? ` Błąd: ${errorMessage}` : ''}`;
      case 'automated_action':
        return `Automatyczna akcja z przepływu "${workflowName}" została wykonana.`;
      default:
        return 'Powiadomienie o automatyzacji';
    }
  }

  /**
   * Trigger workflows manually (for testing or manual execution)
   */
  static async triggerWorkflow(
    triggerType: WorkflowTriggerType,
    triggerData: TriggerData
  ): Promise<void> {
    await this.evaluateWorkflows(triggerType, triggerData);
  }

  /**
   * Get execution history for a workflow
   */
  static async getExecutionHistory(
    workflowId?: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .order('execution_time', { ascending: false })
      .limit(limit);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }

    return (data as unknown as WorkflowExecution[]) || [];
  }

  /**
   * Execute update_custom_field action
   */
  private static async executeUpdateCustomFieldAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const entityId = action.config.entity_id || this.getTaskIdFromTriggerData(context.trigger_data) || (context.trigger_data as any).entity_id;
    if (!entityId) {
      throw new Error('No entity ID available for update_custom_field action');
    }

    // This would integrate with the custom fields system
    console.log(`Updating custom field ${action.config.field_id} to ${action.config.value} for ${action.config.entity_type} ${entityId}`);
  }

  /**
   * Execute move_to_project action
   */
  private static async executeMoveToProjectAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || this.getTaskIdFromTriggerData(context.trigger_data);
    if (!taskId) {
      throw new Error('No task ID available for move_to_project action');
    }

    const { error } = await supabase
      .from('tasks')
      .update({ 
        project_id: action.config.target_project_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to move task to project: ${error.message}`);
    }
  }

  /**
   * Execute update_project_status action
   */
  private static async executeUpdateProjectStatusAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const projectId = action.config.project_id || context.project_id;
    if (!projectId) {
      throw new Error('No project ID available for update_project_status action');
    }

    const { error } = await supabase
      .from('projects')
      .update({ 
        status: action.config.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }
} 