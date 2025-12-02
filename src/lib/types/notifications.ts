// Cross-app notification types for CalcReno ↔ RenoTimeline integration

export interface RenoTimelineNotification {
  id: string;
  project_id: string; // RenoTimeline project ID
  calcreno_project_id: string; // Link to CalcReno project
  source_app: 'calcreno' | 'renotimeline';
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  suggested_actions: SuggestedAction[];
  correlation_data?: CorrelationData;
  calcreno_reference_url?: string;
  renotimeline_reference_url?: string;
  created_at: string;
  read: boolean;
  user_id: string;
}

export type NotificationType = 
  | 'task_completed'
  | 'milestone_reached'
  | 'timeline_delay'
  | 'budget_timeline_alert'
  | 'team_update'
  | 'critical_issue'
  | 'progress_update'
  | 'timeline_updated'
  | 'project_status_changed'
  | 'task_moved';

export interface SuggestedAction {
  action: string;
  description: string;
  calcreno_url?: string; // Deep link to CalcReno
  renotimeline_url?: string; // Deep link to RenoTimeline
}

export interface CorrelationData {
  estimated_cost_impact?: number;
  timeline_change_days?: number;
  affected_tasks?: string[];
  progress_percentage?: number;
  delay_reason?: string;
  budget_variance?: number;
  team_members?: string[];
}

// Event data structures for different notification types
export interface TaskCompletionEvent {
  task_id: string;
  task_title: string;
  completion_date: string;
  estimated_hours?: number;
  actual_hours?: number;
  assigned_user?: string;
}

export interface MilestoneEvent {
  milestone_name: string;
  completion_percentage: number;
  planned_date: string;
  actual_date: string;
  tasks_completed: number;
  total_tasks: number;
}

export interface TimelineDelayEvent {
  delay_days: number;
  original_end_date: string;
  new_end_date: string;
  affected_tasks: string[];
  delay_reason: string;
}

export interface TeamUpdateEvent {
  update_type: 'member_added' | 'member_removed' | 'role_changed' | 'availability_changed';
  member_name: string;
  member_id: string;
  details: string;
}

export interface ProgressUpdateEvent {
  completion_percentage: number;
  tasks_completed_today: number;
  upcoming_milestones: string[];
  budget_status: 'on_track' | 'under_budget' | 'over_budget';
}

