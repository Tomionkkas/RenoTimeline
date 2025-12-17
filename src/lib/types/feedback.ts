export interface FeedbackPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'bug_report' | 'feature_request' | 'ui_ux_feedback' | 'general_feedback';
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  is_anonymous: boolean;
  upvote_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackUpvote {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedbackComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackPostWithUser extends FeedbackPost {
  user_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  has_upvoted?: boolean;
}

export interface FeedbackCommentWithUser extends FeedbackComment {
  user_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export type FeedbackSortBy = 'hot' | 'top' | 'new';
export type FeedbackCategory = 'all' | 'bug_report' | 'feature_request' | 'ui_ux_feedback' | 'general_feedback';
export type FeedbackStatus = 'all' | 'open' | 'in_progress' | 'completed' | 'closed';
