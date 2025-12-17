-- Add foreign key from task_assignments.user_id to shared_schema.profiles.id
ALTER TABLE renotimeline_schema.task_assignments
ADD CONSTRAINT task_assignments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES shared_schema.profiles(id)
ON DELETE CASCADE;
