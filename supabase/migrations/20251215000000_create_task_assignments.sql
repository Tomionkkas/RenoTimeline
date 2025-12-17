-- Create task_assignments table to support multiple team members per task
-- The first assignment (assignment_order = 1) is the lead, others are helpers

CREATE TABLE IF NOT EXISTS renotimeline_schema.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES renotimeline_schema.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('lead', 'helper')),
    assignment_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure each user is only assigned once per task
    UNIQUE(task_id, user_id),
    -- Ensure assignment order is unique per task
    UNIQUE(task_id, assignment_order)
);

-- Create indexes for performance
CREATE INDEX idx_task_assignments_task_id ON renotimeline_schema.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON renotimeline_schema.task_assignments(user_id);
CREATE INDEX idx_task_assignments_role ON renotimeline_schema.task_assignments(role);

-- Enable RLS
ALTER TABLE renotimeline_schema.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view assignments for tasks in their projects
CREATE POLICY "Users can view task assignments in their projects"
ON renotimeline_schema.task_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

-- Project owners and team members can insert task assignments
CREATE POLICY "Project members can create task assignments"
ON renotimeline_schema.task_assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

-- Project owners and team members can update task assignments
CREATE POLICY "Project members can update task assignments"
ON renotimeline_schema.task_assignments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

-- Project owners and team members can delete task assignments
CREATE POLICY "Project members can delete task assignments"
ON renotimeline_schema.task_assignments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM renotimeline_schema.tasks t
        INNER JOIN renotimeline_schema.projects p ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND (
            p.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM shared_schema.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.project_id = p.id
                AND ur.app_name = 'renotimeline'
            )
        )
    )
);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION renotimeline_schema.update_task_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER task_assignments_updated_at
    BEFORE UPDATE ON renotimeline_schema.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION renotimeline_schema.update_task_assignments_updated_at();

-- Function to sync the first assignment (lead) with the tasks.assigned_to field for backwards compatibility
CREATE OR REPLACE FUNCTION renotimeline_schema.sync_task_assigned_to()
RETURNS TRIGGER AS $$
BEGIN
    -- When inserting or updating, sync the lead assignment to tasks.assigned_to
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Find the lead (assignment_order = 1) and update tasks.assigned_to
        UPDATE renotimeline_schema.tasks
        SET assigned_to = (
            SELECT user_id
            FROM renotimeline_schema.task_assignments
            WHERE task_id = NEW.task_id
            AND role = 'lead'
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
            AND role = 'lead'
            ORDER BY assignment_order
            LIMIT 1
        )
        WHERE id = OLD.task_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync tasks.assigned_to with the lead assignment
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
