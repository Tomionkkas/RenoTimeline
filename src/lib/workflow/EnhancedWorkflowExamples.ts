import type { WorkflowDefinition } from '../types/workflow';

/**
 * Enhanced workflow examples showcasing new capabilities
 */
export const ENHANCED_WORKFLOW_EXAMPLES: WorkflowDefinition[] = [
  {
    id: 'smart-task-completion',
    name: 'Smart Task Completion with Comments',
    description: 'Automatycznie dodaje komentarz z podsumowaniem po ukończeniu zadania',
    project_id: '', // Will be set dynamically
    trigger_type: 'task_status_changed',
    trigger_config: {
      to_status: 'done'
    },
    conditions: {},
    actions: [
      {
        type: 'add_comment',
        config: {
          comment: '✅ Zadanie "{{task.title}}" zostało ukończone przez {{trigger_user.name}} dnia {{current_date}}.\n\nStatystyki:\n- Priorytet: {{task.priority}}\n- Czas wykonania: {{task.due_in_days}} dni do terminu\n- Status: {{trigger.from_status}} → {{trigger.to_status}}',
          is_system_comment: true
        }
      },
      {
        type: 'update_custom_field',
        config: {
          entity_type: 'task',
          field_name: 'completion_date',
          value: '{{current_iso_date}}'
        }
      },
      {
        type: 'send_notification',
        config: {
          title: 'Zadanie ukończone 🎉',
          message: '{{task.title}} zostało pomyślnie ukończone przez {{trigger_user.name}}',
          priority: 'medium'
        }
      }
    ],
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'deadline-reminder-system',
    name: 'Smart Deadline Reminder System',
    description: 'Wysyła escalating reminders przed terminem z dynamiczną treścią',
    project_id: '',
    trigger_type: 'due_date_approaching',
    trigger_config: {
      days_before: 3
    },
    conditions: {
      priority: ['high', 'urgent']
    },
    actions: [
      {
        type: 'send_email',
        config: {
          recipient_email: '{{task.assigned_to_name}}',
          subject: '⚠️ Ważny termin się zbliża: {{task.title}}',
          content: `Cześć {{task.assigned_to_name}},

Przypominam o zbliżającym się terminie ważnego zadania:

📋 **Zadanie:** {{task.title}}
⏰ **Termin:** {{task.due_date}}
⚡ **Priorytet:** {{task.priority}}
👤 **Projekt:** {{project.name}}

{{#if task.description}}
**Opis:**
{{task.description}}
{{/if}}

Zostały Ci jeszcze {{task.due_in_days}} dni na ukończenie tego zadania.

Jeśli potrzebujesz pomocy lub chcesz przedłużyć termin, skontaktuj się z zespołem.

Powodzenia!
System automatycznych powiadomień - {{current_timestamp}}`
        }
      },
      {
        type: 'add_comment',
        config: {
          comment: '⏰ Automatyczne przypomnienie: Zadanie ma termin za {{task.due_in_days}} dni ({{task.due_date}}). Email został wysłany do {{task.assigned_to_name}}.',
          is_system_comment: true
        }
      },
      {
        type: 'create_calendar_event',
        config: {
          title: '🔥 DEADLINE: {{task.title}}',
          description: 'Termin wykonania zadania {{task.title}} w projekcie {{project.name}}',
          start_date: '{{task.due_date}}',
          all_day: true
        }
      }
    ],
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'project-milestone-automation',
    name: 'Project Milestone Automation',
    description: 'Automatycznie aktualizuje projekt i tworzy raporty po ukończeniu milestone tasks',
    project_id: '',
    trigger_type: 'task_status_changed',
    trigger_config: {
      to_status: 'done'
    },
    conditions: {
      custom_fields: {
        'task_type': 'milestone'
      }
    },
    actions: [
      {
        type: 'update_custom_field',
        config: {
          entity_type: 'project',
          field_name: 'last_milestone_completed',
          value: '{{task.title}} - {{current_date}}'
        }
      },
      {
        type: 'create_task',
        config: {
          title: '📊 Raport: Milestone "{{task.title}}" ukończony',
          description: `Automatycznie wygenerowane zadanie raportowe.

**Ukończony milestone:** {{task.title}}
**Data ukończenia:** {{current_date}}
**Wykonawca:** {{trigger_user.name}}
**Projekt:** {{project.name}}

**Następne kroki:**
1. Przegląd rezultatów milestone
2. Aktualizacja harmonogramu projektu
3. Komunikacja z interesariuszami
4. Planning następnego milestone`,
          priority: 'high',
          due_date: '+7 days'
        }
      },
      {
        type: 'send_notification',
        config: {
          title: '🎯 Milestone ukończony!',
          message: 'Gratulacje! Milestone "{{task.title}}" został ukończony przez {{trigger_user.name}}. Projekt {{project.name}} robi postępy!',
          priority: 'high'
        }
      },
      {
        type: 'batch_update_tasks',
        config: {
          filter: {
            status: ['blocked'],
            custom_field_filters: [
              {
                field_name: 'blocked_by_milestone',
                operator: 'equals',
                value: '{{task.id}}'
              }
            ]
          },
          updates: {
            status: 'todo'
          },
          limit: 20
        }
      }
    ],
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'team-collaboration-enhancer',
    name: 'Team Collaboration Enhancer',
    description: 'Automatycznie wspiera komunikację zespołu przy nowych przydzieleniach',
    project_id: '',
    trigger_type: 'task_assigned',
    trigger_config: {},
    conditions: {},
    actions: [
      {
        type: 'add_comment',
        config: {
          comment: `👋 Cześć {{trigger.to_user}}!

Zostało Ci przydzielone nowe zadanie: **{{task.title}}**

**Szczegóły:**
- Priorytet: {{task.priority}}
- Termin: {{task.due_date}}
{{#if task.description}}
- Opis: {{task.description}}
{{/if}}

{{#if trigger.from_user}}
Zadanie zostało przydzielone przez {{trigger.from_user}}.
{{/if}}

Jeśli masz pytania lub potrzebujesz dodatkowych informacji, nie wahaj się zapytać zespół!

_Automatyczna wiadomość systemu workflow - {{current_timestamp}}_`,
          is_system_comment: false
        }
      },
      {
        type: 'send_email',
        config: {
          recipient_email: '{{trigger.to_user}}',
          subject: 'Nowe zadanie: {{task.title}} w {{project.name}}',
          content: `Cześć!

Masz nowe zadanie do wykonania w projekcie {{project.name}}.

**Zadanie:** {{task.title}}
**Priorytet:** {{task.priority}}
**Termin:** {{task.due_date}}
**Przydzielone przez:** {{trigger_user.name}}

Możesz zobaczyć szczegóły zadania w aplikacji Renotl.

Powodzenia!
`
        }
      },
      {
        type: 'update_custom_field',
        config: {
          entity_type: 'task',
          field_name: 'assigned_date',
          value: '{{current_iso_date}}'
        }
      },
      {
        type: 'create_calendar_event',
        config: {
          title: 'Nowe zadanie: {{task.title}}',
          description: 'Zadanie przydzielone w projekcie {{project.name}}\nPriorytet: {{task.priority}}\nTermin: {{task.due_date}}',
          start_date: 'today',
          end_date: 'today'
        }
      }
    ],
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'file-upload-processor',
    name: 'File Upload Processor',
    description: 'Automatycznie przetwarza nowe pliki i aktualizuje related tasks',
    project_id: '',
    trigger_type: 'file_uploaded',
    trigger_config: {},
    conditions: {},
    actions: [
      {
        type: 'add_comment',
        config: {
          comment: '📎 Nowy plik został dodany: **{{trigger.file_name}}**\n\n- Typ pliku: {{trigger.file_type}}\n- Dodany przez: {{trigger_user.name}}\n- Data: {{current_timestamp}}\n\nPlik został automatycznie powiązany z tym zadaniem.',
          is_system_comment: true
        }
      },
      {
        type: 'update_custom_field',
        config: {
          entity_type: 'task',
          field_name: 'last_file_upload',
          value: '{{trigger.file_name}} - {{current_date}}'
        }
      },
      {
        type: 'send_notification',
        config: {
          title: 'Nowy plik dodany 📎',
          message: '{{trigger_user.name}} dodał plik {{trigger.file_name}} do zadania {{task.title}}',
          priority: 'low'
        }
      },
      {
        type: 'update_task',
        config: {
          status: 'in_progress'
        }
      }
    ],
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/**
 * Demo function to showcase enhanced workflow capabilities
 */
export function demonstrateEnhancedWorkflows() {
  console.log('🚀 Enhanced Workflow Examples:');
  
  ENHANCED_WORKFLOW_EXAMPLES.forEach((workflow, index) => {
    console.log(`\n${index + 1}. ${workflow.name}`);
    console.log(`   📝 ${workflow.description}`);
    console.log(`   🎯 Trigger: ${workflow.trigger_type}`);
    console.log(`   ⚡ Actions: ${workflow.actions.length}`);
    
    // Show variables used
    const allContent = JSON.stringify(workflow.actions);
    const variables = allContent.match(/\{\{[^}]+\}\}/g) || [];
    const uniqueVariables = [...new Set(variables)];
    
    if (uniqueVariables.length > 0) {
      console.log(`   🔀 Variables: ${uniqueVariables.slice(0, 5).join(', ')}${uniqueVariables.length > 5 ? '...' : ''}`);
    }
  });
  
  console.log('\n✨ All examples use enhanced action executors with:');
  console.log('   - Variable substitution for dynamic content');
  console.log('   - Real database integration');
  console.log('   - Error handling and validation');
  console.log('   - Performance optimization');
  console.log('   - Production-ready reliability');
}

/**
 * Get workflow example by ID
 */
export function getEnhancedWorkflowExample(id: string): WorkflowDefinition | null {
  return ENHANCED_WORKFLOW_EXAMPLES.find(workflow => workflow.id === id) || null;
}

/**
 * Get all workflow examples for a specific trigger type
 */
export function getEnhancedWorkflowsByTrigger(triggerType: string): WorkflowDefinition[] {
  return ENHANCED_WORKFLOW_EXAMPLES.filter(workflow => workflow.trigger_type === triggerType);
} 