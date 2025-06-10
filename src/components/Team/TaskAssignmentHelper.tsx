import React from 'react';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';

interface TaskAssignmentHelperProps {
  taskId: string;
  projectId: string;
  currentAssignee?: string;
  onAssignmentChange?: (fromUser?: string, toUser?: string) => void;
}

/**
 * Helper class for triggering workflow events when task assignments change
 */
export class TaskAssignmentHelper {
  /**
   * Trigger workflows when a task is assigned to a user
   */
  static async assignTask(
    taskId: string,
    projectId: string,
    toUserId: string,
    assignedBy: string,
    fromUserId?: string
  ): Promise<void> {
    try {
      await WorkflowTriggers.onTaskAssigned(
        taskId,
        projectId,
        toUserId,
        assignedBy,
        fromUserId
      );
    } catch (error) {
      console.error('Failed to trigger assignment workflows:', error);
      // Don't fail the assignment if workflow triggers fail
    }
  }

  /**
   * Trigger workflows when a task is unassigned
   */
  static async unassignTask(
    taskId: string,
    projectId: string,
    fromUserId: string,
    unassignedBy: string
  ): Promise<void> {
    try {
      await WorkflowTriggers.onTaskAssigned(
        taskId,
        projectId,
        '', // Empty string indicates unassignment
        unassignedBy,
        fromUserId
      );
    } catch (error) {
      console.error('Failed to trigger unassignment workflows:', error);
      // Don't fail the unassignment if workflow triggers fail
    }
  }

  /**
   * Trigger workflows when a task assignment changes from one user to another
   */
  static async changeAssignment(
    taskId: string,
    projectId: string,
    fromUserId: string,
    toUserId: string,
    changedBy: string
  ): Promise<void> {
    try {
      await WorkflowTriggers.onTaskAssigned(
        taskId,
        projectId,
        toUserId,
        changedBy,
        fromUserId
      );
    } catch (error) {
      console.error('Failed to trigger assignment change workflows:', error);
      // Don't fail the assignment change if workflow triggers fail
    }
  }
}

/**
 * React component wrapper for task assignment workflows
 */
export const TaskAssignmentWorkflowWrapper: React.FC<TaskAssignmentHelperProps> = ({
  taskId,
  projectId,
  currentAssignee,
  onAssignmentChange
}) => {
  const handleAssignmentChange = React.useCallback(async (fromUser?: string, toUser?: string) => {
    const currentUserId = 'current-user-id'; // This should come from auth context
    
    if (!fromUser && toUser) {
      // New assignment
      await TaskAssignmentHelper.assignTask(taskId, projectId, toUser, currentUserId);
    } else if (fromUser && !toUser) {
      // Unassignment
      await TaskAssignmentHelper.unassignTask(taskId, projectId, fromUser, currentUserId);
    } else if (fromUser && toUser && fromUser !== toUser) {
      // Assignment change
      await TaskAssignmentHelper.changeAssignment(taskId, projectId, fromUser, toUser, currentUserId);
    }
    
    // Call the original callback
    if (onAssignmentChange) {
      onAssignmentChange(fromUser, toUser);
    }
  }, [taskId, projectId, onAssignmentChange]);

  React.useEffect(() => {
    // This component doesn't render anything, it's just for logic
    return () => {
      // Cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
};

export default TaskAssignmentHelper; 