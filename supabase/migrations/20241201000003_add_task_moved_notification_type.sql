-- Add missing 'task_moved' notification type to cross_app_notifications constraint
-- This fixes the issue where task movement notifications cannot be saved

-- Drop existing constraint and recreate with all notification types including task_moved
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