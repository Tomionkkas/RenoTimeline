# Manual Testing Guide - CalcReno Integration Features

## Overview
Test the real production flow: when something happens in RenoTimeline, it should automatically create CalcReno notifications that would appear in both apps.

## 🎯 Real Production Testing

### What We're Testing
When you complete tasks, reach milestones, or update progress in RenoTimeline → CalcReno notifications are automatically created and sent to both apps.

## 🔥 Testing Scenarios (Real Actions)

### Scenario 1: Change Task Status (Kanban/Task Details)

**Where**: Kanban board or TaskDetailsDialog
**Action**: Drag task between columns OR open task details and change status
**Triggers**: `WorkflowTriggers.onTaskStatusChanged()` → `CalcRenoEventDetector.onTaskCompleted()`

**Expected Results**:
- ✅ CalcReno notification: "Task completed in RenoTimeline"
- ✅ Shows task name, project, and completion time
- ✅ Milestone detection if enough tasks completed

---

### Scenario 2: Create New Task

**Where**: Kanban board "Create Task" button OR CreateTaskDialog
**Action**: Create a new task in any project
**Triggers**: `WorkflowTriggers.onTaskCreated()` → `CalcRenoEventDetector.onTaskCompleted()`

**Expected Results**:
- ✅ CalcReno notification: "New task created in RenoTimeline"
- ✅ Shows task details and project assignment
- ✅ Updates project progress calculations

---

### Scenario 3: Assign Task to Team Member

**Where**: TaskAssignmentHelper component
**Action**: Assign any task to a team member
**Triggers**: `WorkflowTriggers.onTaskAssigned()` → `CalcRenoEventDetector.onTeamUpdate()`

**Expected Results**:
- ✅ CalcReno notification: "Task assignment updated"
- ✅ Shows who was assigned what task
- ✅ Team workload updates

---

### Scenario 4: Upload File to Project

**Where**: FileManager component
**Action**: Upload any file to a project
**Triggers**: `WorkflowTriggers.onFileUploaded()` → `CalcRenoEventDetector.onProgressUpdate()`

**Expected Results**:
- ✅ CalcReno notification: "File uploaded to project"
- ✅ Shows file name and project
- ✅ Progress tracking update

---

### Scenario 5: Update Custom Fields

**Where**: Any form with CustomFieldWorkflowWrapper
**Action**: Change any custom field value
**Triggers**: `WorkflowTriggers.onCustomFieldChanged()` → Various CalcReno events

**Expected Results**:
- ✅ CalcReno notification based on field type
- ✅ Shows field changes and impact
- ✅ Timeline/budget updates if relevant

## 🔍 Where to Check Results

### 1. Notification Center
- Navigate to `/notifications`
- Look for **CalcReno** tab with 📊 badge
- Verify notifications show with correct:
  - Project names
  - Event details
  - Timestamps
  - "CalcReno" source badge

### 2. Database Verification (Optional)
In Supabase dashboard:
- **Table: `cross_app_notifications`** - CalcReno-specific notifications
- **Table: `notifications`** - General notification entries
- **Table: `workflow_executions`** - Triggered automations

### 3. Browser Console
Open F12 and watch for:
- CalcRenoEventDetector logs
- Workflow trigger executions  
- Any error messages

## 🚀 Quick Test Sequence

1. **Open two browser tabs**:
   - Tab 1: RenoTimeline (your main app)
   - Tab 2: Notifications page (`/notifications`)

2. **In Tab 1, do real actions**:
   - Complete a task
   - Update project progress
   - Add team member
   - Change task status

3. **In Tab 2, watch for**:
   - New notifications appearing
   - CalcReno-specific notifications
   - Correct event data

4. **Check that it works like production**:
   - Events in RenoTimeline → Notifications for CalcReno
   - Real project data is included
   - Timestamps are accurate

## 🎯 Production Flow Simulation

### How it works in production:
```
RenoTimeline Action → Event Detection → Notification Created → CalcReno Receives
```

### What you're testing:
```
RenoTimeline Action → Event Detection → Notification Created → (you see it in /notifications)
```

The CalcReno app would receive these same notifications through the Supabase real-time connection.

## ✅ Success Checklist

- [ ] Task completion creates CalcReno notification
- [ ] Project progress updates generate notifications
- [ ] Team changes create notifications
- [ ] Milestone detection works automatically
- [ ] Notifications show in CalcReno tab
- [ ] Event data is complete and accurate
- [ ] Real-time updates work (notifications appear without refresh)
- [ ] Workflow automations trigger when expected

## 🐛 If Something's Not Working

**No notifications appearing?**
1. Check browser console for errors
2. Verify you're logged in
3. Ensure project has proper IDs
4. Check Supabase connection

**Notifications not in CalcReno tab?**
1. Look in "All" notifications tab first
2. Check notification `type` field
3. Verify CalcRenoNotificationHistory component is rendered

**Events not triggering?**
1. Ensure WorkflowTriggers are being called
2. Check CalcRenoEventDetector implementation
3. Verify database permissions

---

**Next Step**: Once this works perfectly, we connect the real CalcReno app to receive these same notifications! 