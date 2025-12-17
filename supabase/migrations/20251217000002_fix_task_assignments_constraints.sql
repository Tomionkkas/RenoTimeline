-- Fix unique constraint issues with task_assignments
-- The previous migration didn't properly handle the assignment_order unique constraint

-- Drop the old unique constraint on (task_id, assignment_order)
-- This constraint prevents multiple members from having the same order
ALTER TABLE renotimeline_schema.task_assignments
DROP CONSTRAINT IF EXISTS task_assignments_task_id_assignment_order_key;

-- We don't actually need assignment_order to be unique anymore
-- Multiple assignments can exist for a task, just ordered by assignment_order
-- Remove the unique index we created earlier
DROP INDEX IF EXISTS renotimeline_schema.task_assignments_task_user_unique;
DROP INDEX IF EXISTS renotimeline_schema.task_assignments_task_team_member_unique;

-- Create a composite unique index that allows the same team member/user only once per task
-- But allows multiple assignments with different orders
CREATE UNIQUE INDEX IF NOT EXISTS task_assignments_task_user_unique
ON renotimeline_schema.task_assignments(task_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS task_assignments_task_team_member_unique
ON renotimeline_schema.task_assignments(task_id, team_member_id)
WHERE team_member_id IS NOT NULL;

-- Create non-unique index on assignment_order for sorting performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_order
ON renotimeline_schema.task_assignments(task_id, assignment_order);
