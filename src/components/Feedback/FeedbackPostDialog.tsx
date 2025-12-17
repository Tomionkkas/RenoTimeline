import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useFeedbackPosts } from '@/hooks/useFeedbackPosts';
import { FeedbackPostCard } from './FeedbackPostCard';
import { FeedbackComments } from './FeedbackComments';

interface FeedbackPostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackPostDialog({ postId, open, onOpenChange }: FeedbackPostDialogProps) {
  const { posts, deletePost, updatePost } = useFeedbackPosts();
  const post = posts.find(p => p.id === postId);

  if (!post) return null;

  const handleStatusChange = (postId: string, newStatus: string) => {
    updatePost({ postId, updates: { status: newStatus as any } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>{post.title}</DialogTitle>
        </VisuallyHidden>
        <div className="space-y-6">
          <FeedbackPostCard
            post={post}
            onDelete={(postId) => {
              deletePost(postId);
              onOpenChange(false);
            }}
            onStatusChange={handleStatusChange}
          />
          <FeedbackComments postId={postId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
