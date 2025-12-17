import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient, sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FeedbackComment, FeedbackCommentWithUser } from '@/lib/types/feedback';

export const useFeedbackComments = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchComments = async (): Promise<FeedbackCommentWithUser[]> => {
    if (!user || !postId) return [];

    const { data: comments, error } = await renotimelineClient
      .from('feedback_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Fetch user profiles for non-anonymous comments
    const userIds = comments
      ?.filter(c => !c.is_anonymous)
      .map(c => c.user_id)
      .filter((id, index, self) => self.indexOf(id) === index) || [];

    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await sharedClient
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        profiles = profilesData || [];
      }
    }

    const commentsWithUsers: FeedbackCommentWithUser[] = (comments || []).map(comment => ({
      ...comment,
      user_profile: comment.is_anonymous
        ? undefined
        : profiles.find(p => p.id === comment.user_id),
    }));

    return commentsWithUsers;
  };

  const { data: comments = [], isLoading, error } = useQuery<FeedbackCommentWithUser[]>({
    queryKey: ['feedback_comments', postId],
    queryFn: fetchComments,
    enabled: !!user && !!postId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: Omit<FeedbackComment, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await renotimelineClient
        .from('feedback_comments')
        .insert([{ ...commentData, user_id: user.id }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feedback_posts'] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['feedback_posts']);

      // Optimistically update post's comment_count
      queryClient.setQueriesData({ queryKey: ['feedback_posts'] }, (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              comment_count: post.comment_count + 1,
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
      toast.success('Komentarz został dodany!');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['feedback_posts'], context.previousPosts);
      }
      toast.error('Nie udało się dodać komentarza: ' + error.message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await renotimelineClient
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw new Error(error.message);
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feedback_posts'] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['feedback_posts']);

      // Optimistically update post's comment_count
      queryClient.setQueriesData({ queryKey: ['feedback_posts'] }, (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              comment_count: Math.max(0, post.comment_count - 1),
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
      toast.success('Komentarz został usunięty!');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['feedback_posts'], context.previousPosts);
      }
      toast.error('Nie udało się usunąć komentarza: ' + error.message);
    },
  });

  return {
    comments,
    isLoading,
    error,
    createComment: createCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
  };
};
