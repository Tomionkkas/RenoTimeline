-- Create feedback system tables for Reddit-style feedback
-- All tables in renotimeline_schema

-- Create feedback_posts table
CREATE TABLE IF NOT EXISTS renotimeline_schema.feedback_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'ui_ux_feedback', 'general_feedback')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    upvote_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for feedback_posts
CREATE INDEX idx_feedback_posts_user_id ON renotimeline_schema.feedback_posts(user_id);
CREATE INDEX idx_feedback_posts_category ON renotimeline_schema.feedback_posts(category);
CREATE INDEX idx_feedback_posts_status ON renotimeline_schema.feedback_posts(status);
CREATE INDEX idx_feedback_posts_upvote_count ON renotimeline_schema.feedback_posts(upvote_count DESC);
CREATE INDEX idx_feedback_posts_created_at ON renotimeline_schema.feedback_posts(created_at DESC);

-- Create feedback_upvotes table
CREATE TABLE IF NOT EXISTS renotimeline_schema.feedback_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES renotimeline_schema.feedback_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for feedback_upvotes
CREATE INDEX idx_feedback_upvotes_post_id ON renotimeline_schema.feedback_upvotes(post_id);
CREATE INDEX idx_feedback_upvotes_user_id ON renotimeline_schema.feedback_upvotes(user_id);

-- Create feedback_comments table
CREATE TABLE IF NOT EXISTS renotimeline_schema.feedback_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES renotimeline_schema.feedback_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES renotimeline_schema.feedback_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for feedback_comments
CREATE INDEX idx_feedback_comments_post_id ON renotimeline_schema.feedback_comments(post_id);
CREATE INDEX idx_feedback_comments_user_id ON renotimeline_schema.feedback_comments(user_id);
CREATE INDEX idx_feedback_comments_parent_id ON renotimeline_schema.feedback_comments(parent_comment_id);
CREATE INDEX idx_feedback_comments_created_at ON renotimeline_schema.feedback_comments(created_at ASC);

-- Enable RLS
ALTER TABLE renotimeline_schema.feedback_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE renotimeline_schema.feedback_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE renotimeline_schema.feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_posts
CREATE POLICY "Authenticated users can view feedback posts"
ON renotimeline_schema.feedback_posts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create feedback posts"
ON renotimeline_schema.feedback_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback posts"
ON renotimeline_schema.feedback_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any feedback post"
ON renotimeline_schema.feedback_posts
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM shared_schema.user_roles
        WHERE user_id = auth.uid()
        AND app_name = 'renotimeline'
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Users can delete own feedback posts"
ON renotimeline_schema.feedback_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for feedback_upvotes
CREATE POLICY "Authenticated users can view upvotes"
ON renotimeline_schema.feedback_upvotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upvote"
ON renotimeline_schema.feedback_upvotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes"
ON renotimeline_schema.feedback_upvotes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for feedback_comments
CREATE POLICY "Authenticated users can view comments"
ON renotimeline_schema.feedback_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON renotimeline_schema.feedback_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON renotimeline_schema.feedback_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON renotimeline_schema.feedback_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger functions
CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_post_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE renotimeline_schema.feedback_posts
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE renotimeline_schema.feedback_posts
        SET upvote_count = upvote_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_upvote_count_trigger
    AFTER INSERT OR DELETE ON renotimeline_schema.feedback_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.update_feedback_post_upvote_count();

CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE renotimeline_schema.feedback_posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE renotimeline_schema.feedback_posts
        SET comment_count = comment_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_comment_count_trigger
    AFTER INSERT OR DELETE ON renotimeline_schema.feedback_comments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.update_feedback_post_comment_count();

CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_posts_updated_at
    BEFORE UPDATE ON renotimeline_schema.feedback_posts
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.update_feedback_updated_at();

CREATE TRIGGER feedback_comments_updated_at
    BEFORE UPDATE ON renotimeline_schema.feedback_comments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.update_feedback_updated_at();
