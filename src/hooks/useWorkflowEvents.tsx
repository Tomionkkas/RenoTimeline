import { useCallback } from 'react';
import { WorkflowEventBus } from '../lib/workflow/WorkflowEventBus';
import type { WorkflowTriggerType, TriggerData } from '../lib/types/workflow';

/**
 * Hook for emitting workflow events from React components
 * Provides easy access to the workflow event system
 */
export function useWorkflowEvents() {
  
  /**
   * Emit a workflow event
   */
  const emitEvent = useCallback(async (
    eventType: WorkflowTriggerType,
    eventData: TriggerData
  ): Promise<void> => {
    try {
      await WorkflowEventBus.emit(eventType, eventData);
    } catch (error) {
      console.error(`Failed to emit workflow event ${eventType}:`, error);
      // Don't throw - we don't want UI operations to fail due to workflow errors
    }
  }, []);

  /**
   * Emit task status changed event
   */
  const emitTaskStatusChanged = useCallback(async (
    taskId: string,
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId?: string
  ): Promise<void> => {
    await emitEvent('task_status_changed', {
      type: 'task_status_changed',
      task_id: taskId,
      project_id: projectId,
      from_status: fromStatus,
      to_status: toStatus,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit task created event
   */
  const emitTaskCreated = useCallback(async (
    taskId: string,
    projectId: string,
    createdBy: string,
    assignedTo?: string
  ): Promise<void> => {
    await emitEvent('task_created', {
      type: 'task_created',
      task_id: taskId,
      project_id: projectId,
      created_by: createdBy,
      assigned_to: assignedTo,
      user_id: createdBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit task assigned event
   */
  const emitTaskAssigned = useCallback(async (
    taskId: string,
    projectId: string,
    fromUser: string | null,
    toUser: string,
    assignedBy: string
  ): Promise<void> => {
    await emitEvent('task_assigned', {
      type: 'task_assigned',
      task_id: taskId,
      project_id: projectId,
      from_user: fromUser,
      to_user: toUser,
      assigned_by: assignedBy,
      user_id: assignedBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit file uploaded event
   */
  const emitFileUploaded = useCallback(async (
    fileId: string,
    projectId: string,
    fileName: string,
    fileType: string,
    uploadedBy: string
  ): Promise<void> => {
    await emitEvent('file_uploaded', {
      type: 'file_uploaded',
      file_id: fileId,
      project_id: projectId,
      file_name: fileName,
      file_type: fileType,
      uploaded_by: uploadedBy,
      user_id: uploadedBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit custom field changed event
   */
  const emitCustomFieldChanged = useCallback(async (
    entityId: string,
    entityType: 'task' | 'project',
    projectId: string,
    fieldId: string,
    oldValue: any,
    newValue: any,
    changedBy: string
  ): Promise<void> => {
    await emitEvent('custom_field_changed', {
      type: 'custom_field_changed',
      entity_id: entityId,
      entity_type: entityType,
      project_id: projectId,
      field_id: fieldId,
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      user_id: changedBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit project status changed event
   */
  const emitProjectStatusChanged = useCallback(async (
    projectId: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string
  ): Promise<void> => {
    await emitEvent('project_status_changed', {
      type: 'project_status_changed',
      project_id: projectId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      user_id: changedBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  /**
   * Emit team member added event
   */
  const emitTeamMemberAdded = useCallback(async (
    projectId: string,
    memberId: string,
    role: string,
    addedBy: string
  ): Promise<void> => {
    await emitEvent('team_member_added', {
      type: 'team_member_added',
      project_id: projectId,
      member_id: memberId,
      role: role,
      added_by: addedBy,
      user_id: addedBy,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  return {
    // Generic event emitter
    emitEvent,
    
    // Specific event emitters
    emitTaskStatusChanged,
    emitTaskCreated,
    emitTaskAssigned,
    emitFileUploaded,
    emitCustomFieldChanged,
    emitProjectStatusChanged,
    emitTeamMemberAdded
  };
} 