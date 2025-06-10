import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDummyMode } from './useDummyMode';
import { toast } from 'sonner';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  start_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
}

// Guest mode sample data
const guestTasks: Task[] = [
  {
    id: 'guest-task-1',
    title: 'Zdemontować starą armaturę',
    description: 'Usunięcie starej baterii, sedesu i umywalki',
    status: 'done',
    priority: 'high',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-01-20',
    start_date: null,
    start_time: null,
    end_time: null,
    is_all_day: true,
    estimated_hours: 8,
    actual_hours: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'guest-task-2',
    title: 'Położyć nowe płytki',
    description: 'Układanie płytek ceramicznych na ścianach i podłodze',
    status: 'in_progress',
    priority: 'high',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-15',
    start_date: null,
    start_time: null,
    end_time: null,
    is_all_day: true,
    estimated_hours: 24,
    actual_hours: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    id: 'guest-task-3',
    title: 'Zamontować nową armaturę',
    description: 'Instalacja nowej baterii, sedesu i umywalki',
    status: 'todo',
    priority: 'medium',
    project_id: 'guest-project-1',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-03-10',
    start_date: null,
    start_time: null,
    end_time: null,
    is_all_day: true,
    estimated_hours: 12,
    actual_hours: null,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 'guest-task-4',
    title: 'Zaprojektować układ mebli',
    description: 'Stworzenie projektu rozmieszczenia mebli kuchennych',
    status: 'done',
    priority: 'high',
    project_id: 'guest-project-2',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-05',
    start_date: null,
    start_time: null,
    end_time: null,
    is_all_day: true,
    estimated_hours: 6,
    actual_hours: null,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
  {
    id: 'guest-task-5',
    title: 'Zamówić meble kuchenne',
    description: 'Złożenie zamówienia na meble zgodnie z projektem',
    status: 'in_progress',
    priority: 'medium',
    project_id: 'guest-project-2',
    assigned_to: null,
    created_by: 'guest-user',
    due_date: '2024-02-28',
    start_date: null,
    start_time: null,
    end_time: null,
    is_all_day: true,
    estimated_hours: 4,
    actual_hours: null,
    created_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z'
  }
];

export const useTasks = (projectId?: string) => {
  const { user } = useAuth();
  const { isDummyMode } = useDummyMode();
  const queryClient = useQueryClient();

  const fetchTasks = async () => {
    if (isDummyMode) {
      return projectId ? guestTasks.filter(t => t.project_id === projectId) : guestTasks;
    }
    if (!user) return [];

    if (projectId) {
      // If specific project ID is provided, just fetch tasks for that project
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    } else {
      // If no specific project, fetch tasks from all user's projects
      // Step 1: Get user's projects (owned + assigned)
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id);

      if (ownedError) throw new Error(ownedError.message);

      const { data: assignments, error: assignmentError } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('profile_id', user.id);

      if (assignmentError) throw new Error(assignmentError.message);

      // Step 2: Combine project IDs
      const ownedProjectIds = ownedProjects?.map(p => p.id) || [];
      const assignedProjectIds = assignments?.map(a => a.project_id) || [];
      const allProjectIds = [...new Set([...ownedProjectIds, ...assignedProjectIds])];

      if (allProjectIds.length === 0) {
        return []; // User has no projects
      }

      // Step 3: Fetch tasks from user's projects
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', allProjectIds)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }
  };

  const { data: tasks = [], isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ['tasks', projectId || 'all', isDummyMode],
    queryFn: fetchTasks,
    enabled: !!user || isDummyMode,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'actual_hours'>) => {
      if (isDummyMode) {
        const newTask: Task = {
          id: `guest-task-${Date.now()}`,
          ...taskData,
          created_by: 'guest-user',
          actual_hours: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], (old: Task[] = []) => [newTask, ...old]);
        return newTask;
      }
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, created_by: user.id }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all', isDummyMode]);

      queryClient.setQueryData<Task[]>(['tasks', projectId || 'all', isDummyMode], (old) => {
        const optimisticTask: Task = {
          id: `optimistic-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || 'unknown',
          actual_hours: null,
          ...newTaskData,
        };
        return old ? [optimisticTask, ...old] : [optimisticTask];
      });

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], context.previousTasks);
      }
      toast.error('Nie udało się dodać zadania.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', isDummyMode] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id: string }) => {
      if (isDummyMode) {
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], (old: Task[] = []) => old.map(t => t.id === taskData.id ? {...t, ...taskData} : t));
        return taskData;
      }
      const { data, error } = await supabase
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
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all', isDummyMode]);
      
      queryClient.setQueryData<Task[]>(
        ['tasks', projectId || 'all', isDummyMode],
        (old) => old?.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task) || []
      );

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], context.previousTasks);
      }
       toast.error('Nie udało się zaktualizować zadania.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', isDummyMode] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (isDummyMode) {
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], (old: Task[] = []) => old.filter(t => t.id !== taskId));
        return;
      }
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId || 'all', isDummyMode]);

      queryClient.setQueryData<Task[]>(
        ['tasks', projectId || 'all', isDummyMode],
        (old) => old?.filter(task => task.id !== taskId) || []
      );
      
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId || 'all', isDummyMode], context.previousTasks);
      }
      toast.error('Nie udało się usunąć zadania.');
    },
     onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', isDummyMode] });
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
