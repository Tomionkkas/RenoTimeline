import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/database.types';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export type TeamMember = Database['public']['Tables']['profiles']['Row'];

export function useTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: teamMembers,
    isLoading: loading,
    error,
  } = useQuery<TeamMember[]>({
    queryKey: ['teamMembers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Step 1: Get current user's projects
      const { data: userProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id);

      if (projectsError) throw new Error(projectsError.message);

      const projectIds = userProjects?.map(p => p.id) || [];

      // Step 2: Get all team members assigned to these projects
      let teamMemberIds: string[] = [user.id]; // Always include current user
      
      if (projectIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('project_assignments')
          .select('profile_id')
          .in('project_id', projectIds);

        if (assignmentsError) throw new Error(assignmentsError.message);
        
        const assignedMemberIds = assignments?.map(a => a.profile_id) || [];
        teamMemberIds = [...new Set([...teamMemberIds, ...assignedMemberIds])]; // Remove duplicates
      }

      // Step 3: Get profiles for all team member IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teamMemberIds);

      if (profilesError) throw new Error(profilesError.message);

      return profiles || [];
    },
    enabled: !!user,
  });

  const { mutateAsync: addTeamMember, isPending: isAdding } = useMutation({
    mutationFn: async (newMember: Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>) => {
      const { data, error } = await supabase.from('profiles').insert({ ...newMember, id: uuidv4() }).select().single();
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Team member added!");
    },
  });

  const { mutateAsync: updateTeamMember, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedMember: TeamMember) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updatedMember.first_name,
          last_name: updatedMember.last_name,
          email: updatedMember.email,
          expertise: updatedMember.expertise,
        })
        .eq('id', updatedMember.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Team member updated!");
    },
  });

  const { mutateAsync: deleteTeamMember, isPending: isDeleting } = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  return { teamMembers: teamMembers || [], loading, error, addTeamMember, isAdding, updateTeamMember, isUpdating, deleteTeamMember, isDeleting };
} 