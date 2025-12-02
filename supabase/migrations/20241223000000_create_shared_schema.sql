-- Phase 1.2: Create Shared Schema for Cross-App User Data
-- This migration creates the shared_schema with tables for cross-app user data

-- Create shared_schema
CREATE SCHEMA IF NOT EXISTS shared_schema;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA shared_schema TO authenticated;

-- Create profiles table in shared_schema (extends auth.users)
CREATE TABLE IF NOT EXISTS shared_schema.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  expertise text,
  timezone text DEFAULT 'Europe/Warsaw',
  language text DEFAULT 'pl',
  theme text DEFAULT 'dark',
  notification_preferences jsonb DEFAULT '{
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
  }'
);

-- Create app_preferences table for per-app settings
CREATE TABLE IF NOT EXISTS shared_schema.app_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name text NOT NULL CHECK (app_name IN ('renotimeline', 'calcreno', 'renoscout')),
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, app_name)
);

-- Create user_roles table for cross-app role management
CREATE TABLE IF NOT EXISTS shared_schema.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name text NOT NULL CHECK (app_name IN ('renotimeline', 'calcreno', 'renoscout')),
  role text NOT NULL CHECK (role IN ('user', 'admin', 'moderator')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, app_name)
);

-- Create audit_log table for security logging
CREATE TABLE IF NOT EXISTS shared_schema.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  app_name text,
  details jsonb DEFAULT '{}',
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id uuid,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create guest_sessions table for anonymous users
CREATE TABLE IF NOT EXISTS shared_schema.guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  location_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

-- Create user_push_tokens table for notifications
CREATE TABLE IF NOT EXISTS shared_schema.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name text NOT NULL CHECK (app_name IN ('renotimeline', 'calcreno', 'renoscout')),
  token text NOT NULL,
  device_type text CHECK (device_type IN ('web', 'ios', 'android')),
  device_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, app_name, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_profiles_email ON shared_schema.profiles(email);
CREATE INDEX IF NOT EXISTS idx_shared_profiles_name ON shared_schema.profiles(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_shared_app_preferences_user ON shared_schema.app_preferences(user_id, app_name);
CREATE INDEX IF NOT EXISTS idx_shared_user_roles_user ON shared_schema.user_roles(user_id, app_name);
CREATE INDEX IF NOT EXISTS idx_shared_audit_log_user ON shared_schema.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_audit_log_action ON shared_schema.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_shared_audit_log_created_at ON shared_schema.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_guest_sessions_token ON shared_schema.guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_shared_guest_sessions_active ON shared_schema.guest_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_push_tokens_user ON shared_schema.user_push_tokens(user_id, app_name);

-- Enable Row Level Security for all tables
ALTER TABLE shared_schema.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_schema.app_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_schema.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_schema.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_schema.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_schema.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON shared_schema.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON shared_schema.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for app_preferences table
CREATE POLICY "Users can view own app preferences" ON shared_schema.app_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app preferences" ON shared_schema.app_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own app preferences" ON shared_schema.app_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own app preferences" ON shared_schema.app_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view own roles" ON shared_schema.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user roles" ON shared_schema.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for audit_log table
CREATE POLICY "Users can view own audit log" ON shared_schema.audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON shared_schema.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for guest_sessions table
CREATE POLICY "Anyone can view guest sessions" ON shared_schema.guest_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert guest sessions" ON shared_schema.guest_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update guest sessions" ON shared_schema.guest_sessions
  FOR UPDATE USING (true);

-- RLS Policies for user_push_tokens table
CREATE POLICY "Users can view own push tokens" ON shared_schema.user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens" ON shared_schema.user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens" ON shared_schema.user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens" ON shared_schema.user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user profile creation in shared_schema
CREATE OR REPLACE FUNCTION shared_schema.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO shared_schema.profiles (id, first_name, last_name, email, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation in shared_schema
DROP TRIGGER IF EXISTS on_auth_user_created_shared ON auth.users;
CREATE TRIGGER on_auth_user_created_shared
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION shared_schema.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION shared_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_shared_profiles_updated_at
  BEFORE UPDATE ON shared_schema.profiles
  FOR EACH ROW EXECUTE FUNCTION shared_schema.update_updated_at_column();

CREATE TRIGGER update_shared_app_preferences_updated_at
  BEFORE UPDATE ON shared_schema.app_preferences
  FOR EACH ROW EXECUTE FUNCTION shared_schema.update_updated_at_column();

CREATE TRIGGER update_shared_user_roles_updated_at
  BEFORE UPDATE ON shared_schema.user_roles
  FOR EACH ROW EXECUTE FUNCTION shared_schema.update_updated_at_column();

CREATE TRIGGER update_shared_push_tokens_updated_at
  BEFORE UPDATE ON shared_schema.user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION shared_schema.update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shared_schema TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shared_schema TO authenticated;
