import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient, sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  user_id: string; // Changed from owner_id
  imported_from_calcreno: boolean; // New field
  calcreno_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchProjects = async () => {
    if (!user) return [];

    // Step 1: Get projects owned by the user from renotimeline_schema
    const { data: ownedProjects, error: ownedError } = await renotimelineClient
      .from('projects')
      .select('*')
      .eq('user_id', user.id) // Changed from owner_id
      .order('created_at', { ascending: false });

    if (ownedError) throw new Error(ownedError.message);

    // Step 2: Get projects where user is assigned a role from shared_schema
    const { data: assignments, error: assignmentError } = await sharedClient
      .from('project_roles')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('app_name', 'renotimeline');

    if (assignmentError) throw new Error(assignmentError.message);

    let assignedProjects: Project[] = [];
    if (assignments && assignments.length > 0) {
      const assignedProjectIds = assignments.map(a => a.project_id).filter(id => id !== null) as string[];
      if (assignedProjectIds.length > 0) {
        const { data: assignedProjectsData, error: assignedError } = await renotimelineClient
          .from('projects')
          .select('*')
          .in('id', assignedProjectIds)
          .order('created_at', { ascending: false });

        if (assignedError) throw new Error(assignedError.message);
        assignedProjects = (assignedProjectsData as Project[]) || [];
      }
    }

    // Step 3: Combine and remove duplicates
    const allProjects = [...((ownedProjects as Project[]) || []), ...assignedProjects];
    const uniqueProjects = allProjects.reduce((acc: Project[], project: Project) => {
      if (!acc.find(p => p.id === project.id)) {
        acc.push(project);
      }
      return acc;
    }, []);

    return uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const { data: projects = [], isLoading, isError, error } = useQuery<Project[]>({
    queryKey: ['projects', user?.id],
    queryFn: fetchProjects,
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status' | 'imported_from_calcreno' | 'calcreno_project_id'>) => {
      if (!user) throw new Error("User not authenticated");

      // Step 1: Create the project in renotimeline_schema
      const { data: newProject, error: projectError } = await renotimelineClient
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id,
          status: 'planning',
        })
        .select()
        .single();
      
      if (projectError) throw new Error(projectError.message);
      if (!newProject) throw new Error("Project creation failed");

      // Step 2: Assign the user as the owner in shared_schema.project_roles
      const { error: roleError } = await sharedClient
        .from('project_roles')
        .insert({
          user_id: user.id,
          project_id: newProject.id,
          app_name: 'renotimeline',
          role: 'owner',
        });

      if (roleError) {
        // If creating the role fails, we should ideally roll back the project creation.
        // For now, we'll log the error and throw, which will prevent the UI from showing a success state.
        console.error("Failed to assign owner role:", roleError);
        // Attempt to delete the orphaned project
        await renotimelineClient.from('projects').delete().eq('id', newProject.id);
        throw new Error(`Failed to assign owner role: ${roleError.message}`);
      }

      return newProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      if(data) {
        queryClient.invalidateQueries({ queryKey: ['project_members', data.id] });
      }
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<Project> & { id: string }) => {
      const { data, error } = await renotimelineClient
        .from('projects')
        .update({ ...projectData, updated_at: new Date().toISOString() })
        .eq('id', projectData.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await renotimelineClient.from('projects').delete().eq('id', projectId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const assignMemberToProject = useMutation({
    mutationFn: async ({ projectId, profileId, role }: { projectId: string; profileId: string; role: string }) => {
      const { data, error } = await sharedClient.from('project_roles').insert({
        project_id: projectId,
        user_id: profileId,
        app_name: 'renotimeline',
        role,
      });
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
      const { error } = await sharedClient.from('project_roles').delete()
        .eq('project_id', projectId)
        .eq('user_id', profileId)
        .eq('app_name', 'renotimeline');
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
    assignMember: assignMemberToProject.mutateAsync,
    removeMember: removeMemberFromProject.mutateAsync,
  };
}; 