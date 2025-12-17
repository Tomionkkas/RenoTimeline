import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useFeedbackUpvote = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleUpvoteMutation = useMutation({
    mutationFn: async ({ postId, hasUpvoted }: { postId: string; hasUpvoted: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      if (hasUpvoted) {
        // Remove upvote
        const { error } = await renotimelineClient
          .from('feedback_upvotes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw new Error(error.message);
      } else {
        // Add upvote
        const { error } = await renotimelineClient
          .from('feedback_upvotes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw new Error(error.message);
      }
    },
    onMutate: async ({ postId, hasUpvoted }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feedback_posts'] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['feedback_posts']);

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['feedback_posts'] }, (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              upvote_count: hasUpvoted ? post.upvote_count - 1 : post.upvote_count + 1,
              has_upvoted: !hasUpvoted,
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['feedback_posts'], context.previousPosts);
      }
      toast.error('Nie udało się zaktualizować głosu');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
    },
  });

  return {
    toggleUpvote: toggleUpvoteMutation.mutate,
  };
};
