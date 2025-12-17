import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string | null;
  team_member_id: string | null;
  assignment_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignmentWithProfile extends TaskAssignment {
  first_name: string | null;
  last_name: string | null;
  expertise: string | null;
}

export const useTaskAssignments = (taskId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchTaskAssignments = async () => {
    if (!user || !taskId) return [];

    const { data, error } = await renotimelineClient
      .from('task_assignments_with_profiles')
      .select('*')
      .eq('task_id', taskId)
      .order('assignment_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data as TaskAssignmentWithProfile[];
  };

  const { data: assignments = [], isLoading, error } = useQuery<TaskAssignmentWithProfile[]>({
    queryKey: ['task-assignments', taskId],
    queryFn: fetchTaskAssignments,
    enabled: !!user && !!taskId,
  });

  // Add assignment
  const addAssignmentMutation = useMutation({
    mutationFn: async ({
      task_id,
      user_id,
      team_member_id,
      assignment_order,
    }: {
      task_id: string;
      user_id?: string | null;
      team_member_id?: string | null;
      assignment_order: number;
    }) => {
      // Insert into task_assignments table
      const insertData: any = { task_id, assignment_order };
      if (user_id) insertData.user_id = user_id;
      if (team_member_id) insertData.team_member_id = team_member_id;

      const { data: result, error: insertError } = await renotimelineClient
        .from('task_assignments')
        .insert([insertData])
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);

      // Fetch the newly created assignment with profile data from the view
      const { data, error } = await renotimelineClient
        .from('task_assignments_with_profiles')
        .select('*')
        .eq('id', result.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Członek zespołu został przypisany do zadania');
    },
    onError: (error: Error) => {
      toast.error(`Nie udało się przypisać członka zespołu: ${error.message}`);
    },
  });

  // Update assignment (e.g., change order)
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({
      id,
      assignment_order,
    }: {
      id: string;
      assignment_order?: number;
    }) => {
      const updates: any = {};
      if (assignment_order !== undefined) updates.assignment_order = assignment_order;

      // Update the task_assignments table
      const { error: updateError } = await renotimelineClient
        .from('task_assignments')
        .update(updates)
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      // Fetch the updated assignment with profile data from the view
      const { data, error } = await renotimelineClient
        .from('task_assignments_with_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Przypisanie zostało zaktualizowane');
    },
    onError: (error: Error) => {
      toast.error(`Nie udało się zaktualizować przypisania: ${error.message}`);
    },
  });

  // Remove assignment
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await renotimelineClient
        .from('task_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Członek zespołu został usunięty z zadania');
    },
    onError: (error: Error) => {
      toast.error(`Nie udało się usunąć przypisania: ${error.message}`);
    },
  });

  // Batch update assignments (useful for reordering)
  const batchUpdateAssignmentsMutation = useMutation({
    mutationFn: async (updates: { id: string; assignment_order: number }[]) => {
      const promises = updates.map((update) =>
        renotimelineClient
          .from('task_assignments')
          .update({ assignment_order: update.assignment_order })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const error = results.find((r) => r.error);
      if (error?.error) throw new Error(error.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Kolejność przypisań została zaktualizowana');
    },
    onError: (error: Error) => {
      toast.error(`Nie udało się zaktualizować kolejności: ${error.message}`);
    },
  });

  return {
    assignments,
    loading: isLoading,
    error: error as Error | null,
    addAssignment: addAssignmentMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    removeAssignment: removeAssignmentMutation.mutateAsync,
    batchUpdateAssignments: batchUpdateAssignmentsMutation.mutateAsync,
  };
};
