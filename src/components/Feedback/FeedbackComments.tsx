import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFeedbackComments } from '@/hooks/useFeedbackComments';
import { useAuth } from '@/hooks/useAuth';
import { useDevRole } from '@/hooks/useDevRole';
import { maskEmail } from '@/lib/utils/feedback';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DevBadge } from './DevBadge';
import { Trash2 } from 'lucide-react';

interface FeedbackCommentsProps {
  postId: string;
}

export function FeedbackComments({ postId }: FeedbackCommentsProps) {
  const { comments, isLoading, createComment, deleteComment } = useFeedbackComments(postId);
  const { user } = useAuth();
  const { isDev } = useDevRole();
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    createComment({
      post_id: postId,
      content: newComment.trim(),
      is_anonymous: isAnonymous,
      parent_comment_id: null,
    });

    setNewComment('');
    setIsAnonymous(false);
  };

  const getAuthorDisplay = (comment: any) => {
    if (comment.is_anonymous) {
      return 'Anonim';
    }
    if (comment.user_profile?.first_name || comment.user_profile?.last_name) {
      return `${comment.user_profile.first_name || ''} ${comment.user_profile.last_name || ''}`.trim();
    }
    if (comment.user_profile?.email) {
      return maskEmail(comment.user_profile.email);
    }
    return 'Użytkownik';
  };

  const getInitials = (comment: any) => {
    if (comment.is_anonymous) return 'A';
    const firstName = comment.user_profile?.first_name || '';
    const lastName = comment.user_profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  if (isLoading) {
    return <div className="text-white/60 text-center py-4">Ładowanie komentarzy...</div>;
  }

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Dodaj komentarz..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="comment-anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="comment-anonymous" className="text-white/80 text-sm">
                  Komentuj anonimowo
                </Label>
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={!newComment.trim()}
              >
                Dodaj komentarz
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            Brak komentarzy. Bądź pierwszy!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-white/20">{getInitials(comment)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{getAuthorDisplay(comment)}</span>
                      {isDev && comment.user_id === user?.id && <DevBadge />}
                      <span className="text-xs text-white/50">•</span>
                      <span className="text-xs text-white/50">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pl })}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm">{comment.content}</p>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
