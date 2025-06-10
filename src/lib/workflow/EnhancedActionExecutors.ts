import { supabase } from '../../integrations/supabase/client';
import { VariableSubstitution } from './VariableSubstitution';
import type { 
  WorkflowExecutionContext, 
  WorkflowAction,
  AddCommentAction,
  UpdateCustomFieldAction,
  SendEmailAction,
  CreateCalendarEventAction
} from '../types/workflow';

/**
 * Enhanced action executors with variable substitution and advanced features
 */
export class EnhancedActionExecutors {
  /**
   * Main dispatcher for all enhanced action types
   */
  static async executeAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    switch (action.type) {
      case 'update_task':
        return this.executeUpdateTaskAction(action, context);
      
      case 'create_task':
        return this.executeCreateTaskAction(action, context);
      
      case 'send_notification':
        return this.executeSendNotificationAction(action, context);
      
      case 'add_comment':
        return this.executeAddCommentAction(action as any, context);
      
      case 'update_custom_field':
        return this.executeUpdateCustomFieldAction(action as any, context);
      
      case 'send_email':
        return this.executeSendEmailAction(action as any, context);
      
      case 'create_calendar_event':
        return this.executeCreateCalendarEventAction(action as any, context);
      
      case 'batch_update_tasks':
        return this.executeBatchUpdateTasksAction(action, context);
      
      default:
        console.warn(`❓ Unknown enhanced action type: ${action.type}`);
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  /**
   * Enhanced comment action with real database integration and variable substitution
   */
  static async executeAddCommentAction(
    action: AddCommentAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || 
      ('task_id' in context.trigger_data ? context.trigger_data.task_id : null);
    
    if (!taskId) {
      throw new Error('No task ID available for add_comment action');
    }

    // Process comment content with variable substitution
    const processedContent = await VariableSubstitution.substitute(
      action.config.comment,
      context
    );

    const commentData = {
      task_id: taskId,
      user_id: context.user_id,
      content: processedContent,
      is_system_comment: action.config.is_system_comment || true,
      workflow_id: context.workflow.id,
      metadata: {
        workflow_name: context.workflow.name,
        trigger_type: context.workflow.trigger_type,
        action_type: 'add_comment',
        original_template: action.config.comment
      }
    };

    const { error } = await supabase
      .from('task_comments')
      .insert(commentData);

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    console.log(`💬 Comment added to task ${taskId}: "${processedContent}"`);
  }

  /**
   * Enhanced custom field update with validation and variable substitution
   */
  static async executeUpdateCustomFieldAction(
    action: UpdateCustomFieldAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const entityId = action.config.entity_id || 
      ('task_id' in context.trigger_data ? context.trigger_data.task_id : null);
    const entityType = action.config.entity_type;
    
    if (!entityId) {
      throw new Error(`No ${entityType} ID available for custom field update`);
    }

    let fieldId = action.config.field_id;

    // If field_name is provided instead of field_id, resolve it
    if (!fieldId && (action.config as any).field_name) {
      fieldId = await this.resolveCustomFieldId(
        (action.config as any).field_name, 
        entityType, 
        context.project_id
      );
    }

    if (!fieldId) {
      throw new Error(`Custom field not found: ${(action.config as any).field_name || 'unknown'}`);
    }

    // Process value with variable substitution
    const processedValue = await VariableSubstitution.substitute(
      String(action.config.value),
      context
    );

    // Validate value if validation rules are specified
    if ((action.config as any).validation) {
      this.validateCustomFieldValue(processedValue, (action.config as any).validation);
    }

    // Upsert the custom field value
    const { error } = await supabase
      .from('custom_field_values')
      .upsert({
        field_definition_id: fieldId,
        entity_type: entityType,
        entity_id: entityId,
        value: processedValue,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update custom field: ${error.message}`);
    }

    console.log(`🔧 Custom field ${fieldId} updated to "${processedValue}" for ${entityType} ${entityId}`);
  }

  /**
   * Email notification action (placeholder for external service integration)
   */
  static async executeSendEmailAction(
    action: SendEmailAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const recipientEmail = await this.resolveEmailAddress(
      (action.config as any).recipient_id || (action.config as any).recipient_email,
      context
    );

    const emailData = {
      to: recipientEmail,
      subject: await VariableSubstitution.substitute(action.config.subject, context),
      content: await VariableSubstitution.substitute(action.config.content, context),
      workflow_id: context.workflow.id,
      template: (action.config as any).template
    };

    // For now, log the email (in production, this would call an edge function)
    console.log(`📧 Email would be sent to ${recipientEmail}:`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   Content: ${emailData.content}`);

    // Create email log entry in the database
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          metadata: {
            email_sent: {
              recipient: recipientEmail,
              subject: emailData.subject,
              content: emailData.content,
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq('workflow_id', context.workflow.id);

      if (error) {
        console.warn('Failed to log email:', error);
      }
    } catch (error) {
      console.warn('Failed to log email:', error);
    }
  }

  /**
   * Calendar event creation with dynamic date parsing
   */
  static async executeCreateCalendarEventAction(
    action: CreateCalendarEventAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const startDate = VariableSubstitution.parseDateExpression(
      action.config.start_date, 
      context
    );
    const endDate = action.config.end_date 
      ? VariableSubstitution.parseDateExpression(action.config.end_date, context)
      : startDate;

    const eventData = {
      title: await VariableSubstitution.substitute(action.config.title, context),
      description: action.config.description 
        ? await VariableSubstitution.substitute(action.config.description, context)
        : null,
      start_date: startDate,
      end_date: endDate,
      all_day: action.config.all_day || false,
      project_id: (action.config as any).project_id || context.project_id,
      created_by: context.user_id,
      metadata: {
        created_by_workflow: true,
        workflow_id: context.workflow.id,
        workflow_name: context.workflow.name,
        trigger_data: context.trigger_data
      }
    };

    // Check if calendar_events table exists, if not, just log
    try {
      const { data: event, error } = await supabase
        .from('calendar_events' as any)
        .insert(eventData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create calendar event: ${error.message}`);
      }

      console.log(`📅 Calendar event created: "${eventData.title}" on ${new Date(startDate).toLocaleDateString()}`);

      // Set up reminders if specified
      if ((action.config as any).reminder?.enabled && event) {
        await this.createCalendarReminder(
          event.id,
          (action.config as any).reminder.minutes_before
        );
      }

      // Invite attendees if specified
      if ((action.config as any).attendees?.length && event) {
        await this.inviteAttendeesToEvent(event.id, (action.config as any).attendees);
      }
    } catch (error) {
      // If calendar system isn't set up yet, just log
      console.log(`📅 Calendar event would be created: "${eventData.title}" on ${new Date(startDate).toLocaleDateString()}`);
      console.log('Calendar system integration pending...');
    }
  }

  /**
   * Batch task update operation
   */
  static async executeBatchUpdateTasksAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const filter = action.config.filter;
    const updates = action.config.updates;
    const limit = action.config.limit || 50; // Safety limit

    // Build query based on filter
    let query = supabase
      .from('tasks')
      .select('id, title')
      .eq('project_id', filter.project_id || context.project_id)
      .limit(limit);

    if (filter.status?.length) {
      query = query.in('status', filter.status);
    }

    if (filter.assigned_to) {
      query = query.eq('assigned_to', filter.assigned_to);
    }

    if (filter.priority?.length) {
      query = query.in('priority', filter.priority);
    }

    const { data: tasks, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch tasks for batch update: ${fetchError.message}`);
    }

    if (!tasks?.length) {
      console.log('No tasks found matching batch update criteria');
      return;
    }

    // Prepare update data with variable substitution
    const updateData: any = {};
    if (updates.status) {
      updateData.status = await VariableSubstitution.substitute(updates.status, context);
    }
    if (updates.priority) {
      updateData.priority = await VariableSubstitution.substitute(updates.priority, context);
    }
    if (updates.assigned_to) {
      updateData.assigned_to = await VariableSubstitution.substitute(updates.assigned_to, context);
    }

    updateData.updated_at = new Date().toISOString();

    // Execute batch update
    const taskIds = tasks.map(task => task.id);
    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .in('id', taskIds);

    if (updateError) {
      throw new Error(`Failed to execute batch update: ${updateError.message}`);
    }

    console.log(`📦 Batch updated ${tasks.length} tasks:`, {
      task_titles: tasks.map(t => t.title),
      updates: updateData
    });
  }

  /**
   * Helper: Resolve custom field ID from name
   */
  private static async resolveCustomFieldId(
    fieldName: string,
    entityType: 'task' | 'project',
    projectId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('id')
        .eq('name', fieldName)
        .eq('entity_type', entityType)
        .eq('project_id', projectId)
        .single();

      if (error || !data) {
        console.warn(`Custom field "${fieldName}" not found`);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error resolving custom field ID:', error);
      return null;
    }
  }

  /**
   * Helper: Validate custom field value
   */
  private static validateCustomFieldValue(value: any, validation: any): void {
    if (validation.required && (!value || value.toString().trim() === '')) {
      throw new Error('Custom field value is required but empty');
    }

    if (validation.type_check) {
      // Add type validation logic here
    }

    if (validation.range) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        if (validation.range.min !== undefined && numValue < validation.range.min) {
          throw new Error(`Value ${value} is below minimum ${validation.range.min}`);
        }
        if (validation.range.max !== undefined && numValue > validation.range.max) {
          throw new Error(`Value ${value} is above maximum ${validation.range.max}`);
        }
      }
    }
  }

  /**
   * Helper: Resolve email address from user ID or direct email
   */
  private static async resolveEmailAddress(
    recipientIdOrEmail: string,
    context: WorkflowExecutionContext
  ): Promise<string> {
    // If it looks like an email, use it directly
    if (recipientIdOrEmail.includes('@')) {
      return recipientIdOrEmail;
    }

    // Otherwise, treat it as a user ID and fetch email
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', recipientIdOrEmail)
        .single();

      if (error || !user) {
        throw new Error(`User not found: ${recipientIdOrEmail}`);
      }

      return user.email;
    } catch (error) {
      console.error('Error resolving email address:', error);
      throw new Error(`Failed to resolve email for: ${recipientIdOrEmail}`);
    }
  }

