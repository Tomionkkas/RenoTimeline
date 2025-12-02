-- Setup Avatars Storage Bucket
-- Creates avatars bucket and policies for user avatar uploads

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow authenticated users to upload their own avatars
-- Path structure: avatars/{user_id}/{filename}
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- Allow users to view their own avatars and public access for profile display
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- Create function to clean up orphaned avatar files
CREATE OR REPLACE FUNCTION cleanup_orphaned_avatars()
RETURNS void AS $$
BEGIN
  -- Delete avatar files where the user no longer exists
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1]::uuid NOT IN (
    SELECT id::text FROM auth.users
  );
  
  -- Log cleanup activity
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    details
  ) VALUES (
    NULL,
    'CLEANUP',
    'storage_avatars',
    jsonb_build_object(
      'operation', 'cleanup_orphaned_avatars',
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to service role for cleanup
GRANT EXECUTE ON FUNCTION cleanup_orphaned_avatars() TO service_role;

-- Create function to get avatar URL for a user
CREATE OR REPLACE FUNCTION get_avatar_url(user_uuid uuid)
RETURNS TEXT AS $$
DECLARE
  avatar_path TEXT;
  base_url TEXT;
BEGIN
  -- Get the avatar path from profiles table
  SELECT avatar_url INTO avatar_path 
  FROM profiles 
  WHERE id = user_uuid;
  
  -- If no avatar_url is set, return null
  IF avatar_path IS NULL OR avatar_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- If it's already a full URL, return as is
  IF avatar_path LIKE 'http%' THEN
    RETURN avatar_path;
  END IF;
  
  -- Otherwise, construct the full URL
  -- This assumes the avatar_path is just the filename
  SELECT 
    CASE 
      WHEN current_setting('app.settings.supabase_url', true) IS NOT NULL 
      THEN current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/avatars/' || user_uuid::text || '/' || avatar_path
      ELSE 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/' || user_uuid::text || '/' || avatar_path
    END INTO base_url;
  
  RETURN base_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_avatar_url(uuid) TO authenticated;

-- Create function to update avatar URL in profile
CREATE OR REPLACE FUNCTION update_avatar_url(user_uuid uuid, new_avatar_url text)
RETURNS void AS $$
DECLARE
  old_avatar_url TEXT;
BEGIN
  -- Get current avatar URL
  SELECT avatar_url INTO old_avatar_url 
  FROM profiles 
  WHERE id = user_uuid;
  
  -- Update the avatar URL
  UPDATE profiles 
  SET 
    avatar_url = new_avatar_url,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Log the avatar change
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    details
  ) VALUES (
    user_uuid,
    'UPDATE',
    'avatar',
    user_uuid::text,
    jsonb_build_object('avatar_url', old_avatar_url),
    jsonb_build_object('avatar_url', new_avatar_url),
    jsonb_build_object(
      'operation', 'avatar_update',
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION update_avatar_url(uuid, text) TO authenticated;

-- Add trigger to clean up old avatar files when avatar_url changes
CREATE OR REPLACE FUNCTION cleanup_old_avatar()
RETURNS TRIGGER AS $$
DECLARE
  old_filename TEXT;
  old_path TEXT;
BEGIN
  -- Only proceed if avatar_url actually changed
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url 
     AND OLD.avatar_url IS NOT NULL 
     AND OLD.avatar_url != '' THEN
    
    -- Extract filename from old avatar URL
    old_filename := split_part(OLD.avatar_url, '/', -1);
    old_path := 'avatars/' || OLD.id::text || '/' || old_filename;
    
    -- Delete the old avatar file from storage
    -- This will be done asynchronously to avoid blocking the update
    PERFORM pg_notify(
      'cleanup_avatar',
      json_build_object(
        'user_id', OLD.id::text,
        'old_path', old_path,
        'old_url', OLD.avatar_url
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for old avatar cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_old_avatar ON profiles;
CREATE TRIGGER trigger_cleanup_old_avatar
  AFTER UPDATE OF avatar_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatar();

-- Comment the functions for documentation
COMMENT ON FUNCTION cleanup_orphaned_avatars() IS 'Removes avatar files for users that no longer exist';
COMMENT ON FUNCTION get_avatar_url(uuid) IS 'Returns the full public URL for a user avatar';
COMMENT ON FUNCTION update_avatar_url(uuid, text) IS 'Updates user avatar URL and logs the change';
COMMENT ON FUNCTION cleanup_old_avatar() IS 'Trigger function to clean up old avatar files when avatar URL changes'; 