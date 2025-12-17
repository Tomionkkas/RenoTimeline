-- Create a view in renotimeline_schema that joins task_assignments with profiles
-- This allows PostgREST to query the data easily without cross-schema join issues

CREATE OR REPLACE VIEW renotimeline_schema.task_assignments_with_profiles AS
SELECT
    ta.id,
    ta.task_id,
    ta.user_id,
    ta.role,
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
