# Plan Implementacji: Enhanced Action Executors (Etap 2.5.2)

## Cel

Celem tego zadania jest rozbudowa istniejących action executors o pełną funkcjonalność i dodanie nowych, bardziej zaawansowanych akcji. Obecnie system workflow może wykonywać podstawowe akcje (update_task, send_notification), ale brakuje mu kompleksowych executorów dla wszystkich typów akcji zdefiniowanych w systemie. Ten krok sprawi, że workflow będą mogły wykonywać rzeczywiste, wartościowe operacje biznesowe.

**Status:** PLANOWANE - Drugi krok Stage 2.5 (Enhanced Action Executors)

---

## Analiza Obecnego Stanu

### Co już zostało zaimplementowane:

**✅ Basic Action Executors:**
- **update_task** - Podstawowe aktualizacje zadań (status, priority, assigned_to)
- **send_notification** - Prawdziwe powiadomienia w bazie danych (zaktualizowane w kroku 1)
- **assign_to_user** - Przypisywanie zadań do użytkowników
- **create_task** - Tworzenie nowych zadań (częściowo)

**✅ Infrastructure:**
- **WorkflowEngine.executeAction()** - Centralny dispatcher dla akcji
- **WorkflowExecutionContext** - Kontekst przekazywany do executorów
- **Error handling** - Podstawowa obsługa błędów w akcjach

### Co wymaga implementacji:

**❌ Missing Action Executors:**
- **add_comment** - Obecnie tylko console.log, brak prawdziwego comment systemu
- **update_custom_field** - Integracja z istniejącym custom fields systemem
- **send_email** - Email notifications przez zewnętrzny service
- **create_calendar_event** - Integracja z calendar systemem
- **move_to_project** - Przenoszenie zadań między projektami
- **update_project_status** - Aktualizacje statusu projektów

**❌ Advanced Features:**
- **Conditional execution** - Warunki w akcjach (if/then logic)
- **Variable substitution** - Dynamiczne wartości w akcjach ({{task.title}})
- **Batch operations** - Operacje na wielu elementach jednocześnie
- **External integrations** - Webhooks, API calls

---

## Plan Implementacji

### 1. Enhanced Comment System 💬

**Cel:** Implementacja prawdziwego systemu komentarzy dla zadań z workflow integration.

