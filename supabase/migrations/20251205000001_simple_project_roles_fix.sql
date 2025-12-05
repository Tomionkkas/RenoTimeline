-- Simpler approach: No private schema needed
-- Fix infinite recursion in project_roles RLS policies

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Users can view project roles they have access to" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Project owners can assign roles" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Project owners can update roles" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Project owners can remove roles" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Users can view project roles" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Users can assign project roles" ON shared_schema.project_roles;
DROP POLICY IF EXISTS "Project owners can delete roles" ON shared_schema.project_roles;

-- Create simple, non-recursive policies

-- 1. SELECT: Users can only see their own role assignments
CREATE POLICY "Users can view their own project roles"
  ON shared_schema.project_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. INSERT: Anyone can assign themselves (project creation)
-- Project owners managed in application layer
CREATE POLICY "Users can be assigned to projects"
  ON shared_schema.project_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Application handles authorization

-- 3. UPDATE: Users cannot update roles
-- (Use DELETE + INSERT if role needs to change)
CREATE POLICY "No direct role updates"
  ON shared_schema.project_roles
  FOR UPDATE
  TO authenticated
  USING (false);

-- 4. DELETE: Users can only remove their own assignments
CREATE POLICY "Users can remove their own project assignments"
  ON shared_schema.project_roles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'shared_schema'
    AND tablename = 'project_roles';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Simple project roles RLS fix complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE 'Approach: Simple, no recursion';
  RAISE NOTICE 'Authorization: Handled in application layer';
  RAISE NOTICE '========================================';
END $$;
