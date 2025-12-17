-- Comprehensive fix for security and performance issues identified by Supabase Advisor
-- Fixes for renotimeline_schema only

-- ============================================================================
-- PART 1: SECURITY FIXES - Add search_path to all functions
-- ============================================================================

-- Fix: update_feedback_post_upvote_count
CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_post_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix: update_feedback_post_comment_count
CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix: update_feedback_updated_at
CREATE OR REPLACE FUNCTION renotimeline_schema.update_feedback_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: sync_task_assigned_to
CREATE OR REPLACE FUNCTION renotimeline_schema.sync_task_assigned_to()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- When inserting or updating, sync the first assignment to tasks.assigned_to
    -- Only sync if it's a user (not a team member), since assigned_to expects a user_id
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE renotimeline_schema.tasks
        SET assigned_to = (
            SELECT user_id
            FROM renotimeline_schema.task_assignments
            WHERE task_id = NEW.task_id
            AND user_id IS NOT NULL  -- Only consider actual users
            ORDER BY assignment_order
            LIMIT 1
        )
        WHERE id = NEW.task_id;
    END IF;

    -- When deleting, update tasks.assigned_to
    IF (TG_OP = 'DELETE') THEN
        UPDATE renotimeline_schema.tasks
        SET assigned_to = (
            SELECT user_id
            FROM renotimeline_schema.task_assignments
            WHERE task_id = OLD.task_id
            AND user_id IS NOT NULL  -- Only consider actual users
            ORDER BY assignment_order
            LIMIT 1
        )
        WHERE id = OLD.task_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: update_task_assignments_updated_at
CREATE OR REPLACE FUNCTION renotimeline_schema.update_task_assignments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 2: PERFORMANCE FIXES - Optimize RLS policies with (SELECT auth.uid())
-- ============================================================================

-- Fix task_assignments policies
DROP POLICY IF EXISTS "Users can view task assignments in their projects" ON renotimeline_schema.task_assignments;
DROP POLICY IF EXISTS "Project members can create task assignments" ON renotimeline_schema.task_assignments;
DROP POLICY IF EXISTS "Project members can update task assignments" ON renotimeline_schema.task_assignments;
DROP POLICY IF EXISTS "Project members can delete task assignments" ON renotimeline_schema.task_assignments;

CREATE POLICY "Users can view task assignments in their projects"
ON renotimeline_schema.task_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = (SELECT auth.uid())
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = (SELECT auth.uid())
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

CREATE POLICY "Project members can create task assignments"
ON renotimeline_schema.task_assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = (SELECT auth.uid())
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = (SELECT auth.uid())
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

CREATE POLICY "Project members can update task assignments"
ON renotimeline_schema.task_assignments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = (SELECT auth.uid())
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = (SELECT auth.uid())
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

CREATE POLICY "Project members can delete task assignments"
ON renotimeline_schema.task_assignments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = (SELECT auth.uid())
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = (SELECT auth.uid())
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

-- Fix tasks policies - Remove duplicate and consolidate
DROP POLICY IF EXISTS "Project members have full access to tasks" ON renotimeline_schema.tasks;
DROP POLICY IF EXISTS "Allow task access for project owners and members" ON renotimeline_schema.tasks;

-- Single comprehensive policy for tasks
CREATE POLICY "Project members have full access to tasks"
ON renotimeline_schema.tasks
FOR ALL
USING (
    EXISTS (
      SELECT 1 FROM renotimeline_schema.projects p
      WHERE p.id = tasks.project_id AND p.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM shared_schema.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.app_name = 'renotimeline'
        AND ur.project_id = tasks.project_id
    )
)
WITH CHECK (
    EXISTS (
      SELECT 1 FROM renotimeline_schema.projects p
      WHERE p.id = tasks.project_id AND p.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM shared_schema.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.app_name = 'renotimeline'
        AND ur.project_id = tasks.project_id
    )
);

-- Fix feedback_posts policies - Consolidate UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can create feedback posts" ON renotimeline_schema.feedback_posts;
DROP POLICY IF EXISTS "Users can update own feedback posts" ON renotimeline_schema.feedback_posts;
DROP POLICY IF EXISTS "Admins can update any feedback post" ON renotimeline_schema.feedback_posts;
DROP POLICY IF EXISTS "Users can delete own feedback posts" ON renotimeline_schema.feedback_posts;

CREATE POLICY "Authenticated users can create feedback posts"
ON renotimeline_schema.feedback_posts
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Consolidated UPDATE policy - allows users to update own posts OR admins to update any post
CREATE POLICY "Users and admins can update feedback posts"
ON renotimeline_schema.feedback_posts
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM shared_schema.user_roles
        WHERE user_id = (SELECT auth.uid())
        AND app_name = 'renotimeline'
        AND role IN ('admin', 'moderator')
    )
)
WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM shared_schema.user_roles
        WHERE user_id = (SELECT auth.uid())
        AND app_name = 'renotimeline'
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Users can delete own feedback posts"
ON renotimeline_schema.feedback_posts
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Fix feedback_upvotes policies
DROP POLICY IF EXISTS "Authenticated users can upvote" ON renotimeline_schema.feedback_upvotes;
DROP POLICY IF EXISTS "Users can remove their own upvotes" ON renotimeline_schema.feedback_upvotes;

CREATE POLICY "Authenticated users can upvote"
ON renotimeline_schema.feedback_upvotes
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can remove their own upvotes"
ON renotimeline_schema.feedback_upvotes
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Fix feedback_comments policies
DROP POLICY IF EXISTS "Authenticated users can create comments" ON renotimeline_schema.feedback_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON renotimeline_schema.feedback_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON renotimeline_schema.feedback_comments;

CREATE POLICY "Authenticated users can create comments"
ON renotimeline_schema.feedback_comments
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own comments"
ON renotimeline_schema.feedback_comments
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments"
ON renotimeline_schema.feedback_comments
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
