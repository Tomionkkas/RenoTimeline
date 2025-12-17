import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useFeedbackPosts } from '@/hooks/useFeedbackPosts';
import { FeedbackSortBy, FeedbackCategory, FeedbackStatus } from '@/lib/types/feedback';
import { FeedbackPostCard } from './FeedbackPostCard';
import { FeedbackFilters } from './FeedbackFilters';
import { CreateFeedbackDialog } from './CreateFeedbackDialog';
import { FeedbackPostDialog } from './FeedbackPostDialog';

export function FeedbackFeed() {
  const [sortBy, setSortBy] = useState<FeedbackSortBy>('hot');
  const [category, setCategory] = useState<FeedbackCategory>('all');
  const [status, setStatus] = useState<FeedbackStatus>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { posts, isLoading, deletePost, updatePost } = useFeedbackPosts(sortBy, category, status);

  const handleStatusChange = (postId: string, newStatus: string) => {
    updatePost({ postId, updates: { status: newStatus as any } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Centrum opinii</h2>
          <p className="text-white/60 mt-1">Podziel się swoimi pomysłami i opiniami</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj opinię
        </Button>
      </div>

      {/* Filters */}
      <FeedbackFilters
        sortBy={sortBy}
        onSortByChange={setSortBy}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
      />

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">Brak opinii do wyświetlenia</p>
            <p className="text-white/40 text-sm mt-2">Bądź pierwszy i podziel się swoją opinią!</p>
          </div>
        ) : (
          posts.map((post) => (
            <FeedbackPostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPostId(post.id)}
              onDelete={deletePost}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <CreateFeedbackDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      {selectedPostId && (
        <FeedbackPostDialog
          postId={selectedPostId}
          open={!!selectedPostId}
          onOpenChange={(open) => !open && setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
