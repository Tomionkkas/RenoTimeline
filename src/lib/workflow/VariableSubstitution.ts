import { supabase } from '../../integrations/supabase/client';
import type { WorkflowExecutionContext, TriggerData } from '../types/workflow';

/**
 * Variable substitution engine for workflow actions
 * Replaces placeholders like {{task.title}} with actual values
 */
export class VariableSubstitution {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Main substitution method - replaces all variables in a template
   */
  public static async substitute(
    template: string,
    context: WorkflowExecutionContext
  ): Promise<string> {
    if (!template || typeof template !== 'string') {
      return template;
    }

    let result = template;

    try {
      // Task variables
      if (this.hasTaskId(context.trigger_data)) {
        result = await this.substituteTaskVariables(result, context.trigger_data.task_id);
      }

      // Project variables
      result = await this.substituteProjectVariables(result, context.project_id);

      // User variables
      result = await this.substituteUserVariables(result, context);

      // Date/time variables
      result = this.substituteDateTimeVariables(result);

      // Custom field variables
      if (this.hasTaskId(context.trigger_data)) {
        result = await this.substituteCustomFieldVariables(result, context);
      }

      // Trigger-specific variables
      result = this.substituteTriggerVariables(result, context.trigger_data);

      console.log(`🔀 Variable substitution completed: "${template}" → "${result}"`);
      return result;

    } catch (error) {
      console.error('Error in variable substitution:', error);
      return template; // Return original template if substitution fails
    }
  }

  /**
   * Check if trigger data contains task_id
   */
  private static hasTaskId(triggerData: TriggerData): triggerData is TriggerData & { task_id: string } {
    return 'task_id' in triggerData && !!triggerData.task_id;
  }

  /**
   * Substitute task-related variables
   */
  private static async substituteTaskVariables(
    template: string,
    taskId: string
  ): Promise<string> {
    const taskData = await this.getTaskData(taskId);
    if (!taskData) return template;

    let result = template;

    // Basic task properties
    result = result.replace(/\{\{task\.id\}\}/g, taskData.id || '');
    result = result.replace(/\{\{task\.title\}\}/g, taskData.title || '');
    result = result.replace(/\{\{task\.description\}\}/g, taskData.description || '');
    result = result.replace(/\{\{task\.status\}\}/g, taskData.status || '');
    result = result.replace(/\{\{task\.priority\}\}/g, taskData.priority || '');
    result = result.replace(/\{\{task\.due_date\}\}/g, 
      taskData.due_date ? new Date(taskData.due_date).toLocaleDateString('pl-PL') : '');

    // Assigned user name (requires additional lookup)
    if (result.includes('{{task.assigned_to_name}}') && taskData.assigned_to) {
      const assignedUser = await this.getUserData(taskData.assigned_to);
      result = result.replace(/\{\{task\.assigned_to_name\}\}/g, 
        assignedUser?.display_name || assignedUser?.email || 'Nieznany użytkownik');
    }

    // Created user name
    if (result.includes('{{task.created_by_name}}') && taskData.created_by) {
      const createdUser = await this.getUserData(taskData.created_by);
      result = result.replace(/\{\{task\.created_by_name\}\}/g,
        createdUser?.display_name || createdUser?.email || 'Nieznany użytkownik');
    }

    // Time calculations
    if (result.includes('{{task.due_in_days}}') && taskData.due_date) {
      const dueDate = new Date(taskData.due_date);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      result = result.replace(/\{\{task\.due_in_days\}\}/g, diffDays.toString());
    }

    return result;
  }

  /**
   * Substitute project-related variables
   */
  private static async substituteProjectVariables(
    template: string,
    projectId: string
  ): Promise<string> {
    const projectData = await this.getProjectData(projectId);
    if (!projectData) return template;

    let result = template;
    result = result.replace(/\{\{project\.id\}\}/g, projectData.id || '');
    result = result.replace(/\{\{project\.name\}\}/g, projectData.name || '');
    result = result.replace(/\{\{project\.description\}\}/g, projectData.description || '');
    result = result.replace(/\{\{project\.status\}\}/g, projectData.status || '');

    return result;
  }

