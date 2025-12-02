# Deployment Instructions: RenoTimeline CalcReno Integration

## 🎯 **Current Status**
✅ **RenoTimeline Code**: CalcReno integration enabled and ready  
✅ **Edge Function**: Created but needs deployment  
✅ **Migrations**: Created but need to be applied  
🔄 **Database**: Needs migrations applied manually  

## 📋 **Step 1: Apply Database Migrations**

You need to apply the migrations to your Supabase database. You can do this in two ways:

### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref hbqnnpqgdwkbxrxnrcuk

# Apply migrations
supabase db push
```

### Option B: Manual SQL Execution
Go to your Supabase Dashboard → SQL Editor and run these migrations in order:

1. **Run `20241201000000_add_calcreno_integration.sql`**
2. **Run `20241201000001_add_cross_app_notifications.sql`**
3. **Run `20241201000002_update_cross_app_notifications_types.sql`**

## 📋 **Step 2: Deploy Edge Function**

Deploy the CalcReno notification function:

```bash
# Deploy the function
supabase functions deploy create-calcreno-notification

# Or if you prefer, upload manually via Supabase Dashboard
```

The function is located at: `supabase/functions/create-calcreno-notification/index.ts`

## 📋 **Step 3: Test the Integration**

### Test in RenoTimeline:
1. Open RenoTimeline
2. Move a task to "Ukończone" (completed)
3. Check browser console for:
   - `🧪 CalcReno Event: Task Completed`
   - `✅ Cross-app notification sent to CalcReno`

### Check Database:
Go to Supabase Dashboard → Table Editor → `notifications` or `cross_app_notifications`  
Look for new records with `[CalcReno]` prefix or `is_calcreno_notification: true`

## 🔄 **What Happens Without Migrations**

**Current Fallback Behavior**:
- RenoTimeline creates notifications in the existing `notifications` table
- Notifications have `[CalcReno]` prefix in title
- Metadata includes `is_calcreno_notification: true`
- CalcReno can still receive these via real-time subscriptions

**After Migrations**:
- RenoTimeline uses dedicated `cross_app_notifications` table
- Better performance and structure
- Cleaner separation of concerns

## 🧪 **Testing Commands**

```bash
# Test Edge Function manually
curl -X POST 'https://hbqnnpqgdwkbxrxnrcuk.supabase.co/functions/v1/create-calcreno-notification' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"notification_data": {"user_id": "test", "project_id": "test", "title": "Test", "message": "Test message", "type": "task_completed"}}'
```

## 🚨 **Important Notes**

1. **User Authentication**: Make sure both apps use the same Supabase user authentication
2. **Environment Variables**: CalcReno needs the same Supabase project credentials
3. **Real-time**: CalcReno should subscribe to the appropriate table (`notifications` or `cross_app_notifications`)

## 🎯 **Expected Flow After Setup**

```
User completes task in RenoTimeline
  ↓
CalcRenoEventDetector triggers
  ↓
Edge Function creates notification in cross_app_notifications table
  ↓
Supabase real-time sends to CalcReno
  ↓
CalcReno displays Polish notification with cost data
```

Once you complete these steps, the integration will be fully functional! 🚀 