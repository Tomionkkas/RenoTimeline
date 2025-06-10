-- Create cross_app_notifications table for CalcReno ↔ RenoTimeline integration
CREATE TABLE cross_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  calcreno_project_id text NOT NULL,
  source_app text CHECK (source_app IN ('calcreno', 'renotimeline')) NOT NULL,
  type text CHECK (type IN ('budget_updated', 'cost_alert', 'project_milestone', 'material_price_change', 'task_completed', 'timeline_updated')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  data jsonb,
  calcreno_reference_url text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_cross_app_notifications_user_id ON cross_app_notifications(user_id);
CREATE INDEX idx_cross_app_notifications_project_id ON cross_app_notifications(project_id);
CREATE INDEX idx_cross_app_notifications_calcreno_project_id ON cross_app_notifications(calcreno_project_id);
CREATE INDEX idx_cross_app_notifications_source_app ON cross_app_notifications(source_app);
CREATE INDEX idx_cross_app_notifications_unread ON cross_app_notifications(user_id, read) WHERE read = false;

-- Enable Row Level Security
ALTER TABLE cross_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cross-app notifications"
ON cross_app_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cross-app notifications"
ON cross_app_notifications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cross-app notifications"
ON cross_app_notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cross-app notifications"
ON cross_app_notifications FOR DELETE
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cross_app_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cross_app_notifications_updated_at
  BEFORE UPDATE ON cross_app_notifications
  FOR EACH ROW EXECUTE FUNCTION update_cross_app_notifications_updated_at(); 