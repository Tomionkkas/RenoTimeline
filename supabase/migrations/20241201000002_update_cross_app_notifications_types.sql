-- Update cross_app_notifications table to match our NotificationType enum
-- This migration updates the type constraint to include all notification types we use

-- First, check if table exists, if not create it
CREATE TABLE IF NOT EXISTS cross_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  calcreno_project_id text NOT NULL,
  source_app text CHECK (source_app IN ('calcreno', 'renotimeline')) NOT NULL,
  type text CHECK (type IN (
    'task_completed',
    'milestone_reached', 
    'timeline_delay',
    'team_update',
    'progress_update',
    'budget_timeline_alert',
    'critical_issue',
    'timeline_updated',
    'project_status_changed',
    'task_moved'
  )) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  data jsonb,
  calcreno_reference_url text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Drop existing constraint if it exists and recreate with correct types
ALTER TABLE cross_app_notifications DROP CONSTRAINT IF EXISTS cross_app_notifications_type_check;
ALTER TABLE cross_app_notifications 
ADD CONSTRAINT cross_app_notifications_type_check 
CHECK (type IN (
  'task_completed',
  'milestone_reached', 
  'timeline_delay',
  'team_update',
  'progress_update',
  'budget_timeline_alert',
  'critical_issue',
  'timeline_updated',
  'project_status_changed',
  'task_moved'
));

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_cross_app_notifications_user_id ON cross_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_app_notifications_project_id ON cross_app_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_cross_app_notifications_calcreno_project_id ON cross_app_notifications(calcreno_project_id);
CREATE INDEX IF NOT EXISTS idx_cross_app_notifications_source_app ON cross_app_notifications(source_app);
CREATE INDEX IF NOT EXISTS idx_cross_app_notifications_unread ON cross_app_notifications(user_id, read) WHERE read = false;

-- Enable Row Level Security
ALTER TABLE cross_app_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own cross-app notifications" ON cross_app_notifications;
DROP POLICY IF EXISTS "Users can insert their own cross-app notifications" ON cross_app_notifications;
DROP POLICY IF EXISTS "Users can update their own cross-app notifications" ON cross_app_notifications;
DROP POLICY IF EXISTS "Users can delete their own cross-app notifications" ON cross_app_notifications;

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

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_cross_app_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS update_cross_app_notifications_updated_at ON cross_app_notifications;
CREATE TRIGGER update_cross_app_notifications_updated_at
  BEFORE UPDATE ON cross_app_notifications
  FOR EACH ROW EXECUTE FUNCTION update_cross_app_notifications_updated_at(); 