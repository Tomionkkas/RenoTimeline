-- Add support for assigning tasks to team members (non-user contacts) in addition to users
-- This allows tasks to be assigned to contractors/workers who don't have RenoTimeline accounts

-- Add team_member_id column to reference team_members table
ALTER TABLE renotimeline_schema.task_assignments
ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES shared_schema.team_members(id) ON DELETE CASCADE;

-- Make user_id nullable since we now support team members
ALTER TABLE renotimeline_schema.task_assignments
ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint to ensure either user_id OR team_member_id is set (but not both)
ALTER TABLE renotimeline_schema.task_assignments
ADD CONSTRAINT task_assignments_user_or_team_member_check
CHECK (
    (user_id IS NOT NULL AND team_member_id IS NULL) OR
    (user_id IS NULL AND team_member_id IS NOT NULL)
);

-- Update the unique constraint to include team_member_id
ALTER TABLE renotimeline_schema.task_assignments
DROP CONSTRAINT IF EXISTS task_assignments_task_id_user_id_key;

-- Add new unique constraint that handles both user_id and team_member_id
CREATE UNIQUE INDEX task_assignments_task_user_unique
ON renotimeline_schema.task_assignments(task_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX task_assignments_task_team_member_unique
ON renotimeline_schema.task_assignments(task_id, team_member_id)
WHERE team_member_id IS NOT NULL;

-- Drop and recreate the view to include team_member data
DROP VIEW IF EXISTS renotimeline_schema.task_assignments_with_profiles;

CREATE OR REPLACE VIEW renotimeline_schema.task_assignments_with_profiles AS
SELECT
    ta.id,
    ta.task_id,
    ta.user_id,
    ta.team_member_id,
    ta.assignment_order,
    ta.created_at,
    ta.updated_at,
    -- User profile data (for actual RenoTimeline users)
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.expertise as user_expertise,
    -- Team member data (for non-user contacts)
    tm.first_name as team_member_first_name,
    tm.last_name as team_member_last_name,
    tm.expertise as team_member_expertise,
    -- Combined fields for easy access
    COALESCE(p.first_name, tm.first_name) as first_name,
    COALESCE(p.last_name, tm.last_name) as last_name,
    COALESCE(p.expertise, tm.expertise) as expertise
FROM renotimeline_schema.task_assignments ta
LEFT JOIN shared_schema.profiles p ON ta.user_id = p.id
LEFT JOIN shared_schema.team_members tm ON ta.team_member_id = tm.id;

-- Grant access to the view
GRANT SELECT ON renotimeline_schema.task_assignments_with_profiles TO authenticated;
GRANT SELECT ON renotimeline_schema.task_assignments_with_profiles TO anon;

-- Enable RLS on the view (inherits from task_assignments)
ALTER VIEW renotimeline_schema.task_assignments_with_profiles SET (security_invoker = true);

-- Drop the triggers first before dropping the function
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_insert ON renotimeline_schema.task_assignments;
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_update ON renotimeline_schema.task_assignments;
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_delete ON renotimeline_schema.task_assignments;

-- Now we can drop and recreate the sync function to handle team members
DROP FUNCTION IF EXISTS renotimeline_schema.sync_task_assigned_to();

CREATE OR REPLACE FUNCTION renotimeline_schema.sync_task_assigned_to()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Recreate the triggers

CREATE TRIGGER sync_task_assigned_to_on_insert
    AFTER INSERT ON renotimeline_schema.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.sync_task_assigned_to();

CREATE TRIGGER sync_task_assigned_to_on_update
    AFTER UPDATE ON renotimeline_schema.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.sync_task_assigned_to();

CREATE TRIGGER sync_task_assigned_to_on_delete
    AFTER DELETE ON renotimeline_schema.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.sync_task_assigned_to();
