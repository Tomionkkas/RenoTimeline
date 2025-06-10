-- Create workflow_definitions table
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
    'task_status_changed',
    'task_created', 
    'task_assigned',
    'due_date_approaching',
    'custom_field_changed',
    'file_uploaded',
    'comment_added',
    'project_status_changed',
    'team_member_added',
    'scheduled'
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_executed TIMESTAMPTZ
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  executed_actions JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'partial')) DEFAULT 'success',
  error_message TEXT,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_project_id ON workflow_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_trigger_type ON workflow_definitions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_is_active ON workflow_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created_by ON workflow_definitions(created_by);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_time ON workflow_executions(execution_time);

-- Enable Row Level Security
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_definitions
CREATE POLICY "Users can view workflows in their projects" ON workflow_definitions
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflows in their projects" ON workflow_definitions
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_assignments 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workflows they created" ON workflow_definitions
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete workflows they created" ON workflow_definitions
  FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for workflow_executions
CREATE POLICY "Users can view executions in their projects" ON workflow_executions
  FOR SELECT
  USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions 
      WHERE project_id IN (
        SELECT project_id FROM project_assignments 
        WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert execution logs" ON workflow_executions
  FOR INSERT
  WITH CHECK (true); -- Allow system to log executions

CREATE POLICY "Users can update executions in their projects" ON workflow_executions
  FOR UPDATE
  USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions 
      WHERE project_id IN (
        SELECT project_id FROM project_assignments 
        WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete executions in their projects" ON workflow_executions
  FOR DELETE
  USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions 
      WHERE project_id IN (
        SELECT project_id FROM project_assignments 
        WHERE profile_id = auth.uid()
      )
    )
  );

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_definitions_updated_at 
  BEFORE UPDATE ON workflow_definitions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 