// Template data for notification generation
export interface NotificationTemplate {
  title_template: string;
  message_template: string;
  priority: 'low' | 'medium' | 'high';
  suggested_actions_template: SuggestedAction[];
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  task_completed: {
    title_template: '✅ Zadanie ukończone - {{task_title}}',
    message_template: 'Zadanie "{{task_title}}" zostało ukończone w projekcie {{project_name}}. Sprawdź postęp i zaktualizuj kalkulacje kosztów.',
    priority: 'medium',
    suggested_actions_template: [
      {
        action: 'update_cost_estimate',
        description: 'Sprawdź czy czas pracy był zgodny z kalkulacją',
        calcreno_url: '/project/{{calcreno_project_id}}/costs'
      },
      {
        action: 'check_savings',
        description: 'Sprawdź czy są oszczędności na kosztach robocizny',
        calcreno_url: '/project/{{calcreno_project_id}}/summary'
      }
    ]
  },
  milestone_reached: {
    title_template: '🎯 Kamień milowy - {{milestone_name}}',
    message_template: 'Gratulacje! Projekt {{project_name}} osiągnął {{completion_percentage}}% ukończenia. Czas przejrzeć budżet.',
    priority: 'high',
    suggested_actions_template: [
      {
        action: 'update_budget_status',
        description: 'Zaktualizuj status budżetu w CalcReno',
        calcreno_url: '/project/{{calcreno_project_id}}/budget'
      },
      {
        action: 'review_next_phase',
        description: 'Przejrzyj planowanie następnej fazy',
        renotimeline_url: '/project/{{project_id}}/timeline'
      }
    ]
  },
  timeline_delay: {
    title_template: '⚠️ Opóźnienie w projekcie',
    message_template: 'Projekt {{project_name}} ma opóźnienie o {{delay_days}} dni. Sprawdź wpływ na budżet i harmonogram.',
    priority: 'high',
    suggested_actions_template: [
      {
        action: 'update_cost_estimate',
        description: 'Zaktualizuj koszty z uwzględnieniem opóźnienia',
        calcreno_url: '/project/{{calcreno_project_id}}/costs'
      },
      {
        action: 'check_penalty_costs',
        description: 'Sprawdź czy klient wymaga rekompensaty',
        calcreno_url: '/project/{{calcreno_project_id}}/penalties'
      }
    ]
  },
  budget_timeline_alert: {
    title_template: '💰 Alert budżetowo-czasowy - {{project_name}}',
    message_template: 'Projekt {{project_name}} przekracza zaplanowane ramy czasowe, co może wpłynąć na budżet.',
    priority: 'high',
    suggested_actions_template: [
      {
        action: 'recalculate_budget',
        description: 'Przelicz budżet z uwzględnieniem opóźnień',
        calcreno_url: '/project/{{calcreno_project_id}}/recalculate'
      }
    ]
  },
  team_update: {
    title_template: '👥 Aktualizacja zespołu - {{project_name}}',
    message_template: 'Zespół projektu {{project_name}}: {{update_details}}.',
    priority: 'medium',
    suggested_actions_template: [
      {
        action: 'update_labor_costs',
        description: 'Zaktualizuj koszty robocizny',
        calcreno_url: '/project/{{calcreno_project_id}}/labor'
      }
    ]
  },
  critical_issue: {
    title_template: '🚨 Krytyczny problem - {{project_name}}',
    message_template: 'Wykryto krytyczny problem w projekcie {{project_name}} wymagający uwagi w kosztorysie.',
    priority: 'high',
    suggested_actions_template: [
      {
        action: 'emergency_review',
        description: 'Pilny przegląd kosztorysu',
        calcreno_url: '/project/{{calcreno_project_id}}/emergency'
      }
    ]
  },
  progress_update: {
    title_template: '📊 Postęp projektu',
    message_template: 'Projekt {{project_name}} ma {{completion_percentage}}% ukończenia. Świetna praca!',
    priority: 'low',
    suggested_actions_template: [
      {
        action: 'review_progress',
        description: 'Przejrzyj postęp względem budżetu',
        calcreno_url: '/project/{{calcreno_project_id}}/progress'
      }
    ]
  },
  timeline_updated: {
    title_template: '📅 Zaktualizowano harmonogram - {{project_name}}',
    message_template: 'Harmonogram projektu {{project_name}} został zaktualizowany.',
    priority: 'medium',
    suggested_actions_template: [
      {
        action: 'sync_timeline',
        description: 'Synchronizuj z kosztorysem',
        calcreno_url: '/project/{{calcreno_project_id}}/sync'
      }
    ]
  },
  project_status_changed: {
    title_template: '📋 Zmiana statusu projektu - {{project_name}}',
    message_template: 'Status projektu {{project_name}} został zmieniony.',
    priority: 'medium',
    suggested_actions_template: [
      {
        action: 'update_project_status',
        description: 'Zaktualizuj status w CalcReno',
        calcreno_url: '/project/{{calcreno_project_id}}/status'
      }
    ]
  },
  task_moved: {
    title_template: '📅 Przeniesiono zadanie - {{task_title}}',
    message_template: 'Zadanie "{{task_title}}" zostało przeniesione na nową datę w projekcie {{project_name}}. Sprawdź wpływ na harmonogram.',
    priority: 'medium',
    suggested_actions_template: [
      {
        action: 'check_timeline_impact',
        description: 'Sprawdź wpływ na harmonogram i koszty',
        calcreno_url: '/project/{{calcreno_project_id}}/timeline-impact'
      },
      {
        action: 'review_schedule',
        description: 'Przejrzyj harmonogram w RenoTimeline',
        renotimeline_url: '/project/{{project_id}}/calendar'
      }
    ]
  }
}; 