  /**
   * Substitute user-related variables
   */
  private static async substituteUserVariables(
    template: string,
    context: WorkflowExecutionContext
  ): Promise<string> {
    const userData = await this.getUserData(context.user_id);
    if (!userData) return template;

    let result = template;
    result = result.replace(/\{\{user\.name\}\}/g, 
      userData.display_name || userData.email || 'Nieznany użytkownik');
    result = result.replace(/\{\{user\.email\}\}/g, userData.email || '');

    // Trigger user (person who caused the workflow to trigger)
    if ('user_id' in context.trigger_data && context.trigger_data.user_id) {
      const triggerUser = await this.getUserData(context.trigger_data.user_id);
      if (triggerUser) {
        result = result.replace(/\{\{trigger_user\.name\}\}/g,
          triggerUser.display_name || triggerUser.email || 'Nieznany użytkownik');
        result = result.replace(/\{\{trigger_user\.email\}\}/g, triggerUser.email || '');
      }
    }

    return result;
  }

  /**
   * Substitute date/time variables
   */
  private static substituteDateTimeVariables(template: string): string {
    const now = new Date();
    let result = template;

    result = result.replace(/\{\{current_date\}\}/g, 
      now.toLocaleDateString('pl-PL'));
    result = result.replace(/\{\{current_time\}\}/g, 
      now.toLocaleTimeString('pl-PL'));
    result = result.replace(/\{\{current_timestamp\}\}/g, 
      now.toLocaleString('pl-PL'));
    result = result.replace(/\{\{current_iso_date\}\}/g, 
      now.toISOString().split('T')[0]);

    return result;
  }

  /**
   * Substitute custom field variables
   */
  private static async substituteCustomFieldVariables(
    template: string,
    context: WorkflowExecutionContext
  ): Promise<string> {
    const customFieldMatches = template.match(/\{\{custom_field\.(\w+)\}\}/g);
    if (!customFieldMatches) return template;

    let result = template;
    const taskId = 'task_id' in context.trigger_data ? context.trigger_data.task_id : null;

    if (!taskId) return result;

    for (const match of customFieldMatches) {
      const fieldName = match.replace(/\{\{custom_field\.(\w+)\}\}/g, '$1');
      const fieldValue = await this.getCustomFieldValue(taskId, fieldName, 'task', context.project_id);
      result = result.replace(new RegExp(`\\{\\{custom_field\\.${fieldName}\\}\\}`, 'g'), 
        fieldValue || '');
    }

    return result;
  }

  /**
   * Substitute trigger-specific variables
   */
  private static substituteTriggerVariables(
    template: string,
    triggerData: TriggerData
  ): string {
    let result = template;

    // Status change specific
    if ('from_status' in triggerData && 'to_status' in triggerData) {
      result = result.replace(/\{\{trigger\.from_status\}\}/g, triggerData.from_status || '');
      result = result.replace(/\{\{trigger\.to_status\}\}/g, triggerData.to_status || '');
    }

    // File upload specific
    if ('file_name' in triggerData) {
      result = result.replace(/\{\{trigger\.file_name\}\}/g, triggerData.file_name || '');
      result = result.replace(/\{\{trigger\.file_type\}\}/g, triggerData.file_type || '');
    }

    // Assignment specific
    if ('from_user' in triggerData && 'to_user' in triggerData) {
      result = result.replace(/\{\{trigger\.from_user\}\}/g, triggerData.from_user || '');
      result = result.replace(/\{\{trigger\.to_user\}\}/g, triggerData.to_user || '');
    }

    return result;
  }

  /**
   * Get task data with caching
   */
  private static async getTaskData(taskId: string): Promise<any> {
    const cacheKey = `task:${taskId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task data:', error);
        return null;
      }

      this.setCacheValue(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching task data:', error);
      return null;
    }
  }

  /**
   * Get project data with caching
   */
  private static async getProjectData(projectId: string): Promise<any> {
    const cacheKey = `project:${projectId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project data:', error);
        return null;
      }

      this.setCacheValue(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching project data:', error);
      return null;
    }
  }