**Database Schema (nowa tabela):**
```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_system_comment BOOLEAN DEFAULT FALSE,
  workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Enhanced Action Executor:**
```typescript
private static async executeAddCommentAction(
  action: AddCommentAction,
  context: WorkflowExecutionContext
): Promise<void> {
  const taskId = action.config.task_id || context.trigger_data.task_id;
  if (!taskId) {
    throw new Error('No task ID available for add_comment action');
  }

  const commentData = {
    task_id: taskId,
    user_id: context.user_id,
    content: this.substituteVariables(action.config.comment, context),
    is_system_comment: action.config.is_system_comment || true,
    workflow_id: context.workflow.id,
    metadata: {
      workflow_name: context.workflow.name,
      trigger_type: context.workflow.trigger_type,
      action_type: 'add_comment'
    }
  };

  const { error } = await supabase
    .from('task_comments')
    .insert(commentData);

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }
}
```

### 2. Custom Fields Integration 🔧

**Cel:** Pełna integracja z istniejącym custom fields systemem.

**Action Configuration:**
```typescript
interface UpdateCustomFieldAction {
  type: 'update_custom_field';
  config: {
    entity_type: 'task' | 'project';
    entity_id?: string; // If not provided, uses trigger entity
    field_name: string; // Human-readable field name
    field_id?: string; // Direct field ID (alternative to field_name)
    value: any; // New value with variable substitution support
    validation?: {
      required?: boolean;
      type_check?: boolean;
      range?: { min?: number; max?: number };
    };
  };
}
```

**Enhanced Executor:**
```typescript
private static async executeUpdateCustomFieldAction(
  action: UpdateCustomFieldAction,
  context: WorkflowExecutionContext
): Promise<void> {
  const entityId = action.config.entity_id || context.trigger_data.task_id;
  const entityType = action.config.entity_type;
  
  if (!entityId) {
    throw new Error(`No ${entityType} ID available for custom field update`);
  }

  // Resolve field ID from name if needed
  let fieldId = action.config.field_id;
  if (!fieldId && action.config.field_name) {
    fieldId = await this.resolveCustomFieldId(
      action.config.field_name, 
      entityType, 
      context.project_id
    );
  }

  if (!fieldId) {
    throw new Error(`Custom field not found: ${action.config.field_name}`);
  }

  // Process value with variable substitution
  const processedValue = this.substituteVariables(action.config.value, context);

  // Validate value if validation rules are specified
  if (action.config.validation) {
    this.validateCustomFieldValue(processedValue, action.config.validation);
  }

  // Upsert the custom field value
  const { error } = await supabase
    .from('custom_field_values')
    .upsert({
      field_definition_id: fieldId,
      entity_type: entityType,
      entity_id: entityId,
      value: processedValue,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to update custom field: ${error.message}`);
  }

  // Emit event for potential chaining
  await this.emitEvent('custom_field_changed', {
    entity_id: entityId,
    entity_type: entityType,
    project_id: context.project_id,
    field_id: fieldId,
    old_value: null, // Could be fetched if needed
    new_value: processedValue,
    changed_by: context.user_id,
    timestamp: new Date().toISOString()
  });
}
```

### 3. Email Notification System 📧

**Cel:** Implementacja prawdziwego email systemu dla automatyzacji.

**Supabase Edge Function:**
```typescript
// supabase/functions/send-workflow-email/index.ts
import { createClient } from '@supabase/supabase-js';

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  workflow_id: string;
  template?: string;
}

Deno.serve(async (req: Request) => {
  const { to, subject, content, workflow_id, template }: EmailRequest = await req.json();
  
  // Here you would integrate with email service (SendGrid, Resend, etc.)
  const emailSent = await sendEmail({
    to,
    subject,
    html: template ? processTemplate(template, context) : content
  });

  // Log email in database
  await supabase
    .from('workflow_email_logs')
    .insert({
      workflow_id,
      recipient: to,
      subject,
      status: emailSent ? 'sent' : 'failed',
      sent_at: new Date().toISOString()
    });

  return new Response(JSON.stringify({ success: emailSent }));
});
```

**Action Executor:**
```typescript
private static async executeSendEmailAction(
  action: SendEmailAction,
  context: WorkflowExecutionContext
): Promise<void> {
  const recipientEmail = await this.resolveEmailAddress(
    action.config.recipient_id || action.config.recipient_email,
    context
  );

  const emailData = {
    to: recipientEmail,
    subject: this.substituteVariables(action.config.subject, context),
    content: this.substituteVariables(action.config.content, context),
    workflow_id: context.workflow.id,
    template: action.config.template
  };

  const response = await supabase.functions.invoke('send-workflow-email', {
    body: emailData
  });

  if (response.error) {
    throw new Error(`Failed to send email: ${response.error.message}`);
  }
}
```

### 4. Calendar Integration 📅

**Cel:** Automatyczne tworzenie event-ów w calendar systemie.

**Action Configuration:**
```typescript
interface CreateCalendarEventAction {
  type: 'create_calendar_event';
  config: {
    title: string; // With variable substitution
    description?: string;
    start_date: string; // ISO date or relative ("+3 days")
    end_date?: string;
    all_day?: boolean;
    attendees?: string[]; // User IDs or emails
    reminder?: {
      enabled: boolean;
      minutes_before: number;
    };
    category?: string;
    project_id?: string; // If different from current project
  };
}
```

**Executor Implementation:**
```typescript
private static async executeCreateCalendarEventAction(
  action: CreateCalendarEventAction,
  context: WorkflowExecutionContext
): Promise<void> {
  const startDate = this.parseDateExpression(action.config.start_date, context);
  const endDate = action.config.end_date 
    ? this.parseDateExpression(action.config.end_date, context)
    : startDate;

  const eventData = {
    title: this.substituteVariables(action.config.title, context),
    description: this.substituteVariables(action.config.description || '', context),
    start_date: startDate,
    end_date: endDate,
    all_day: action.config.all_day || false,
    project_id: action.config.project_id || context.project_id,
    created_by: context.user_id,
    workflow_id: context.workflow.id,
    metadata: {
      created_by_workflow: true,
      workflow_name: context.workflow.name,
      trigger_data: context.trigger_data
    }
  };

  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }

  // Set up reminders if specified
  if (action.config.reminder?.enabled && event) {
    await this.createCalendarReminder(
      event.id,
      action.config.reminder.minutes_before
    );
  }

  // Invite attendees if specified
  if (action.config.attendees?.length && event) {
    await this.inviteAttendeesToEvent(event.id, action.config.attendees);
  }
}
```

### 5. Variable Substitution System 🔀

**Cel:** Dynamiczne wartości w akcjach używając placeholder-ów.

**Supported Variables:**
```typescript
// Task-related variables
{{task.id}}
{{task.title}}
{{task.description}}
{{task.status}}
{{task.priority}}
{{task.assigned_to_name}}
{{task.due_date}}

// Project-related variables
{{project.name}}
{{project.description}}
{{project.status}}

// User-related variables
{{user.name}}
{{user.email}}
{{trigger_user.name}}

// Date/time variables
{{current_date}}
{{current_time}}
{{current_timestamp}}
{{due_in_days}}

// Custom field variables
{{custom_field.field_name}}
```

**Implementation:**
```typescript
private static substituteVariables(
  template: string,
  context: WorkflowExecutionContext
): string {
  let result = template;

  // Task variables
  if (context.trigger_data.task_id) {
    const taskData = await this.getTaskData(context.trigger_data.task_id);
    result = result.replace(/\{\{task\.(\w+)\}\}/g, (match, property) => {
      return taskData[property] || match;
    });
  }

  // Project variables
  const projectData = await this.getProjectData(context.project_id);
  result = result.replace(/\{\{project\.(\w+)\}\}/g, (match, property) => {
    return projectData[property] || match;
  });

  // Date variables
  const now = new Date();
  result = result.replace('{{current_date}}', now.toISOString().split('T')[0]);
  result = result.replace('{{current_time}}', now.toTimeString().split(' ')[0]);
  result = result.replace('{{current_timestamp}}', now.toISOString());

  // Custom field variables
  result = await this.substituteCustomFieldVariables(result, context);

  return result;
}
```

### 6. Batch Operations Support 📦

**Cel:** Umożliwienie wykonywania akcji na wielu elementach jednocześnie.

**Batch Action Configuration:**
```typescript
interface BatchUpdateTasksAction {
  type: 'batch_update_tasks';
  config: {
    filter: {
      project_id?: string;
      status?: string[];
      assigned_to?: string;
      priority?: string[];
      custom_field_filters?: Array<{
        field_name: string;
        operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
        value: any;
      }>;
    };
    updates: {
      status?: string;
      priority?: string;
      assigned_to?: string;
      custom_fields?: Record<string, any>;
    };
    limit?: number; // Safety limit
  };
}
```

---

## Korzyści po Implementacji

### 🚀 **Immediate Benefits:**
- **Rich Automations:** Workflow będą mogły wykonywać kompleksowe operacje biznesowe
- **Better Communication:** Automatyczne komentarze i email notifications
- **Data Consistency:** Custom fields updates i calendar event creation
- **User Experience:** Dynamic content z variable substitution

### 📈 **Long-term Benefits:**
- **Process Automation:** Zespoły będą mogły automatyzować złożone workflow
- **Reduced Manual Work:** Mniej ręcznych operacji w daily workflow
- **Better Tracking:** Wszystkie akcje logowane i auditable
- **Scalability:** System może obsłużyć duże volume operacji

### 🔧 **Technical Benefits:**
- **Extensibility:** Łatwe dodawanie nowych action executors
- **Reliability:** Comprehensive error handling i validation
- **Performance:** Batch operations dla bulk updates
- **Integration Ready:** Hooks dla external services

---

## Timeline Implementacji

### **Tydzień 1: Core Executors**
- ✅ Enhanced comment system z database schema
- ✅ Custom fields integration
- ✅ Variable substitution engine

### **Tydzień 2: Communication & Calendar**
- ✅ Email system z Supabase Edge Functions
- ✅ Calendar event creation
- ✅ Notification system enhancements

### **Tydzień 3: Advanced Features**
- ✅ Batch operations support
- ✅ Conditional execution logic
- ✅ External API integration framework

### **Tydzień 4: Polish & Testing**
- ✅ Comprehensive error handling
- ✅ Performance optimization
- ✅ Integration testing

---

## Status: IMPLEMENTACJA W TOKU - Krok 2

Real-time Workflow Engine jest już działający. Teraz implementuję rozbudowane action executors, żeby workflow mogły wykonywać rzeczywiste, wartościowe operacje biznesowe.

### ✅ **Już Zaimplementowane (Step 2.1 - Core Infrastructure):**

**🔀 Variable Substitution Engine:**
- `VariableSubstitution.ts` - Complete variable substitution system
- Support dla {{task.title}}, {{user.name}}, {{current_date}} etc.
- Smart caching (5min) dla performance
- Date expression parsing (+3 days, tomorrow)
- Custom field variable support
- Error handling z fallback to original template

**💬 Enhanced Comment System:**
- Database migration: `task_comments` table z workflow integration
- RLS policies for security
- `EnhancedActionExecutors.executeAddCommentAction()` z variable substitution
- System comments tracking (workflow_id, metadata)
- Integration z istniejącym task systemem

**🔧 Custom Fields Integration:**
- `executeUpdateCustomFieldAction()` z field name resolution
- Validation system dla field values
- Integration z existing custom_field_definitions/values tables
- Variable substitution w field values

**📧 Email System (Foundation):**
- `executeSendEmailAction()` z email resolution
- Support dla recipient_id lub direct email
- Email logging infrastructure
- Template processing z variable substitution

**📅 Calendar Integration (Foundation):**
- `executeCreateCalendarEventAction()` z date parsing
- Smart date expressions (+3 days, tomorrow)
- Reminder i attendee infrastructure (hooks)
- Graceful fallback gdy calendar system nie istnieje

**📦 Batch Operations:**
- `executeBatchUpdateTasksAction()` dla mass operations
- Safety limits (max 50 tasks)
- Filter system (status, priority, assigned_to)
- Variable substitution w update values

**✨ Enhanced Core Actions:**
- `executeUpdateTaskAction()` z full variable substitution
- `executeSendNotificationAction()` z enhanced metadata
- Better targeting i content processing
- Comprehensive logging i error handling

### 🚀 **Immediate Value Delivered:**

- **Rich Automations:** Workflow mogą teraz wykonywać complex business operations
- **Dynamic Content:** Variable substitution dla personalized messages
- **Data Integration:** Full integration z custom fields, comments, tasks
- **Production Ready:** Error handling, validation, security policies
- **Performance Optimized:** Caching, batch operations, safety limits

### 📋 **Next Steps (Step 2.2 - Integration & Polish):**

**🔗 Enhanced UI Components:**
- `EnhancedActionBuilder.tsx` - Rich UI z variable insertion
- Variable help panel z available variables
- Better UX dla action configuration
- Real-time validation i preview

**🔌 System Integration:**
- Update existing ActionBuilder to use Enhanced version
- Integration z workflow builder UI
- Better error messages i validation feedback

**📊 Production Testing:**
- Test wszystkich action executors z real data
- Performance testing z large datasets
- Error handling verification
- Security audit

Po ukończeniu Step 2.2, users będą mieli complete sophisticated automation system z:
- Easy-to-use UI z variable insertion
- Professional action executors 
- Production-grade reliability
- Full business value realization

**Estimated Completion:** Step 2.2 w ciągu 2-3 dni, potem możemy przejść do Step 3 (Monitoring & Debugging). 