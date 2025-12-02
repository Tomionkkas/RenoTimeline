import { WorkflowEngine } from './WorkflowEngine';
import { CalcRenoEventDetector } from '../services/CalcRenoEventDetector';
import { renotimelineClient } from '../../integrations/supabase/client';
import type { 
  TaskStatusChangedData, 
  TaskCreatedData, 
  TaskAssignedData,
  FileUploadedData,
  CustomFieldChangedData
} from '../types/workflow';

/**
 * Utility functions to trigger workflows from various parts of the application
 */
export class WorkflowTriggers {
  
  /**
   * Trigger workflows when a task status changes (e.g., in Kanban board)
   */
  static async onTaskStatusChanged(
    taskId: string,
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ): Promise<void> {
    const triggerData: TaskStatusChangedData = {
      task_id: taskId,
      project_id: projectId,
      from_status: fromStatus,
      to_status: toStatus,
      user_id: userId,
      timestamp: new Date().toISOString()
    };

    try {
      console.log('🔍 WorkflowTriggers.onTaskStatusChanged:', { taskId, projectId, fromStatus, toStatus, userId });
      
      // Trigger standard workflows
      await WorkflowEngine.evaluateWorkflows('task_status_changed', triggerData);

      // Trigger CalcReno notifications for task completion
      const completionStatuses = ['done', 'completed', 'ukończone', 'finished'];
      console.log('🔍 Checking completion status:', { toStatus, completionStatuses, isMatch: completionStatuses.includes(toStatus.toLowerCase()) });
      
      if (completionStatuses.includes(toStatus.toLowerCase())) {
        console.log('🎯 Task completed - triggering CalcReno notification');
        await this.notifyCalcRenoTaskCompleted(taskId, projectId);
      } else {
        console.log('🔍 Task not completed, skipping CalcReno notification');
      }

    } catch (error) {
      console.error('Error triggering task status changed workflows:', error);
    }
  }

