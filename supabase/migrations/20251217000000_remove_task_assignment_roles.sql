-- Remove the role (lead/helper) concept from task_assignments
-- Keep assignment_order for visual ordering but remove role distinction

-- Drop the view first so we can modify the table
DROP VIEW IF EXISTS renotimeline_schema.task_assignments_with_profiles;

-- Drop triggers that reference the role column
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_insert ON renotimeline_schema.task_assignments;
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_update ON renotimeline_schema.task_assignments;
DROP TRIGGER IF EXISTS sync_task_assigned_to_on_delete ON renotimeline_schema.task_assignments;

-- Drop the old sync function
DROP FUNCTION IF EXISTS renotimeline_schema.sync_task_assigned_to();

-- Remove the role column from task_assignments table
ALTER TABLE renotimeline_schema.task_assignments
DROP COLUMN IF EXISTS role;

-- Recreate the sync function without role references
-- This function syncs the first assignment (by order) with tasks.assigned_to for backwards compatibility
CREATE OR REPLACE FUNCTION renotimeline_schema.sync_task_assigned_to()
RETURNS TRIGGER AS $$
BEGIN
    -- When inserting or updating, sync the first assignment to tasks.assigned_to
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE renotimeline_schema.tasks
        SET assigned_to = (
            SELECT user_id
            FROM renotimeline_schema.task_assignments
            WHERE task_id = NEW.task_id
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

-- Recreate the view without the role column
CREATE OR REPLACE VIEW renotimeline_schema.task_assignments_with_profiles AS
SELECT
    ta.id,
    ta.task_id,
    ta.user_id,
    ta.assignment_order,
    ta.created_at,
    ta.updated_at,
    p.first_name,
    p.last_name,
    p.expertise
FROM renotimeline_schema.task_assignments ta
LEFT JOIN shared_schema.profiles p ON ta.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON renotimeline_schema.task_assignments_with_profiles TO authenticated;
GRANT SELECT ON renotimeline_schema.task_assignments_with_profiles TO anon;

-- Enable RLS on the view (inherits from task_assignments)
ALTER VIEW renotimeline_schema.task_assignments_with_profiles SET (security_invoker = true);
