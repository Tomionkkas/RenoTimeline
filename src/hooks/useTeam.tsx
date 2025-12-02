import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { renotimelineClient, sharedClient } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/database.types';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export type TeamMember = Database['shared_schema']['Tables']['profiles']['Row'];

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

      // For simplicity, this hook will now fetch all users who share a project with the current user.
      // A more complex implementation might involve a dedicated teams table.
      
      // Step 1: Get IDs of all projects the current user is a member of (either owner or assigned)
      const { data: projectRoles, error: rolesError } = await sharedClient
        .from('user_roles')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('app_name', 'renotimeline');

      if (rolesError) throw new Error(rolesError.message);

      const projectIds = projectRoles?.map(p => p.project_id).filter(id => id !== null) || [];

      if (projectIds.length === 0) {
        // If user has no projects, just return their own profile
        const { data: ownProfile, error: ownProfileError } = await sharedClient
          .from('profiles')
          .select('*')
          .eq('id', user.id);
        if (ownProfileError) throw new Error(ownProfileError.message);
        return ownProfile || [];
      }

      // Step 2: Get all user_ids associated with those projects
      const { data: memberRoles, error: memberRolesError } = await sharedClient
        .from('user_roles')
        .select('user_id')
        .in('project_id', projectIds)
        .eq('app_name', 'renotimeline');
      
      if (memberRolesError) throw new Error(memberRolesError.message);
      
      const teamMemberIds = [...new Set(memberRoles?.map(a => a.user_id) || [])];

      if (teamMemberIds.length === 0) {
          teamMemberIds.push(user.id);
      }

      // Step 3: Get profiles for all unique member IDs
      const { data: profiles, error: profilesError } = await sharedClient
        .from('profiles')
        .select('*')
        .in('id', teamMemberIds);

      if (profilesError) throw new Error(profilesError.message);

      return profiles || [];
    },
    enabled: !!user,
  });

  const { mutateAsync: addTeamMember, isPending: isAdding } = useMutation({
    mutationFn: async (newMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) => {
      // This is a simplification. In a real app, adding a team member would
      // likely involve inviting them and setting up their roles, not just creating a profile.
      const { data, error } = await sharedClient.from('profiles').insert(newMember as any).select().single();
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
    mutationFn: async (updatedMember: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await sharedClient
        .from('profiles')
        .update(updatedMember)
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
      // Note: This only deletes the profile. It does not remove them from projects.
      const { error } = await sharedClient.from('profiles').delete().eq('id', memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Team member deleted!");
    },
  });

  return { teamMembers: teamMembers || [], loading, error, addTeamMember, isAdding, updateTeamMember, isUpdating, deleteTeamMember, isDeleting };
} 