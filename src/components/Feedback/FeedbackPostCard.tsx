import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageSquare, MoreVertical } from 'lucide-react';
import { FeedbackPostWithUser } from '@/lib/types/feedback';
import { maskEmail, getCategoryDisplayName, getCategoryColor, getStatusDisplayName, getStatusColor } from '@/lib/utils/feedback';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useFeedbackUpvote } from '@/hooks/useFeedbackUpvote';
import { useAuth } from '@/hooks/useAuth';
import { useDevRole } from '@/hooks/useDevRole';
import { DevBadge } from './DevBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedbackPostCardProps {
  post: FeedbackPostWithUser;
  onClick?: () => void;
  onDelete?: (postId: string) => void;
  onStatusChange?: (postId: string, status: string) => void;
}

export function FeedbackPostCard({ post, onClick, onDelete, onStatusChange }: FeedbackPostCardProps) {
  const { user } = useAuth();
  const { isDev } = useDevRole();
  const { toggleUpvote } = useFeedbackUpvote();
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpvoting) return;

    setIsUpvoting(true);
    toggleUpvote({ postId: post.id, hasUpvoted: post.has_upvoted || false });
    setTimeout(() => setIsUpvoting(false), 500);
  };

  const getAuthorDisplay = () => {
    if (post.is_anonymous) {
      return 'Anonim';
    }
    if (post.user_profile?.first_name || post.user_profile?.last_name) {
      return `${post.user_profile.first_name || ''} ${post.user_profile.last_name || ''}`.trim();
    }
    if (post.user_profile?.email) {
      return maskEmail(post.user_profile.email);
    }
    return 'Użytkownik';
  };

  const getInitials = () => {
    if (post.is_anonymous) return 'A';
    const firstName = post.user_profile?.first_name || '';
    const lastName = post.user_profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const isAuthor = user?.id === post.user_id;
  const canManage = isDev || isAuthor;

  return (
    <Card
      className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Upvote Section */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-md transition-all ${
                post.has_upvoted
                  ? 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              onClick={handleUpvote}
              disabled={isUpvoting}
            >
              <ArrowBigUp className={`w-5 h-5 ${post.has_upvoted ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-sm font-semibold text-white">{post.upvote_count}</span>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-white/20">{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-white/80">{getAuthorDisplay()}</span>
                {isDev && post.user_id === user?.id && <DevBadge />}
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white/50">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pl })}
                </span>
              </div>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4 text-white/70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
                    {isDev && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(post.id, 'in_progress'); }}>
                          Oznacz jako "W trakcie"
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(post.id, 'completed'); }}>
                          Oznacz jako "Zakończone"
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(post.id, 'closed'); }}>
                          Zamknij
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAuthor && (
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete?.(post.id); }}
                        className="text-red-400"
                      >
                        Usuń
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(post.category)}>
                {getCategoryDisplayName(post.category)}
              </Badge>
              <Badge className={getStatusColor(post.status)}>
                {getStatusDisplayName(post.status)}
              </Badge>
            </div>

            {/* Title and Content */}
            <h3 className="font-semibold text-white text-lg mb-1">{post.title}</h3>
            <p className="text-white/70 text-sm line-clamp-2 mb-3">{post.content}</p>

            {/* Footer */}
            <div className="flex items-center gap-4 text-white/60">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{post.comment_count} komentarzy</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
