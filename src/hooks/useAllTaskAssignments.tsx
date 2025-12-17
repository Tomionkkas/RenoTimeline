import { useQuery } from '@tanstack/react-query';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaskAssignmentWithProfile {
  id: string;
  task_id: string;
  user_id: string | null;
  team_member_id: string | null;
  assignment_order: number;
  created_at: string;
  updated_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_expertise: string | null;
  team_member_first_name: string | null;
  team_member_last_name: string | null;
  team_member_expertise: string | null;
  first_name: string | null;
  last_name: string | null;
  expertise: string | null;
}

export const useAllTaskAssignments = () => {
  const { user } = useAuth();

  const fetchAllAssignments = async () => {
    if (!user) return [];

    const { data, error } = await renotimelineClient
      .from('task_assignments_with_profiles')
      .select('*');

    if (error) throw new Error(error.message);
    return data as TaskAssignmentWithProfile[];
  };

  const { data: assignments = [], isLoading, error } = useQuery<TaskAssignmentWithProfile[]>({
    queryKey: ['all-task-assignments'],
    queryFn: fetchAllAssignments,
    enabled: !!user,
  });

  // Helper function to check if a task is assigned to a specific user or team member
  const isTaskAssignedTo = (taskId: string, userId?: string | null, teamMemberId?: string | null): boolean => {
    return assignments.some(assignment =>
      assignment.task_id === taskId &&
      ((userId && assignment.user_id === userId) ||
       (teamMemberId && assignment.team_member_id === teamMemberId))
    );
  };

  // Helper function to check if a task has any assignments at all
  const isTaskAssigned = (taskId: string): boolean => {
    return assignments.some(assignment => assignment.task_id === taskId);
  };

  // Get all assignments for a specific task
  const getTaskAssignments = (taskId: string): TaskAssignmentWithProfile[] => {
    return assignments.filter(assignment => assignment.task_id === taskId);
  };

  // Get unique assignees (both users and team members)
  const getUniqueAssignees = () => {
    const assignees = new Map<string, {
      type: 'user' | 'team_member';
      id: string;
      first_name: string;
      last_name: string;
      expertise: string | null;
    }>();

    assignments.forEach(assignment => {
      if (assignment.user_id && !assignees.has(`user-${assignment.user_id}`)) {
        assignees.set(`user-${assignment.user_id}`, {
          type: 'user',
          id: assignment.user_id,
          first_name: assignment.user_first_name || 'Unknown',
          last_name: assignment.user_last_name || 'User',
          expertise: assignment.user_expertise,
        });
      }
      if (assignment.team_member_id && !assignees.has(`team-${assignment.team_member_id}`)) {
        assignees.set(`team-${assignment.team_member_id}`, {
          type: 'team_member',
          id: assignment.team_member_id,
          first_name: assignment.team_member_first_name || 'Unknown',
          last_name: assignment.team_member_last_name || 'Member',
          expertise: assignment.team_member_expertise,
        });
      }
    });

    return Array.from(assignees.values());
  };

  return {
    assignments,
    loading: isLoading,
    error: error as Error | null,
    isTaskAssignedTo,
    isTaskAssigned,
    getTaskAssignments,
    getUniqueAssignees,
  };
};
