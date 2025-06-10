// Workflow system types
export type WorkflowTriggerType = 
  | 'task_status_changed'
  | 'task_created'
  | 'task_assigned'
  | 'due_date_approaching'
  | 'custom_field_changed'
  | 'file_uploaded'
  | 'comment_added'
  | 'project_status_changed'
  | 'team_member_added'
  | 'scheduled';

export type WorkflowExecutionStatus = 'success' | 'failed' | 'partial';

export type WorkflowActionType =
  | 'update_task'
  | 'create_task'
  | 'send_notification'
  | 'send_email'
  | 'update_custom_field'
  | 'add_comment'
  | 'move_to_project'
  | 'assign_to_user'
  | 'create_calendar_event'
  | 'update_project_status';

// Trigger configurations for different trigger types
export interface TaskStatusChangedTrigger {
  from_status?: string;
  to_status?: string;
}

export interface TaskCreatedTrigger {
  project_id?: string;
  assigned_to?: string;
}

export interface TaskAssignedTrigger {
  from_user?: string;
  to_user?: string;
}

export interface DueDateApproachingTrigger {
  days_before: number;
  time?: string; // HH:MM format
}

export interface CustomFieldChangedTrigger {
  field_id: string;
  from_value?: any;
  to_value?: any;
}

export interface ScheduledTrigger {
  cron_expression: string;
  timezone?: string;
}

export type TriggerConfig = 
  | TaskStatusChangedTrigger
  | TaskCreatedTrigger
  | TaskAssignedTrigger
  | DueDateApproachingTrigger
  | CustomFieldChangedTrigger
  | ScheduledTrigger
  | Record<string, any>;

// Action configurations for different action types
export interface UpdateTaskAction {
  type: 'update_task';
  config: {
    task_id?: string; // If not provided, uses the triggering task
    status?: string;
    priority?: string;
    assigned_to?: string;
    due_date?: string;
    custom_fields?: Record<string, any>;
  };
}

export interface CreateTaskAction {
  type: 'create_task';
  config: {
    title: string;
    description?: string;
    project_id?: string; // If not provided, uses the triggering project
    assigned_to?: string;
    priority?: string;
    due_date?: string;
    parent_task_id?: string; // For creating subtasks
  };
}

export interface SendNotificationAction {
  type: 'send_notification';
  config: {
    recipient_id?: string; // If not provided, sends to task assignee
    message: string;
    notification_type: string;
  };
}

export interface SendEmailAction {
  type: 'send_email';
  config: {
    recipient_email?: string;
    subject: string;
    message: string;
    template?: string;
  };
}

export interface UpdateCustomFieldAction {
  type: 'update_custom_field';
  config: {
    field_id: string;
    value: any;
    entity_type: 'task' | 'project';
    entity_id?: string; // If not provided, uses the triggering entity
  };
}

export interface AddCommentAction {
  type: 'add_comment';
  config: {
    task_id?: string; // If not provided, uses the triggering task
    comment: string;
    is_system_comment: boolean;
  };
}

export interface MoveToProjectAction {
  type: 'move_to_project';
  config: {
    task_id?: string;
    target_project_id: string;
  };
}

export interface AssignToUserAction {
  type: 'assign_to_user';
  config: {
    task_id?: string;
    user_id: string;
  };
}

export interface CreateCalendarEventAction {
  type: 'create_calendar_event';
  config: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    attendees?: string[];
  };
}

export interface UpdateProjectStatusAction {
  type: 'update_project_status';
  config: {
    project_id?: string;
    status: string;
  };
}

export type WorkflowAction = 
  | UpdateTaskAction
  | CreateTaskAction
  | SendNotificationAction
  | SendEmailAction
  | UpdateCustomFieldAction
  | AddCommentAction
  | MoveToProjectAction
  | AssignToUserAction
  | CreateCalendarEventAction
  | UpdateProjectStatusAction;

// Main workflow definition interface
export interface WorkflowDefinition {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: WorkflowTriggerType;
  trigger_config: TriggerConfig;
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_executed?: string;
}

// Workflow execution log interface
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_data: Record<string, any>;
  executed_actions: WorkflowAction[];
  status: WorkflowExecutionStatus;
  error_message?: string;
  execution_time: string;
}

// Context passed to workflow execution
export interface WorkflowExecutionContext {
  user_id: string;
  project_id: string;
  trigger_data: Record<string, any>;
  workflow: WorkflowDefinition;
}

// Trigger data interfaces for different trigger types
export interface TaskStatusChangedData {
  task_id: string;
  project_id: string;
  from_status: string;
  to_status: string;
  user_id: string;
  timestamp: string;
}

export interface TaskCreatedData {
  task_id: string;
  project_id: string;
  created_by: string;
  assigned_to?: string;
  timestamp: string;
}

export interface TaskAssignedData {
  task_id: string;
  project_id: string;
  from_user?: string;
  to_user: string;
  assigned_by: string;
  timestamp: string;
}

export interface DueDateApproachingData {
  task_id: string;
  project_id: string;
  due_date: string;
  days_until_due: number;
  timestamp: string;
}

export interface CustomFieldChangedData {
  entity_type: 'task' | 'project';
  entity_id: string;
  project_id: string;
  field_id: string;
  from_value: any;
  to_value: any;
  changed_by: string;
  timestamp: string;
}

export interface FileUploadedData {
  file_id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  uploaded_by: string;
  timestamp: string;
}

export type TriggerData = 
  | TaskStatusChangedData
  | TaskCreatedData
  | TaskAssignedData
  | DueDateApproachingData
  | CustomFieldChangedData
  | FileUploadedData
  | Record<string, any>;

// Workflow template interface
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  popularity?: number;
  trigger_type: WorkflowTriggerType;
  trigger_config: TriggerConfig;
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  variables: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'user' | 'project';
    required: boolean;
    options?: string[];
    default?: string;
  }>;
  tags?: string[];
  estimated_time_saved?: string;
}

// Workflow validation result
export interface WorkflowValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
} 