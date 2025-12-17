-- Fix RLS policies for renotimeline_schema.tasks to ensure DELETE operations work
-- This migration ensures users can delete tasks they have access to

-- Drop existing policies if they exist (to avoid conflicts)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow full access to project members" ON renotimeline_schema.tasks;
    DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON renotimeline_schema.tasks;
    DROP POLICY IF EXISTS "Project members can manage tasks" ON renotimeline_schema.tasks;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create comprehensive policy that allows SELECT, INSERT, UPDATE, and DELETE
-- for users who either:
-- 1. Own the project (via renotimeline_schema.projects.user_id)
-- 2. Have project roles (via shared_schema.user_roles with app_name = 'renotimeline')

CREATE POLICY "Project members have full access to tasks"
  ON renotimeline_schema.tasks
  FOR ALL TO authenticated
  USING (
    -- User owns the project
    EXISTS (
      SELECT 1 FROM renotimeline_schema.projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()
    )
    OR
    -- User has a project role
    EXISTS (
      SELECT 1 FROM shared_schema.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.app_name = 'renotimeline'
        AND ur.project_id = tasks.project_id
    )
  )
  WITH CHECK (
    -- Same conditions for INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM renotimeline_schema.projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM shared_schema.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.app_name = 'renotimeline'
        AND ur.project_id = tasks.project_id
    )
  );

-- Ensure RLS is enabled on the table
ALTER TABLE renotimeline_schema.tasks ENABLE ROW LEVEL SECURITY;
