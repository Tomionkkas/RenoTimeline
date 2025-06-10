import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ScheduledWorkflowCheck {
  id: string;
  project_id: string;
  trigger_config: any;
  due_date_threshold_days: number;
  priority_filter?: string[];
}

Deno.serve(async (req: Request) => {
  try {
    console.log('🕐 Workflow scheduler running at:', new Date().toISOString());

    // Check for tasks with approaching due dates
    await checkDueDateApproaching();
    
    // Check for scheduled workflows
    await checkScheduledWorkflows();
    
    // Create notifications for overdue tasks
    await checkOverdueTasks();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Workflow scheduler completed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('❌ Error in workflow scheduler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

/**
 * Check for tasks with due dates approaching and trigger relevant workflows
 */
async function checkDueDateApproaching(): Promise<void> {
  try {
    console.log('🔍 Checking for tasks with approaching due dates...');

    // Get all active "due_date_approaching" workflows
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('trigger_type', 'due_date_approaching')
      .eq('is_active', true);

    if (workflowError) {
      throw new Error(`Failed to fetch workflows: ${workflowError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log('ℹ️ No due date approaching workflows found');
      return;
    }

    console.log(`📋 Found ${workflows.length} due date approaching workflows`);

    // For each workflow, check for tasks that match the criteria
    for (const workflow of workflows) {
      await processWorkflowForDueDates(workflow);
    }
  } catch (error) {
    console.error('Error checking due date approaching:', error);
    throw error;
  }
}

/**
 * Process a single workflow for due date checks
 */
async function processWorkflowForDueDates(workflow: any): Promise<void> {
  try {
    const config = workflow.trigger_config || {};
    const daysBeforeThreshold = config.days_before || 1; // Default to 1 day
    const priorityFilter = config.priority_filter; // Optional priority filter

    // Calculate the threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysBeforeThreshold);
    const thresholdDateStr = thresholdDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`📅 Checking workflow "${workflow.name}" for tasks due on ${thresholdDateStr}`);

    // Build query for tasks approaching due date
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('project_id', workflow.project_id)
      .eq('due_date', thresholdDateStr)
      .neq('status', 'done'); // Don't trigger for completed tasks

    // Apply priority filter if specified
    if (priorityFilter && Array.isArray(priorityFilter) && priorityFilter.length > 0) {
      query = query.in('priority', priorityFilter);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      console.log(`ℹ️ No tasks found for workflow "${workflow.name}"`);
      return;
    }

    console.log(`🎯 Found ${tasks.length} tasks for workflow "${workflow.name}"`);

    // Trigger workflow for each matching task
    for (const task of tasks) {
      const triggerData = {
        type: 'due_date_approaching',
        project_id: workflow.project_id,
        task_id: task.id,
        task_title: task.title,
        task_priority: task.priority,
        due_date: task.due_date,
        days_until_due: daysBeforeThreshold,
        assigned_to: task.assigned_to,
        created_by: task.created_by
      };

      // Execute the workflow (simulate calling WorkflowEngine)
      await executeWorkflowTrigger(workflow.id, triggerData);
    }
  } catch (error) {
    console.error(`Error processing workflow ${workflow.name}:`, error);
  }
}

/**
 * Check for scheduled workflows that should run now
 */
async function checkScheduledWorkflows(): Promise<void> {
  try {
    console.log('⏰ Checking for scheduled workflows...');

    // Get all active "scheduled" workflows
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('trigger_type', 'scheduled')
      .eq('is_active', true);

    if (workflowError) {
      throw new Error(`Failed to fetch scheduled workflows: ${workflowError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log('ℹ️ No scheduled workflows found');
      return;
    }

    console.log(`📋 Found ${workflows.length} scheduled workflows`);

    const now = new Date();

    for (const workflow of workflows) {
      const config = workflow.trigger_config || {};
      
      if (await shouldExecuteScheduledWorkflow(workflow, config, now)) {
        const triggerData = {
          type: 'scheduled',
          project_id: workflow.project_id,
          scheduled_time: now.toISOString(),
          workflow_name: workflow.name
        };

        await executeWorkflowTrigger(workflow.id, triggerData);
      }
    }
  } catch (error) {
    console.error('Error checking scheduled workflows:', error);
    throw error;
  }
}

/**
 * Determine if a scheduled workflow should execute now
 */
async function shouldExecuteScheduledWorkflow(
  workflow: any, 
  config: any, 
  now: Date
): Promise<boolean> {
  try {
    const scheduleType = config.schedule_type; // 'daily', 'weekly', 'monthly', 'cron'
    const scheduleTime = config.schedule_time; // HH:MM format
    const lastExecuted = workflow.last_executed; // ISO timestamp

    // For now, implement simple daily scheduling
    if (scheduleType === 'daily' && scheduleTime) {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const scheduledToday = new Date(now);
      scheduledToday.setHours(hours, minutes, 0, 0);

      // Check if we're within 15 minutes of the scheduled time
      const timeDiff = Math.abs(now.getTime() - scheduledToday.getTime());
      const withinWindow = timeDiff <= 15 * 60 * 1000; // 15 minutes window

      if (!withinWindow) {
        return false;
      }

      // Check if already executed today
      if (lastExecuted) {
        const lastExecDate = new Date(lastExecuted);
        const isSameDay = lastExecDate.toDateString() === now.toDateString();
        if (isSameDay) {
          console.log(`⏭️ Workflow "${workflow.name}" already executed today`);
          return false;
        }
      }

      console.log(`✅ Workflow "${workflow.name}" should execute now`);
      return true;
    }

    // Add more schedule types (weekly, monthly, cron) as needed
    return false;
  } catch (error) {
    console.error(`Error checking schedule for workflow ${workflow.name}:`, error);
    return false;
  }
}

/**
 * Check for overdue tasks and create notifications
 */
async function checkOverdueTasks(): Promise<void> {
  try {
    console.log('⚠️ Checking for overdue tasks...');

    const today = new Date().toISOString().split('T')[0];

    // Get overdue tasks that don't have recent overdue notifications
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        *,
        projects!inner(id, name),
        profiles!tasks_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .lt('due_date', today)
      .neq('status', 'done');

    if (overdueError) {
      throw new Error(`Failed to fetch overdue tasks: ${overdueError.message}`);
    }

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log('ℹ️ No overdue tasks found');
      return;
    }

    console.log(`🚨 Found ${overdueTasks.length} overdue tasks`);

    // Create notifications for overdue tasks
    for (const task of overdueTasks) {
      await createOverdueNotification(task);
    }
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
}

/**
 * Create notification for overdue task
 */
async function createOverdueNotification(task: any): Promise<void> {
  try {
    // Check if we already sent an overdue notification today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('task_id', task.id)
      .eq('type', 'overdue')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .single();

    if (existingNotification) {
      console.log(`ℹ️ Overdue notification already sent today for task: ${task.title}`);
      return;
    }

    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const notificationData = {
      user_id: task.assigned_to || task.created_by,
      project_id: task.project_id,
      type: 'overdue',
      title: 'Zadanie przeterminowane',
      message: `Zadanie "${task.title}" jest przeterminowane o ${daysOverdue} dni`,
      task_id: task.id,
      priority: 'high',
      metadata: {
        days_overdue: daysOverdue,
        due_date: task.due_date,
        project_name: task.projects?.name
      }
    };

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (notificationError) {
      console.error(`Failed to create overdue notification for task ${task.id}:`, notificationError);
    } else {
      console.log(`📬 Created overdue notification for task: ${task.title}`);
    }
  } catch (error) {
    console.error(`Error creating overdue notification for task ${task.id}:`, error);
  }
}

/**
 * Execute workflow trigger (simulated call to WorkflowEngine)
 */
async function executeWorkflowTrigger(workflowId: string, triggerData: any): Promise<void> {
  try {
    console.log(`🚀 Executing workflow ${workflowId} with trigger data:`, triggerData);

    // Log the execution attempt
    const { error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        trigger_data: triggerData,
        status: 'success',
        executed_actions: [],
        execution_time: new Date().toISOString()
      });

    if (executionError) {
      console.error(`Failed to log workflow execution: ${executionError.message}`);
    }

    // Update last_executed timestamp for scheduled workflows
    if (triggerData.type === 'scheduled') {
      await supabase
        .from('workflow_definitions')
        .update({ last_executed: new Date().toISOString() })
        .eq('id', workflowId);
    }

    console.log(`✅ Workflow ${workflowId} triggered successfully`);
  } catch (error) {
    console.error(`Error executing workflow trigger: ${error}`);
    
    // Log failed execution
    await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        trigger_data: triggerData,
        status: 'failed',
        error_message: error.message,
        executed_actions: [],
        execution_time: new Date().toISOString()
      });
  }
} 