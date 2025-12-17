import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renotimelineClient, sharedClient } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FeedbackPost, FeedbackPostWithUser, FeedbackSortBy, FeedbackCategory, FeedbackStatus } from '@/lib/types/feedback';
import { calculateHotScore } from '@/lib/utils/feedback';

export const useFeedbackPosts = (
  sortBy: FeedbackSortBy = 'hot',
  category: FeedbackCategory = 'all',
  status: FeedbackStatus = 'all'
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPosts = async (): Promise<FeedbackPostWithUser[]> => {
    if (!user) return [];

    // Build query
    let query = renotimelineClient
      .from('feedback_posts')
      .select('*');

    // Filter by category
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Sort based on sortBy parameter
    if (sortBy === 'new') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'top') {
      query = query.order('upvote_count', { ascending: false });
    }
    // For 'hot', we'll sort client-side using calculateHotScore

    const { data: posts, error } = await query;

    if (error) throw new Error(error.message);

    // Fetch user profiles for non-anonymous posts
    const userIds = posts
      ?.filter(p => !p.is_anonymous)
      .map(p => p.user_id)
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

    // Fetch user's upvotes
    const { data: userUpvotes, error: upvotesError } = await renotimelineClient
      .from('feedback_upvotes')
      .select('post_id')
      .eq('user_id', user.id);

    if (upvotesError) {
      console.error('Error fetching upvotes:', upvotesError);
    }

    const upvotedPostIds = new Set(userUpvotes?.map(u => u.post_id) || []);

    // Combine data
    let postsWithUsers: FeedbackPostWithUser[] = (posts || []).map(post => ({
      ...post,
      user_profile: post.is_anonymous
        ? undefined
        : profiles.find(p => p.id === post.user_id),
      has_upvoted: upvotedPostIds.has(post.id),
    }));

    // Sort by hot score if needed
    if (sortBy === 'hot') {
      postsWithUsers = postsWithUsers.sort((a, b) => {
        const scoreA = calculateHotScore(a.upvote_count, a.created_at);
        const scoreB = calculateHotScore(b.upvote_count, b.created_at);
        return scoreB - scoreA;
      });
    }

    return postsWithUsers;
  };

  const { data: posts = [], isLoading, error } = useQuery<FeedbackPostWithUser[]>({
    queryKey: ['feedback_posts', sortBy, category, status],
    queryFn: fetchPosts,
    enabled: !!user,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: Omit<FeedbackPost, 'id' | 'created_at' | 'updated_at' | 'upvote_count' | 'comment_count' | 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await renotimelineClient
        .from('feedback_posts')
        .insert([{ ...postData, user_id: user.id }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
      toast.success('Opinia została dodana!');
    },
    onError: (error: any) => {
      toast.error('Nie udało się dodać opinii: ' + error.message);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: Partial<FeedbackPost> }) => {
      const { data, error } = await renotimelineClient
        .from('feedback_posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
      toast.success('Opinia została zaktualizowana!');
    },
    onError: (error: any) => {
      toast.error('Nie udało się zaktualizować opinii: ' + error.message);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await renotimelineClient
        .from('feedback_posts')
        .delete()
        .eq('id', postId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_posts'] });
      toast.success('Opinia została usunięta!');
    },
    onError: (error: any) => {
      toast.error('Nie udało się usunąć opinii: ' + error.message);
    },
  });

  return {
    posts,
    isLoading,
    error,
    createPost: createPostMutation.mutate,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
  };
};