  /**
   * Helper: Create calendar reminder (placeholder)
   */
  private static async createCalendarReminder(
    eventId: string,
    minutesBefore: number
  ): Promise<void> {
    console.log(`⏰ Reminder would be set for event ${eventId}: ${minutesBefore} minutes before`);
    // Implementation would go here when reminder system is built
  }

  /**
   * Helper: Invite attendees to event (placeholder)
   */
  private static async inviteAttendeesToEvent(
    eventId: string,
    attendees: string[]
  ): Promise<void> {
    console.log(`👥 Attendees would be invited to event ${eventId}:`, attendees);
    // Implementation would go here when invitation system is built
  }

  /**
   * Enhanced task creation with variable substitution
   */
  static async executeCreateTaskAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskData = {
      title: action.config.title 
        ? await VariableSubstitution.substitute(action.config.title, context)
        : 'New Task',
      description: action.config.description 
        ? await VariableSubstitution.substitute(action.config.description, context)
        : null,
      project_id: action.config.project_id || context.project_id,
      assigned_to: action.config.assigned_to 
        ? await VariableSubstitution.substitute(action.config.assigned_to, context)
        : null,
      priority: action.config.priority || 'medium',
      due_date: action.config.due_date 
        ? VariableSubstitution.parseDateExpression(action.config.due_date, context)
        : null,
      created_by: context.user_id,
      status: action.config.status || 'todo'
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    console.log(`➕ Enhanced task created: "${taskData.title}" (${task?.id})`);
  }

