-- Add missing INSERT policy for shared_schema.profiles
-- Users were unable to create profiles during signup due to missing INSERT RLS policy

CREATE POLICY "Users can insert own profile"
ON shared_schema.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also add INSERT policy for app_preferences (shared across CalcReno and RenoTimeline)
CREATE POLICY "Users can insert own app preferences"
ON shared_schema.app_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
