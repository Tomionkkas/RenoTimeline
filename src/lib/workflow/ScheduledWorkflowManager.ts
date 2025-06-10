import { supabase } from '../../integrations/supabase/client';
import { WorkflowEngine } from './WorkflowEngine';
import type { WorkflowTriggerType, TriggerData } from '../types/workflow';

export interface ScheduleConfig {
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'cron';
  schedule_time?: string; // HH:MM format for daily, or cron expression
  days_of_week?: number[]; // 0-6 for weekly (0 = Sunday)
  day_of_month?: number; // 1-31 for monthly
  cron_expression?: string; // For advanced scheduling
}

export interface DueDateConfig {
  days_before: number; // How many days before due date to trigger
  priority_filter?: string[]; // Only trigger for specific priorities
  time_of_day?: string; // HH:MM when to check (default: 09:00)
}

export class ScheduledWorkflowManager {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check and execute due date approaching workflows
   */
  static async processDueDateWorkflows(): Promise<void> {
    try {
      console.log('🔍 Processing due date workflows...');

      const workflows = await this.getCachedWorkflows('due_date_approaching');
      
      if (workflows.length === 0) {
        console.log('ℹ️ No due date approaching workflows found');
        return;
      }

      console.log(`📋 Processing ${workflows.length} due date workflows`);

      for (const workflow of workflows) {
        await this.processSingleDueDateWorkflow(workflow);
      }
    } catch (error) {
      console.error('Error processing due date workflows:', error);
      throw error;
    }
  }