  /**
   * Enhanced task update with more options
   */
  static async executeUpdateTaskAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const taskId = action.config.task_id || 
      ('task_id' in context.trigger_data ? context.trigger_data.task_id : null);
    
    if (!taskId) {
      throw new Error('No task ID available for update_task action');
    }

    const updateData: any = {};
    
    // Process each field with variable substitution
    if (action.config.status) {
      updateData.status = await VariableSubstitution.substitute(action.config.status, context);
    }
    if (action.config.priority) {
      updateData.priority = await VariableSubstitution.substitute(action.config.priority, context);
    }
    if (action.config.assigned_to) {
      updateData.assigned_to = await VariableSubstitution.substitute(action.config.assigned_to, context);
    }
    if (action.config.due_date) {
      updateData.due_date = VariableSubstitution.parseDateExpression(action.config.due_date, context);
    }
    if (action.config.title) {
      updateData.title = await VariableSubstitution.substitute(action.config.title, context);
    }
    if (action.config.description) {
      updateData.description = await VariableSubstitution.substitute(action.config.description, context);
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }

      console.log(`✅ Task ${taskId} updated:`, updateData);
    }
  }

  /**
   * Enhanced notification with better targeting and content
   */
  static async executeSendNotificationAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Determine recipient
    let recipientId = action.config.recipient_id;
    
    if (!recipientId && 'task_id' in context.trigger_data) {
      const { data: task } = await supabase
        .from('tasks')
        .select('assigned_to, created_by')
        .eq('id', context.trigger_data.task_id)
        .single();
      
      recipientId = task?.assigned_to || task?.created_by;
    }

    if (!recipientId) {
      throw new Error('No recipient specified for notification');
    }

    // Process message with variable substitution
    const processedMessage = await VariableSubstitution.substitute(
      action.config.message,
      context
    );

    const processedTitle = action.config.title 
      ? await VariableSubstitution.substitute(action.config.title, context)
      : 'Automatyczna akcja workflow';

    // Create notification with enhanced metadata
    const notificationData = {
      user_id: recipientId,
      project_id: context.project_id,
      type: 'automated_action',
      title: processedTitle,
      message: processedMessage,
      task_id: ('task_id' in context.trigger_data ? context.trigger_data.task_id : null),
      priority: action.config.priority || 'medium',
      metadata: {
        workflow_id: context.workflow.id,
        workflow_name: context.workflow.name,
        action_type: 'send_notification',
        trigger_type: context.workflow.trigger_type,
        original_template: action.config.message,
        created_by_workflow: true
      }
    };

    const { error } = await supabase
      .from('notifications' as any)
      .insert(notificationData);

    if (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }

    console.log(`🔔 Enhanced notification sent to ${recipientId}: "${processedMessage}"`);
  }
} 