  /**
   * Get user data with caching
   */
  private static async getUserData(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      this.setCacheValue(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Get custom field value
   */
  private static async getCustomFieldValue(
    entityId: string,
    fieldName: string,
    entityType: 'task' | 'project',
    projectId: string
  ): Promise<string | null> {
    try {
      // First get field definition by name
      const { data: fieldDef, error: fieldError } = await supabase
        .from('custom_field_definitions')
        .select('id')
        .eq('name', fieldName)
        .eq('entity_type', entityType)
        .eq('project_id', projectId)
        .single();

      if (fieldError || !fieldDef) {
        console.warn(`Custom field "${fieldName}" not found`);
        return null;
      }

      // Then get the value
      const { data: fieldValue, error: valueError } = await supabase
        .from('custom_field_values')
        .select('value')
        .eq('field_definition_id', fieldDef.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .single();

      if (valueError || !fieldValue) {
        return null;
      }

      return String(fieldValue.value);
    } catch (error) {
      console.error('Error fetching custom field value:', error);
      return null;
    }
  }

  /**
   * Cache management utilities
   */
  private static isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return this.cache.has(key);
  }

  private static setCacheValue(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  public static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Parse date expressions like "+3 days", "tomorrow", etc.
   */
  public static parseDateExpression(expression: string, context?: WorkflowExecutionContext): string {
    const now = new Date();
    
    // Handle relative dates
    if (expression.startsWith('+') || expression.startsWith('-')) {
      const match = expression.match(/([+-])(\d+)\s*(day|days|hour|hours|week|weeks)/i);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const amount = parseInt(match[2]) * sign;
        const unit = match[3].toLowerCase();
        
        switch (unit) {
          case 'day':
          case 'days':
            now.setDate(now.getDate() + amount);
            break;
          case 'hour':
          case 'hours':
            now.setHours(now.getHours() + amount);
            break;
          case 'week':
          case 'weeks':
            now.setDate(now.getDate() + (amount * 7));
            break;
        }
        
        return now.toISOString();
      }
    }

    // Handle special keywords
    switch (expression.toLowerCase()) {
      case 'today':
        return now.toISOString();
      case 'tomorrow':
        now.setDate(now.getDate() + 1);
        return now.toISOString();
      case 'yesterday':
        now.setDate(now.getDate() - 1);
        return now.toISOString();
      default:
        // Try to parse as ISO date
        try {
          return new Date(expression).toISOString();
        } catch {
          return now.toISOString();
        }
    }
  }

  /**
   * Get all available variables for documentation/help
   */
  public static getAvailableVariables(): Record<string, string[]> {
    return {
      'Task Variables': [
        '{{task.id}}',
        '{{task.title}}',
        '{{task.description}}',
        '{{task.status}}',
        '{{task.priority}}',
        '{{task.due_date}}',
        '{{task.assigned_to_name}}',
        '{{task.created_by_name}}',
        '{{task.due_in_days}}'
      ],
      'Project Variables': [
        '{{project.id}}',
        '{{project.name}}',
        '{{project.description}}',
        '{{project.status}}'
      ],
      'User Variables': [
        '{{user.name}}',
        '{{user.email}}',
        '{{trigger_user.name}}',
        '{{trigger_user.email}}'
      ],
      'Date/Time Variables': [
        '{{current_date}}',
        '{{current_time}}',
        '{{current_timestamp}}',
        '{{current_iso_date}}'
      ],
      'Custom Field Variables': [
        '{{custom_field.field_name}}'
      ],
      'Trigger Variables': [
        '{{trigger.from_status}}',
        '{{trigger.to_status}}',
        '{{trigger.file_name}}',
        '{{trigger.file_type}}',
        '{{trigger.from_user}}',
        '{{trigger.to_user}}'
      ]
    };
  }
} 