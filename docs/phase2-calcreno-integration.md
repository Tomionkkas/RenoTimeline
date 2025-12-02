# Phase 2: CalcReno ↔ RenoTimeline Smart Notifications

## 🎯 Overview

Phase 2 implements smart, event-driven notifications from RenoTimeline to CalcReno, enabling proactive project management and cross-app insights.

## 📊 Implementation Status

### ✅ Completed Components

1. **Event Detection System** (`CalcRenoEventDetector`)
   - Task completion detection
   - Milestone tracking (25%, 50%, 75%, 100%)
   - Timeline delay detection
   - Team update monitoring
   - Progress reporting

2. **Notification Generation** (`NotificationTemplates`)
   - Polish language templates
   - Rich context data (cost impacts, timeline changes)
   - Suggested actions with deep links
   - Priority-based classification

3. **Workflow Integration** (`WorkflowTriggers`)
   - Integrated with existing RenoTimeline workflow system
   - Automatic CalcReno notifications on task status changes
   - Team assignment notifications
   - Progress update triggers

4. **UI Components** (`CalcRenoNotificationHistory`)
   - Debug notification history viewer
   - Mock data for development
   - Action buttons and correlation data display
   - Priority indicators and formatting

5. **Configuration System** (`calcRenoIntegration.ts`)
   - Centralized settings management
   - Cost calculation parameters
   - Deep linking configuration
   - Event thresholds and filters

## 🔧 Technical Architecture

### Event Flow
```
RenoTimeline Event → WorkflowTriggers → CalcRenoEventDetector → NotificationGeneration → Database Storage
```

### Key Components

#### 1. CalcRenoEventDetector
```typescript
// Main event detection service
class CalcRenoEventDetector {
  static async onTaskCompleted(taskId, projectId, taskTitle, estimatedHours?, actualHours?)
  static async onMilestoneReached(projectId, milestoneName, completionPercentage, tasksCompleted, totalTasks)
  static async onTimelineDelay(projectId, delayDays, originalEndDate, newEndDate, delayReason, affectedTaskIds)
  static async onTeamUpdate(projectId, updateType, memberName, memberId, details)
  static async onProgressUpdate(projectId, completionPercentage, tasksCompletedToday)
  static async checkForMilestones(projectId) // Auto-milestone detection
}
```

#### 2. Notification Types
- `task_completed` - Task marked as done
- `milestone_reached` - Project reaches 25%, 50%, 75%, or 100%
- `timeline_delay` - Project timeline extended/delayed
- `budget_timeline_alert` - Timeline impacts budget
- `team_update` - Team member changes
- `critical_issue` - High-priority problems
- `progress_update` - Regular progress reports
- `timeline_updated` - Schedule changes
- `project_status_changed` - Project status modifications

#### 3. Notification Structure
```typescript
interface RenoTimelineNotification {
  id: string;
  project_id: string;
  calcreno_project_id: string;
  source_app: 'renotimeline';
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  suggested_actions: SuggestedAction[];
  correlation_data?: CorrelationData;
  created_at: string;
  user_id: string;
}
```

## 🚀 Event Triggers

### Automatic Triggers

1. **Task Status Changes**
   ```typescript
   // In TaskDetailsDialog.tsx
   await WorkflowTriggers.onTaskStatusChanged(taskId, projectId, fromStatus, toStatus, userId);
   // → Automatically triggers CalcReno notification if toStatus === 'done'
   ```

2. **Milestone Detection**
   ```typescript
   // Automatically checks after each task completion
   await CalcRenoEventDetector.checkForMilestones(projectId);
   ```

3. **Team Updates**
   ```typescript
   // When assigning tasks
   await WorkflowTriggers.onTaskAssigned(taskId, projectId, toUser, assignedBy, fromUser);
   ```

### Manual Triggers

1. **Timeline Changes**
   ```typescript
   await WorkflowTriggers.onProjectTimelineUpdated(projectId, 'delay', {
     originalEndDate: '2024-03-15',
     newEndDate: '2024-03-18',
     delayDays: 3,
     reason: 'Opóźnienie dostawy materiałów',
     affectedTaskIds: ['task-1', 'task-2']
   });
   ```

2. **Team Updates**
   ```typescript
   await WorkflowTriggers.onProjectTeamUpdated(projectId, 'member_added', 'Jan Kowalski', 'user-123', 'Dodano elektryka do zespołu');
   ```

## 📋 Notification Templates (Polish)

### Task Completion
```
✅ Zadanie ukończone - {task_title}
Zadanie "{task_title}" zostało ukończone w projekcie {project_name}.

Sugerowane akcje:
- Sprawdź czy czas pracy był zgodny z kalkulacją
- Sprawdź czy są oszczędności na kosztach robocizny
```

### Milestone Reached
```
🎯 Osiągnięto milestone - {milestone_name}
Projekt {project_name} osiągnął {completion_percentage}% ukończenia.

Sugerowane akcje:
- Zaktualizuj status budżetu w CalcReno
- Przejrzyj planowanie następnej fazy
```

### Timeline Delay
```
⚠️ Opóźnienie w projekcie {project_name}
Projekt ma {delay_days}-dniowe opóźnienie. Nowa data zakończenia: {new_end_date}.

Sugerowane akcje:
- Dodatkowe {delay_days} dni robocizny ekipy
- Sprawdź czy klient wymaga rekompensaty
```

