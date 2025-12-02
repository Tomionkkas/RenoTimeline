import { supabase } from '../integrations/supabase/client';

/**
 * BULLETPROOF WORKFLOW EXECUTION HOOK
 * No complex event bus, no singletons, just direct execution
 */

export interface TaskStatusChangedData {
  task_id: string;
  project_id: string;
  from_status: string;
  to_status: string;
  user_id: string;
  timestamp: string;
}

export const useWorkflowEvents = () => {
  
  /**
   * DIRECT workflow execution - no event bus needed
   */
  const emitTaskStatusChanged = async (
    taskId: string,
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ) => {
    console.log('🚀 [WORKFLOW-DIRECT] Starting direct workflow execution for task status change...');
    
    try {
      // Step 1: Find workflows that should trigger
      const { data: workflows, error: workflowError } = await supabase
        .from('workflow_definitions')
        .schema('renotimeline_schema')
        .select('*')
        .eq('project_id', projectId)
        .eq('trigger_type', 'task_status_changed')
        .eq('is_active', true);

      if (workflowError) {
        console.error('❌ [WORKFLOW-DIRECT] Error fetching workflows:', workflowError);
        return;
      }

      console.log(`🔍 [WORKFLOW-DIRECT] Found ${workflows?.length || 0} active workflows for project ${projectId}`);

      if (!workflows || workflows.length === 0) {
        console.log('ℹ️ [WORKFLOW-DIRECT] No active workflows found for this project and trigger type');
        return;
      }

      // Step 2: Execute each workflow directly
      for (const workflow of workflows) {
        console.log(`⚡ [WORKFLOW-DIRECT] Executing workflow: ${workflow.name} (${workflow.id})`);
        
        // Create workflow execution record
        const { data: execution, error: executionError } = await supabase
          .from('workflow_executions')
          .schema('renotimeline_schema')
          .insert({
            workflow_id: workflow.id,
            trigger_data: {
              task_id: taskId,
              project_id: projectId,
              from_status: fromStatus,
              to_status: toStatus,
              user_id: userId,
              timestamp: new Date().toISOString()
            },
            status: 'success',
            execution_time: new Date().toISOString()
          })
          .select()
          .single();

        if (executionError) {
          console.error(`❌ [WORKFLOW-DIRECT] Error creating execution for workflow ${workflow.id}:`, executionError);
          continue;
        }

        console.log(`✅ [WORKFLOW-DIRECT] Workflow execution created: ${execution.id}`);

        // Step 3: Execute workflow actions
        if (workflow.actions && Array.isArray(workflow.actions)) {
          for (const action of workflow.actions) {
            const actionObj = action as any;
            console.log(`🎯 [WORKFLOW-DIRECT] Executing action: ${actionObj.type}`);
            
            try {
              if (actionObj.type === 'send_notification') {
                await executeNotificationAction(actionObj, {
                  task_id: taskId,
                  project_id: projectId,
                  from_status: fromStatus,
                  to_status: toStatus,
                  user_id: userId,
                  workflow_name: workflow.name,
                  execution_id: execution.id
                });
              }
              // Add more action types as needed
              
            } catch (actionError) {
              console.error(`❌ [WORKFLOW-DIRECT] Error executing action ${actionObj.type}:`, actionError);
            }
          }
        }

        console.log(`🎉 [WORKFLOW-DIRECT] Workflow ${workflow.name} executed successfully!`);
      }

      console.log(`✅ [WORKFLOW-DIRECT] All workflows executed successfully!`);

    } catch (error) {
      console.error('💥 [WORKFLOW-DIRECT] Critical error in direct workflow execution:', error);
    }
  };

  /**
   * Execute notification action directly
   */
  const executeNotificationAction = async (action: any, context: any) => {
    console.log('📧 [WORKFLOW-DIRECT] Creating notification...');
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: context.user_id,
        project_id: context.project_id,
        type: 'workflow_executed',
        title: action.title || `Workflow "${context.workflow_name}" Executed`,
        message: action.message || `Task status changed from "${context.from_status}" to "${context.to_status}" and workflow was automatically executed!`,
        priority: action.priority || 'medium',
        metadata: {
          workflow_name: context.workflow_name,
          trigger_type: 'task_status_changed',
          execution_id: context.execution_id,
          task_id: context.task_id,
          direct_execution: true
        }
      });

    if (error) {
      console.error('❌ [WORKFLOW-DIRECT] Error creating notification:', error);
      throw error;
    }

    console.log('✅ [WORKFLOW-DIRECT] Notification created successfully');
  };

  return {
    emitTaskStatusChanged
  };
}; 