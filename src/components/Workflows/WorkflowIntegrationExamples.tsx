import React from 'react';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';
import { TaskAssignmentHelper } from '../Team/TaskAssignmentHelper';
import { useCustomFieldWorkflowTracking } from '../ui/CustomFieldWorkflowWrapper';

/**
 * Examples and utilities for integrating workflows with existing components
 */

// Example 1: Task Status Change Integration (already implemented in KanbanBoard)
export const handleTaskStatusChange = async (
  taskId: string,
  projectId: string,
  fromStatus: string,
  toStatus: string,
  userId: string
) => {
  try {
    await WorkflowTriggers.onTaskStatusChanged(
      taskId,
      projectId,
      fromStatus,
      toStatus,
      userId
    );
  } catch (error) {
    console.error('Failed to trigger status change workflows:', error);
  }
};

// Example 2: File Upload Integration (already implemented in FileManager)
export const handleFileUpload = async (
  fileId: string,
  projectId: string,
  fileName: string,
  fileType: string,
  uploadedBy: string
) => {
  try {
    await WorkflowTriggers.onFileUploaded(
      fileId,
      projectId,
      fileName,
      fileType,
      uploadedBy
    );
  } catch (error) {
    console.error('Failed to trigger file upload workflows:', error);
  }
};

// Example 3: Task Assignment Integration
export const handleTaskAssignment = async (
  taskId: string,
  projectId: string,
  fromUserId: string | undefined,
  toUserId: string,
  assignedBy: string
) => {
  try {
    await TaskAssignmentHelper.assignTask(
      taskId,
      projectId,
      toUserId,
      assignedBy,
      fromUserId
    );
  } catch (error) {
    console.error('Failed to trigger assignment workflows:', error);
  }
};

// Example 4: Custom Field Change Integration Component
interface WorkflowEnabledFormProps {
  entityType: 'task' | 'project';
  entityId: string;
  projectId: string;
  children: React.ReactNode;
}

export const WorkflowEnabledForm: React.FC<WorkflowEnabledFormProps> = ({
  entityType,
  entityId,
  projectId,
  children
}) => {
  const { trackFieldChange, initializeTracking } = useCustomFieldWorkflowTracking(
    entityType,
    entityId,
    projectId
  );

  // Example usage in a form component:
  // const handleCustomFieldChange = (fieldId: string, newValue: any, oldValue?: any) => {
  //   trackFieldChange(fieldId, newValue, oldValue);
  // };

  return (
    <div>
      {children}
      {/* The workflow tracking is handled by the hook */}
    </div>
  );
};

// Example 5: Task Creation Integration (already implemented in CreateTaskDialog)
export const handleTaskCreation = async (
  taskId: string,
  projectId: string,
  createdBy: string,
  assignedTo?: string
) => {
  try {
    await WorkflowTriggers.onTaskCreated(
      taskId,
      projectId,
      createdBy,
      assignedTo
    );
  } catch (error) {
    console.error('Failed to trigger task creation workflows:', error);
  }
};

// Example 6: Integration with React Hook Form
export const useWorkflowFormIntegration = (
  entityType: 'task' | 'project',
  entityId: string,
  projectId: string
) => {
  const { trackFieldChange } = useCustomFieldWorkflowTracking(
    entityType,
    entityId,
    projectId
  );

  const handleFormFieldChange = React.useCallback((
    fieldName: string,
    newValue: any,
    oldValue?: any
  ) => {
    // If it's a custom field, track it for workflows
    if (fieldName.startsWith('customField_')) {
      const fieldId = fieldName.replace('customField_', '');
      trackFieldChange(fieldId, newValue, oldValue);
    }
  }, [trackFieldChange]);

  return {
    handleFormFieldChange
  };
};

/**
 * Integration patterns and best practices:
 * 
 * 1. Status Changes:
 *    - Always call WorkflowTriggers.onTaskStatusChanged after successful status update
 *    - Include both from and to status for conditional workflows
 *    - Don't fail the main operation if workflow triggers fail
 * 
 * 2. File Uploads:
 *    - Call WorkflowTriggers.onFileUploaded after successful file upload
 *    - Include file type for filtering workflows
 *    - Use actual file ID if available
 * 
 * 3. Task Assignments:
 *    - Use TaskAssignmentHelper for consistent workflow triggering
 *    - Handle assignment, unassignment, and reassignment scenarios
 *    - Include the user who made the assignment change
 * 
 * 4. Custom Fields:
 *    - Use useCustomFieldWorkflowTracking hook for automatic tracking
 *    - Track changes on form submission or real-time as needed
 *    - Include field ID and both old/new values
 * 
 * 5. Task Creation:
 *    - Call WorkflowTriggers.onTaskCreated after successful task creation
 *    - Include creator and assignee information
 *    - Consider whether to run workflows for bulk operations
 * 
 * 6. Error Handling:
 *    - Always wrap workflow triggers in try-catch
 *    - Log workflow errors but don't fail the main operation
 *    - Consider showing user notifications for critical workflow failures
 */

export default {
  handleTaskStatusChange,
  handleFileUpload,
  handleTaskAssignment,
  handleTaskCreation,
  WorkflowEnabledForm,
  useWorkflowFormIntegration
}; 