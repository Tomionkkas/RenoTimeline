import { WorkflowEngine } from './WorkflowEngine';
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
      await WorkflowEngine.evaluateWorkflows('task_status_changed', triggerData);
    } catch (error) {
      console.error('Error triggering task status changed workflows:', error);
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