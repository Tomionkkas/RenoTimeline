import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

// Team member type for contractor/worker contacts (not RenoTimeline users)
export type TeamMember = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  expertise: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

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

      // Fetch user's team members (contractors/workers contact list)
      const { data, error } = await sharedClient
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data as TeamMember[]) || [];
    },
    enabled: !!user,
  });

  const { mutateAsync: addTeamMember, isPending: isAdding } = useMutation({
    mutationFn: async (newMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error} = await sharedClient
        .from('team_members')
        .insert({
          ...newMember,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Członek zespołu został dodany!");
    },
  });

  const { mutateAsync: updateTeamMember, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedMember: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await sharedClient
        .from('team_members')
        .update(updatedMember)
        .eq('id', updatedMember.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Członek zespołu został zaktualizowany!");
    },
  });

  const { mutateAsync: deleteTeamMember, isPending: isDeleting } = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await sharedClient
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success("Członek zespołu został usunięty!");
    },
  });

  return { teamMembers: teamMembers || [], loading, error, addTeamMember, isAdding, updateTeamMember, isUpdating, deleteTeamMember, isDeleting };
}