## 💾 Database Schema

### Cross-App Notifications Table
```sql
CREATE TABLE cross_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_id uuid REFERENCES projects(id) NOT NULL,
  calcreno_project_id text NOT NULL,
  source_app text CHECK (source_app IN ('calcreno', 'renotimeline')) NOT NULL,
  type text CHECK (type IN ('task_completed', 'milestone_reached', 'timeline_delay', ...)) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  data jsonb,
  calcreno_reference_url text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Projects Table Extensions
```sql
ALTER TABLE projects 
ADD COLUMN source_app text CHECK (source_app IN ('renotimeline', 'calcreno')) DEFAULT 'renotimeline',
ADD COLUMN calcreno_project_id text,
ADD COLUMN calcreno_reference_url text,
ADD COLUMN imported_at timestamp with time zone;
```

## 🔧 Configuration

### Environment Settings
```typescript
const config = {
  notifications: {
    enabled: true,
    debug_mode: true, // Shows notifications even for non-linked projects
    milestone_thresholds: [25, 50, 75, 100],
    progress_update_frequency: 'milestone_only',
    delay_alert_threshold_days: 1
  },
  cost_estimates: {
    default_hourly_rate: 150, // PLN
    default_daily_project_cost: 800, // PLN
    currency: 'PLN'
  }
};
```

## 🎨 UI Components

### Notification History Viewer
```typescript
<CalcRenoNotificationHistory 
  projectId={projectId} // Optional - filter by project
  maxItems={10}
  showActions={true}
/>
```

Features:
- Mock data for development
- Priority indicators (🔴 High, 🔵 Medium, 🟢 Low)
- Relative timestamps ("2 godz. temu")
- Expandable correlation data
- Action buttons with deep links

## 🔗 Deep Linking

### CalcReno URLs
```
/project/{calcreno_project_id}/costs
/project/{calcreno_project_id}/budget
/project/{calcreno_project_id}/summary
/project/{calcreno_project_id}/penalties
```

### RenoTimeline URLs
```
/project/{project_id}
/project/{project_id}/timeline
/project/{project_id}/tasks
```

## 📊 Correlation Data

Each notification includes:
```typescript
interface CorrelationData {
  estimated_cost_impact?: number; // PLN
  timeline_change_days?: number;
  affected_tasks?: string[];
  progress_percentage?: number;
  delay_reason?: string;
  budget_variance?: number;
  team_members?: string[];
}
```

## 🚧 Current Limitations

1. **Database Schema**: Migrations not yet applied to production
2. **Real Data**: Currently using mock/placeholder data
3. **Authentication**: No user mapping validation yet
4. **CalcReno Integration**: No actual deep linking (URLs are placeholders)
5. **Real-time Updates**: Supabase Realtime not yet configured

## 🎯 Next Steps (Phase 3)

1. **Apply Database Migrations**
   ```bash
   supabase db push
   supabase gen types typescript --local
   ```

2. **Enable Real Notifications**
   - Uncomment database insertion code in `CalcRenoEventDetector`
   - Remove mock data from UI components

3. **Add Real-time Updates**
   ```typescript
   supabase
     .channel('cross_app_notifications')
     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cross_app_notifications' }, 
       (payload) => handleNewNotification(payload.new))
     .subscribe();
   ```

4. **User Authentication Integration**
   - Map RenoTimeline users to CalcReno users
   - Implement proper user verification

5. **CalcReno Integration**
   - Real deep linking to CalcReno app
   - Webhook/API integration for bidirectional communication

## 🧪 Testing Workflow

### Manual Testing
```typescript
// Test task completion
await CalcRenoEventDetector.onTaskCompleted('task-123', 'project-456', 'Test zadanie', 8, 10);

// Test milestone
await CalcRenoEventDetector.onMilestoneReached('project-456', 'Połowa projektu', 50, 12, 24);

// Test delay
await CalcRenoEventDetector.onTimelineDelay('project-456', 3, '2024-03-15', '2024-03-18', 'Opóźnienie dostaw', ['task-1']);
```

### Integration Testing
1. Create/complete tasks in RenoTimeline
2. Check console logs for notification generation
3. View notification history in UI component
4. Verify suggested actions and correlation data

## 📈 Success Metrics

- ✅ Event detection triggers properly on workflow actions
- ✅ Notification templates generate correct Polish content
- ✅ Priority calculation works based on event significance
- ✅ UI displays notifications with proper formatting
- ✅ Configuration system allows easy customization
- ✅ Mock data demonstrates full notification lifecycle

## 🔧 Integration Points

### Current Integration
- `TaskDetailsDialog.tsx` → `WorkflowTriggers.onTaskStatusChanged()`
- `WorkflowTriggers` → `CalcRenoEventDetector`
- Automatic milestone detection on task completion

### Future Integration Points
- Project creation/status changes
- Timeline/deadline modifications
- Team member additions/removals
- File uploads and document changes
- Budget/cost updates
- Client communication events

This completes Phase 2 implementation for RenoTimeline → CalcReno smart notifications. The system is ready for database schema application and real-world testing. 