  /**
   * Process a single due date workflow
   */
  private static async processSingleDueDateWorkflow(workflow: any): Promise<void> {
    try {
      const config: DueDateConfig = workflow.trigger_config || {};
      const daysBeforeThreshold = config.days_before || 1;
      const priorityFilter = config.priority_filter;
      const timeOfDay = config.time_of_day || '09:00';

      // Check if we should run this workflow now (based on time of day)
      if (!this.isTimeToCheckDueDates(timeOfDay)) {
        return;
      }

      // Calculate threshold date
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysBeforeThreshold);
      const thresholdDateStr = thresholdDate.toISOString().split('T')[0];

      console.log(`📅 Checking workflow "${workflow.name}" for tasks due on ${thresholdDateStr}`);

      // Build optimized query
      const tasks = await this.getTasksApproachingDueDate(
        workflow.project_id,
        thresholdDateStr,
        priorityFilter
      );

      if (tasks.length === 0) {
        console.log(`ℹ️ No tasks found for workflow "${workflow.name}"`);
        return;
      }

      console.log(`🎯 Found ${tasks.length} tasks for workflow "${workflow.name}"`);

      // Batch process tasks to avoid overwhelming the system
      await this.batchProcessTasks(workflow, tasks, daysBeforeThreshold);
    } catch (error) {
      console.error(`Error processing workflow ${workflow.name}:`, error);
    }
  }

  /**
   * Check if it's time to check due dates based on configured time
   */
  private static isTimeToCheckDueDates(timeOfDay: string): boolean {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    
    const checkTime = new Date(now);
    checkTime.setHours(hours, minutes, 0, 0);

    // Allow 15-minute window around the scheduled time
    const timeDiff = Math.abs(now.getTime() - checkTime.getTime());
    return timeDiff <= 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get tasks approaching due date with optimized query
   */
  private static async getTasksApproachingDueDate(
    projectId: string,
    thresholdDate: string,
    priorityFilter?: string[]
  ): Promise<any[]> {
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        priority,
        due_date,
        assigned_to,
        created_by,
        project_id
      `)
      .eq('project_id', projectId)
      .eq('due_date', thresholdDate)
      .neq('status', 'done');

    // Apply priority filter if specified
    if (priorityFilter && Array.isArray(priorityFilter) && priorityFilter.length > 0) {
      query = query.in('priority', priorityFilter as any);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Process tasks in batches to avoid system overload
   */
  private static async batchProcessTasks(
    workflow: any,
    tasks: any[],
    daysBeforeThreshold: number
  ): Promise<void> {
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(task => this.triggerWorkflowForTask(workflow, task, daysBeforeThreshold))
      );

      // Small delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Trigger workflow for a specific task
   */
  private static async triggerWorkflowForTask(
    workflow: any,
    task: any,
    daysBeforeThreshold: number
  ): Promise<void> {
    try {
      const triggerData: TriggerData = {
        type: 'due_date_approaching',
        project_id: workflow.project_id,
        task_id: task.id,
        user_id: task.assigned_to || task.created_by,
        metadata: {
          task_title: task.title,
          task_priority: task.priority,
          due_date: task.due_date,
          days_until_due: daysBeforeThreshold,
          assigned_to: task.assigned_to,
          created_by: task.created_by
        }
      };

      await WorkflowEngine.executeWorkflow(workflow.id, triggerData);
    } catch (error) {
      console.error(`Error triggering workflow for task ${task.id}:`, error);
    }
  }

  /**
   * Process scheduled workflows
   */
  static async processScheduledWorkflows(): Promise<void> {
    try {
      console.log('⏰ Processing scheduled workflows...');

      const workflows = await this.getCachedWorkflows('scheduled');
      
      if (workflows.length === 0) {
        console.log('ℹ️ No scheduled workflows found');
        return;
      }

      console.log(`📋 Processing ${workflows.length} scheduled workflows`);

      const now = new Date();

      for (const workflow of workflows) {
        if (await this.shouldExecuteScheduledWorkflow(workflow, now)) {
          await this.executeScheduledWorkflow(workflow, now);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled workflows:', error);
      throw error;
    }
  }

  /**
   * Determine if a scheduled workflow should execute
   */
  private static async shouldExecuteScheduledWorkflow(
    workflow: any,
    now: Date
  ): Promise<boolean> {
    const config: ScheduleConfig = workflow.trigger_config || {};
    const lastExecuted = workflow.last_executed;

    switch (config.schedule_type) {
      case 'daily':
        return this.shouldExecuteDaily(config, lastExecuted, now);
      
      case 'weekly':
        return this.shouldExecuteWeekly(config, lastExecuted, now);
      
      case 'monthly':
        return this.shouldExecuteMonthly(config, lastExecuted, now);
      
      case 'cron':
        return this.shouldExecuteCron(config, lastExecuted, now);
      
      default:
        console.warn(`Unknown schedule type: ${config.schedule_type}`);
        return false;
    }
  }

  /**
   * Check if daily scheduled workflow should execute
   */
  private static shouldExecuteDaily(
    config: ScheduleConfig,
    lastExecuted: string | null,
    now: Date
  ): boolean {
    if (!config.schedule_time) return false;

    const [hours, minutes] = config.schedule_time.split(':').map(Number);
    const scheduledToday = new Date(now);
    scheduledToday.setHours(hours, minutes, 0, 0);

    // Check if we're within execution window
    const timeDiff = Math.abs(now.getTime() - scheduledToday.getTime());
    if (timeDiff > 15 * 60 * 1000) return false; // 15-minute window

    // Check if already executed today
    if (lastExecuted) {
      const lastExecDate = new Date(lastExecuted);
      if (lastExecDate.toDateString() === now.toDateString()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if weekly scheduled workflow should execute
   */
  private static shouldExecuteWeekly(
    config: ScheduleConfig,
    lastExecuted: string | null,
    now: Date
  ): boolean {
    if (!config.days_of_week || !config.schedule_time) return false;

    const currentDayOfWeek = now.getDay();
    if (!config.days_of_week.includes(currentDayOfWeek)) return false;

    const [hours, minutes] = config.schedule_time.split(':').map(Number);
    const scheduledToday = new Date(now);
    scheduledToday.setHours(hours, minutes, 0, 0);

    // Check time window
    const timeDiff = Math.abs(now.getTime() - scheduledToday.getTime());
    if (timeDiff > 15 * 60 * 1000) return false;

    // Check if already executed this week
    if (lastExecuted) {
      const lastExecDate = new Date(lastExecuted);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      if (lastExecDate >= weekStart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if monthly scheduled workflow should execute
   */
  private static shouldExecuteMonthly(
    config: ScheduleConfig,
    lastExecuted: string | null,
    now: Date
  ): boolean {
    if (!config.day_of_month || !config.schedule_time) return false;

    if (now.getDate() !== config.day_of_month) return false;

    const [hours, minutes] = config.schedule_time.split(':').map(Number);
    const scheduledToday = new Date(now);
    scheduledToday.setHours(hours, minutes, 0, 0);

    // Check time window
    const timeDiff = Math.abs(now.getTime() - scheduledToday.getTime());
    if (timeDiff > 15 * 60 * 1000) return false;

    // Check if already executed this month
    if (lastExecuted) {
      const lastExecDate = new Date(lastExecuted);
      if (
        lastExecDate.getMonth() === now.getMonth() &&
        lastExecDate.getFullYear() === now.getFullYear()
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if cron scheduled workflow should execute
   */
  private static shouldExecuteCron(
    config: ScheduleConfig,
    lastExecuted: string | null,
    now: Date
  ): boolean {
    // Simplified cron implementation - would need a proper cron parser for production
    console.warn('Cron scheduling not fully implemented');
    return false;
  }

  /**
   * Execute a scheduled workflow
   */
  private static async executeScheduledWorkflow(workflow: any, now: Date): Promise<void> {
    try {
      console.log(`🚀 Executing scheduled workflow: ${workflow.name}`);

      const triggerData: TriggerData = {
        type: 'scheduled',
        project_id: workflow.project_id,
        user_id: workflow.created_by,
        metadata: {
          scheduled_time: now.toISOString(),
          workflow_name: workflow.name,
          schedule_config: workflow.trigger_config
        }
      };

      await WorkflowEngine.executeWorkflow(workflow.id, triggerData);

      // Update last execution timestamp
      await this.updateLastExecuted(workflow.id, now);

      console.log(`✅ Scheduled workflow executed: ${workflow.name}`);
    } catch (error) {
      console.error(`Error executing scheduled workflow ${workflow.name}:`, error);
    }
  }

  /**
   * Update last executed timestamp
   */
  private static async updateLastExecuted(workflowId: string, executionTime: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_definitions' as any)
        .update({ last_executed: executionTime.toISOString() })
        .eq('id', workflowId);

      if (error) {
        console.error(`Failed to update last_executed for workflow ${workflowId}:`, error);
      }
    } catch (error) {
      console.error(`Error updating last_executed: ${error}`);
    }
  }

  /**
   * Get workflows with caching for performance
   */
  private static async getCachedWorkflows(triggerType: WorkflowTriggerType): Promise<any[]> {
    const cacheKey = `workflows_${triggerType}`;
    const now = Date.now();

    // Check cache
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && now < expiry) {
        return this.cache.get(cacheKey);
      }
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('workflow_definitions' as any)
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    const workflows = data || [];

    // Update cache
    this.cache.set(cacheKey, workflows);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    return workflows;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 Workflow cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 