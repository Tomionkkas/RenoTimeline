import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Task {
  id: string;
  name: string; // Changed from title
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'; // Updated statuses
  priority: number; // Changed to number
  project_id: string;
  task_type: string; // Added missing mandatory field
  assigned_to: string | null; // This will likely be a user ID from shared_schema.profiles
  start_date: string | null;
  end_date: string | null;
  estimated_duration_days: number | null;
  actual_duration_days: number | null;
  dependencies: string[] | null; // New field
  created_at: string;
  updated_at: string;
}

export const useTasks = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchTasks = async () => {
    if (!user) return [];

    let query = renotimelineClient.from('tasks').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    // If no projectId is provided, RLS will ensure only tasks from accessible projects are returned.

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as Task[];
  };

  const { data: tasks = [], isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ['tasks', projectId || 'all'],
    queryFn: fetchTasks,
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'dependencies' | 'actual_duration_days'>) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await renotimelineClient
        .from('tasks')
        .insert([{ ...taskData, task_type: taskData.task_type || 'generic' }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all']);

      queryClient.setQueryData<Task[]>(['tasks', projectId || 'all'], (old) => {
        const optimisticTask: Task = {
          id: `optimistic-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          dependencies: null,
          actual_duration_days: null,
          // All required fields from the form are now explicitly included
          name: newTaskData.name,
          description: newTaskData.description,
          project_id: newTaskData.project_id,
          priority: newTaskData.priority,
          status: newTaskData.status,
          end_date: newTaskData.end_date,
          estimated_duration_days: newTaskData.estimated_duration_days,
          assigned_to: newTaskData.assigned_to,
          start_date: newTaskData.start_date,
          task_type: newTaskData.task_type || 'generic',
        };
        return old ? [optimisticTask, ...old] : [optimisticTask];
      });

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all'], context.previousTasks);
      }
      toast.error('Nie udało się dodać zadania.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id: string }) => {
      const { data, error } = await renotimelineClient
        .from('tasks')
        .update({ ...taskData, updated_at: new Date().toISOString() })
        .eq('id', taskData.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all']);
      
      queryClient.setQueryData<Task[]>(
        ['tasks', projectId || 'all'],
        (old) => old?.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task) || []
      );

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all'], context.previousTasks);
      }
       toast.error('Nie udało się zaktualizować zadania.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await renotimelineClient.from('tasks').delete().eq('id', taskId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all']);

      queryClient.setQueryData<Task[]>(
        ['tasks', projectId || 'all'],
        (old) => old?.filter(task => task.id !== taskId) || []
      );
      
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all'], context.previousTasks);
      }
      toast.error('Nie udało się usunąć zadania.');
    },
     onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
    },
  });

  return {
    tasks,
    loading: isLoading,
    error: error as Error | null,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  };
};
