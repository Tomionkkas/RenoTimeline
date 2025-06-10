import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDummyMode } from './useDummyMode';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  owner_id: string;
  source_app: string | null;
  calcreno_project_id: string | null;
  calcreno_reference_url: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

// Guest mode sample data
const guestProjects: Project[] = [
  {
    id: 'guest-project-1',
    name: 'Remont łazienki',
    description: 'Kompleksowy remont głównej łazienki - wymiana płytek, instalacji i armatury',
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-03-30',
    budget: 25000,
    owner_id: 'guest-user',
    source_app: null,
    calcreno_project_id: null,
    calcreno_reference_url: null,
    imported_at: null,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'guest-project-2',
    name: 'Modernizacja kuchni',
    description: 'Wymiana mebli kuchennych, AGD i oświetlenia',
    status: 'active',
    start_date: '2024-02-01',
    end_date: '2024-04-15',
    budget: 35000,
    owner_id: 'guest-user',
    source_app: null,
    calcreno_project_id: null,
    calcreno_reference_url: null,
    imported_at: null,
    created_at: '2024-01-25T14:30:00Z',
    updated_at: '2024-01-25T14:30:00Z'
  }
];

export const useProjects = () => {
  const { user } = useAuth();
  const { isDummyMode } = useDummyMode();
  const queryClient = useQueryClient();

  const fetchProjects = async () => {
    if (isDummyMode) return guestProjects;
    if (!user) return [];

    // Step 1: Get projects owned by the user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) throw new Error(ownedError.message);

    // Step 2: Get projects where user is assigned as team member
    const { data: assignments, error: assignmentError } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('profile_id', user.id);

    if (assignmentError) throw new Error(assignmentError.message);

    let assignedProjects: Project[] = [];
    if (assignments && assignments.length > 0) {
      const assignedProjectIds = assignments.map(a => a.project_id);
      const { data: assignedProjectsData, error: assignedError } = await supabase
        .from('projects')
        .select('*')
        .in('id', assignedProjectIds)
        .order('created_at', { ascending: false });

      if (assignedError) throw new Error(assignedError.message);
      assignedProjects = assignedProjectsData || [];
    }

    // Step 3: Combine and remove duplicates
    const allProjects = [...(ownedProjects || []), ...assignedProjects];
    const uniqueProjects = allProjects.reduce((acc: Project[], project: Project) => {
      if (!acc.find(p => p.id === project.id)) {
        acc.push(project);
      }
      return acc;
    }, []);

    return uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const { data: projects = [], isLoading, isError, error } = useQuery<Project[]>({
    queryKey: ['projects', user?.id, isDummyMode],
    queryFn: fetchProjects,
    enabled: !!user || isDummyMode,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'status'>) => {
      if (isDummyMode) {
        const newProject: Project = {
          id: `guest-project-${Date.now()}`,
          ...projectData,
          status: 'active',
          owner_id: 'guest-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(['projects', user?.id, isDummyMode], (old: Project[] = []) => [newProject, ...old]);
        return newProject;
      }
      if (!user) throw new Error("User not authenticated");

      // Call the RPC function 
      const { data, error } = await supabase.rpc('create_new_project', {
        p_name: projectData.name,
        p_description: projectData.description,
        p_start_date: projectData.start_date,
        p_end_date: projectData.end_date,
        p_budget: projectData.budget
      });

      if (error) throw new Error(error.message);

      // The RPC returns the new project's ID. We'll return a minimal object for the onSuccess callback.
      return { id: data };
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch project lists and assignments
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id, isDummyMode] });
      if(data) {
        queryClient.invalidateQueries({ queryKey: ['project_members', data.id] });
      }
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<Project> & { id: string }) => {
      if (isDummyMode) {
        queryClient.setQueryData(['projects', user?.id, isDummyMode], (old: Project[] = []) => old.map(p => p.id === projectData.id ? {...p, ...projectData} : p));
        return projectData;
      }
      const { data, error } = await supabase
        .from('projects')
        .update({ ...projectData, updated_at: new Date().toISOString() })
        .eq('id', projectData.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id, isDummyMode] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (isDummyMode) {
        queryClient.setQueryData(['projects', user?.id, isDummyMode], (old: Project[] = []) => old.filter(p => p.id !== projectId));
        return;
      }
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id, isDummyMode] });
    },
  });

  const assignMemberToProject = useMutation({
    mutationFn: async ({ projectId, profileId }: { projectId: string; profileId: string }) => {
      // @ts-ignore - The auto-generated types can be stale and not recognize the new table.
      const { data, error } = await supabase.from('project_assignments').insert([{ project_id: projectId, profile_id: profileId }]);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
    },
  });

  const removeMemberFromProject = useMutation({
     mutationFn: async ({ projectId, profileId }: { projectId: string; profileId: string }) => {
      // @ts-ignore - The auto-generated types can be stale and not recognize the new table.
      const { error } = await supabase.from('project_assignments').delete().match({ project_id: projectId, profile_id: profileId });
      if (error) throw new Error(error.message);
    },
     onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
    },
  });

  return {
    projects,
    loading: isLoading,
    error: error as Error | null,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    assignMemberToProject: assignMemberToProject.mutateAsync,
    removeMemberFromProject: removeMemberFromProject.mutateAsync,
  };
}; 