  /**
   * Notify CalcReno when a task is completed
   */
  private static async notifyCalcRenoTaskCompleted(taskId: string, projectId: string): Promise<void> {
    try {
      // Fetch actual task details from the database
      const { data: task, error } = await renotimelineClient
        .from('tasks')
        .select('name, estimated_duration_days, description')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        console.error('Failed to fetch task details for CalcReno notification:', error);
        return;
      }

      // Use real task data instead of placeholders
      const taskTitle = task.name || 'Zadanie bez nazwy';
      const estimatedHours = task.estimated_duration_days || 8;
      const actualHours = estimatedHours; // For now, assume actual = estimated

      console.log('📧 Sending CalcReno notification for completed task:', {
        taskId,
        taskTitle,
        projectId,
        estimatedHours,
        actualHours
      });

      await CalcRenoEventDetector.onTaskCompleted(
        taskId,
        projectId,
        taskTitle,
        actualHours,
        estimatedHours
      );
    } catch (error) {
      console.error('Error notifying CalcReno of task completion:', error);
    }
  }

  /**
   * Trigger workflows when a new task is created
   */
  static async onTaskCreated(
    taskId: string,
    projectId: string,
    createdBy: string,
    assignedTo?: string
  ): Promise<void> {
    const triggerData: TaskCreatedData = {
      task_id: taskId,
      project_id: projectId,
      created_by: createdBy,
      assigned_to: assignedTo,
      timestamp: new Date().toISOString()
    };

    try {
      await WorkflowEngine.evaluateWorkflows('task_created', triggerData);
      
      // Trigger progress update for CalcReno
      await this.notifyCalcRenoProgressUpdate(projectId);
    } catch (error) {
      console.error('Error triggering task created workflows:', error);
    }
  }

  /**
   * Trigger workflows when a task is assigned to someone
   */
  static async onTaskAssigned(
    taskId: string,
    projectId: string,
    toUser: string,
    assignedBy: string,
    fromUser?: string
  ): Promise<void> {
    const triggerData: TaskAssignedData = {
      task_id: taskId,
      project_id: projectId,
      from_user: fromUser,
      to_user: toUser,
      assigned_by: assignedBy,
      timestamp: new Date().toISOString()
    };

    try {
      await WorkflowEngine.evaluateWorkflows('task_assigned', triggerData);
      
      // Fetch user name for prettier notification
      const { data: userProfile } = await renotimelineClient
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', toUser)
        .single();

      const userName = userProfile?.first_name && userProfile?.last_name
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile?.email || 'Nieznany użytkownik';

      // Fetch task title for prettier notification
      const { data: task } = await renotimelineClient
        .from('tasks')
        .select('name')
        .eq('id', taskId)
        .single();

      const taskTitle = task?.name || 'Zadanie bez nazwy';

      // Notify CalcReno about team assignment changes
      await CalcRenoEventDetector.onTeamUpdate(
        projectId,
        'role_changed',
        userName,
        toUser,
        `Zadanie "${taskTitle}" zostało przypisane do ${userName}`
      );
    } catch (error) {
      console.error('Error triggering task assigned workflows:', error);
    }
  }

  /**
   * Trigger workflows when a file is uploaded
   */
  static async onFileUploaded(
    fileId: string,
    projectId: string,
    fileName: string,
    fileType: string,
    uploadedBy: string
  ): Promise<void> {
    const triggerData: FileUploadedData = {
      file_id: fileId,
      project_id: projectId,
      file_name: fileName,
      file_type: fileType,
      uploaded_by: uploadedBy,
      timestamp: new Date().toISOString()
    };

    try {
      await WorkflowEngine.evaluateWorkflows('file_uploaded', triggerData);
    } catch (error) {
      console.error('Error triggering file uploaded workflows:', error);
    }
  }

  /**
   * Trigger workflows when a custom field value changes
   */
  static async onCustomFieldChanged(
    entityType: 'task' | 'project',
    entityId: string,
    projectId: string,
    fieldId: string,
    fromValue: any,
    toValue: any,
    changedBy: string
  ): Promise<void> {
    const triggerData: CustomFieldChangedData = {
      entity_type: entityType,
      entity_id: entityId,
      project_id: projectId,
      field_id: fieldId,
      from_value: fromValue,
      to_value: toValue,
      changed_by: changedBy,
      timestamp: new Date().toISOString()
    };

    try {
      await WorkflowEngine.evaluateWorkflows('custom_field_changed', triggerData);
    } catch (error) {
      console.error('Error triggering custom field changed workflows:', error);
    }
  }

  /**
   * Trigger project timeline updates for CalcReno
   */
  static async onProjectTimelineUpdated(
    projectId: string,
    changeType: 'delay' | 'acceleration' | 'rescheduled',
    details: {
      originalEndDate?: string;
      newEndDate?: string;
      delayDays?: number;
      reason?: string;
      affectedTaskIds?: string[];
    }
  ): Promise<void> {
    try {
      if (changeType === 'delay' && details.delayDays && details.originalEndDate && details.newEndDate) {
        await CalcRenoEventDetector.onTimelineDelay(
          projectId,
          details.delayDays,
          details.originalEndDate,
          details.newEndDate,
          details.reason || 'Unknown reason',
          details.affectedTaskIds || []
        );
      }
    } catch (error) {
      console.error('Error triggering timeline update notification:', error);
    }
  }

  /**
   * Trigger progress update notifications for CalcReno
   */
  static async notifyCalcRenoProgressUpdate(projectId: string): Promise<void> {
    try {
      // This would calculate actual progress from project data
      // For now, we'll use a placeholder calculation
      const progress = await this.calculateProjectProgress(projectId);
      
      await CalcRenoEventDetector.onProgressUpdate(
        projectId,
        progress.completionPercentage,
        progress.tasksCompletedToday
      );
    } catch (error) {
      console.error('Error sending progress update to CalcReno:', error);
    }
  }

  /**
   * Calculate project progress (placeholder implementation)
   */
  private static async calculateProjectProgress(projectId: string): Promise<{
    completionPercentage: number;
    tasksCompletedToday: number;
  }> {
    // This would be implemented with real database queries
    // For now, return placeholder data
    return {
      completionPercentage: Math.floor(Math.random() * 100),
      tasksCompletedToday: Math.floor(Math.random() * 5)
    };
  }

  /**
   * Trigger team member updates for CalcReno
   */
  static async onProjectTeamUpdated(
    projectId: string,
    updateType: 'member_added' | 'member_removed' | 'role_changed',
    memberName: string,
    memberId: string,
    details: string
  ): Promise<void> {
    try {
      await CalcRenoEventDetector.onTeamUpdate(
        projectId,
        updateType,
        memberName,
        memberId,
        details
      );
    } catch (error) {
      console.error('Error triggering team update notification:', error);
    }
  }

  /**
   * Trigger workflows manually for testing
   */
  static async triggerManual(
    triggerType: string,
    triggerData: any
  ): Promise<void> {
    try {
      await WorkflowEngine.evaluateWorkflows(triggerType as any, triggerData);
    } catch (error) {
      console.error('Error triggering manual workflow:', error);
    }
  }
} 