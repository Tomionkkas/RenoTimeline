-- Enhanced User Profiles Migration
-- Adds timezone, language, theme, and notification preferences to profiles
-- Creates user_sessions and audit_log tables for security tracking

-- Add new columns to profiles table for enhanced user preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Warsaw';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pl';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "push_notifications": true,
  "task_reminders": true,
  "project_updates": true,
  "team_mentions": true,
  "workflow_alerts": true,
  "quiet_hours": {
    "enabled": false,
    "start": "22:00",
    "end": "08:00"
  }
}';

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create audit_log table for security and change tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (user_id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log (resource_type, resource_id);

-- Enable Row Level Security for new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions table
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audit_log table
CREATE POLICY "Users can view own audit log" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow service role to insert audit logs for security
CREATE POLICY "Service role can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create function to automatically log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if there are actual changes
  IF OLD IS DISTINCT FROM NEW THEN
    INSERT INTO audit_log (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      details
    ) VALUES (
      NEW.id,
      TG_OP,
      'profile',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes audit
DROP TRIGGER IF EXISTS trigger_log_profile_changes ON profiles;
CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Delete sessions older than 30 days
  DELETE FROM user_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's active session count
CREATE OR REPLACE FUNCTION get_active_session_count(user_uuid uuid)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_sessions
    WHERE user_id = user_uuid 
    AND is_active = true 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT ON audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION get_active_session_count(uuid) TO authenticated;

-- Create view for user session summary
CREATE OR REPLACE VIEW user_session_summary AS
SELECT 
  us.user_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active_sessions,
  MAX(last_active) as last_activity,
  MIN(created_at) as first_session
FROM user_sessions us
GROUP BY us.user_id;

-- Grant access to the view
GRANT SELECT ON user_session_summary TO authenticated;

-- Add RLS policy for the view
ALTER VIEW user_session_summary SET (security_invoker = true);

-- Comment the tables for documentation
COMMENT ON TABLE user_sessions IS 'Tracks user authentication sessions for security monitoring';
COMMENT ON TABLE audit_log IS 'Logs all significant user actions and system changes for security auditing';
COMMENT ON COLUMN profiles.timezone IS 'User preferred timezone for displaying dates and times';
COMMENT ON COLUMN profiles.language IS 'User preferred language for the application interface';
COMMENT ON COLUMN profiles.theme IS 'User preferred theme (dark/light) for the application';
COMMENT ON COLUMN profiles.notification_preferences IS 'JSON object containing all user notification preferences'; 