-- Add CalcReno integration fields to projects table
ALTER TABLE projects 
ADD COLUMN source_app text CHECK (source_app IN ('renotimeline', 'calcreno')) DEFAULT 'renotimeline',
ADD COLUMN calcreno_project_id text,
ADD COLUMN calcreno_reference_url text,
ADD COLUMN imported_at timestamp with time zone;

-- Add index for CalcReno project lookups
CREATE INDEX idx_projects_calcreno_project_id ON projects(calcreno_project_id) WHERE calcreno_project_id IS NOT NULL;

-- Add RLS policy for CalcReno imported projects
CREATE POLICY "Users can view CalcReno projects they own or are assigned to"
ON projects FOR SELECT
USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT project_id FROM project_assignments 
    WHERE profile_id = auth.uid()
  )
); 