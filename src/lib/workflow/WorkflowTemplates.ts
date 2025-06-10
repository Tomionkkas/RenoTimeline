import type { WorkflowTemplate, WorkflowTriggerType, WorkflowAction } from '../types/workflow';

/**
 * Predefined workflow templates that users can install and customize
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'auto-complete-subtasks',
    name: 'Auto-complete Subtasks',
    description: 'Automatycznie oznacz zadanie główne jako ukończone, gdy wszystkie podzadania zostaną zakończone',
    category: 'task-automation',
    icon: '✅',
    popularity: 95,
    trigger_type: 'task_status_changed',
    trigger_config: {
      to_status: 'done'
    },
    conditions: {
      has_subtasks: true
    },
    actions: [
      {
        type: 'update_task',
        config: {
          status: 'done',
          target: 'parent_task'
        } as any
      },
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{task.created_by}}',
          message: 'Zadanie "{{parent_task.title}}" zostało automatycznie ukończone po zakończeniu wszystkich podzadań',
          notification_type: 'automated_action'
        } as any
      }
    ],
    variables: [
      {
        key: 'notification_enabled',
        label: 'Wysyłaj powiadomienie o auto-ukończeniu',
        type: 'select',
        required: false,
        options: ['Tak, wysyłaj powiadomienia', 'Nie, pracuj w tle'],
        default: 'Tak, wysyłaj powiadomienia'
      }
    ],
    tags: ['automation', 'tasks', 'completion'],
    estimated_time_saved: '15 min/week'
  },

  {
    id: 'notify-high-priority',
    name: 'High Priority Task Alert',
    description: 'Natychmiast powiadom managera projektu o utworzeniu zadania o wysokim priorytecie',
    category: 'notifications',
    icon: '🚨',
    popularity: 88,
    trigger_type: 'task_created',
    trigger_config: {},
    conditions: {
      priority: ['urgent', 'high']
    },
    actions: [
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{project.manager_id}}',
          message: 'Utworzono zadanie o wysokim priorytecie: "{{task.title}}" w projekcie {{project.name}}',
          notification_type: 'deadline',
          priority: 'high'
        } as any
      },
      {
        type: 'send_email',
        config: {
          recipient_email: '{{project.manager_email}}',
          subject: '🚨 Zadanie wysokiego priorytetu: {{task.title}}',
          message: 'Zostało utworzone nowe zadanie o wysokim priorytecie w projekcie {{project.name}}.\n\nTytuł: {{task.title}}\nOpis: {{task.description}}\nPriorytet: {{task.priority}}\nTermin: {{task.due_date}}'
        } as any
      }
    ],
    variables: [
      {
        key: 'manager_id',
        label: 'Manager projektu',
        type: 'user',
        required: true
      },
      {
        key: 'send_email',
        label: 'Wysyłaj również email',
        type: 'select',
        required: false,
        options: ['Tak, wysyłaj email', 'Tylko powiadomienia w aplikacji'],
        default: 'Tak, wysyłaj email'
      },
      {
        key: 'priority_levels',
        label: 'Priorytety do monitorowania',
        type: 'select',
        required: false,
        options: ['urgent', 'high', 'medium'],
        default: 'urgent,high'
      }
    ],
    tags: ['notifications', 'priority', 'management'],
    estimated_time_saved: '30 min/week'
  },

  {
    id: 'due-date-reminder',
    name: 'Due Date Reminder',
    description: 'Automatycznie wysyłaj przypomnienia 24h przed terminem zadania',
    category: 'scheduling',
    icon: '⏰',
    popularity: 92,
    trigger_type: 'due_date_approaching',
    trigger_config: {
      days_before: 1,
      time_of_day: '09:00'
    },
    conditions: {
      status: ['todo', 'in_progress']
    },
    actions: [
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{task.assigned_to}}',
          message: 'Przypomnienie: Zadanie "{{task.title}}" ma termin jutro ({{task.due_date}})',
          notification_type: 'deadline'
        }
      },
      {
        type: 'update_custom_field',
        config: {
          field_name: 'reminder_sent',
          value: new Date().toISOString(),
          entity_type: 'task'
        }
      }
    ],
    variables: [
      {
        key: 'days_before',
        label: 'Ile dni przed terminem wysłać przypomnienie',
        type: 'select',
        required: true,
        options: ['1', '2', '3', '7'],
        default: '1'
      },
      {
        key: 'reminder_time',
        label: 'O której godzinie wysyłać przypomnienia',
        type: 'text',
        required: false,
        default: '09:00'
      },
      {
        key: 'weekend_reminders',
        label: 'Wysyłać przypomnienia w weekendy',
        type: 'select',
        required: false,
        options: ['Tak, również w weekendy', 'Nie, tylko dni robocze'],
        default: 'Nie, tylko dni robocze'
      }
    ],
    tags: ['reminders', 'deadlines', 'scheduling'],
    estimated_time_saved: '1 hour/week'
  },

  {
    id: 'auto-assign-expertise',
    name: 'Auto-assign by Expertise',
    description: 'Automatycznie przypisuj zadania na podstawie umiejętności i dostępności członków zespołu',
    category: 'assignment',
    icon: '🎯',
    popularity: 76,
    trigger_type: 'task_created',
    trigger_config: {},
    conditions: {
      assigned_to: null // Only for unassigned tasks
    },
    actions: [
      {
        type: 'assign_to_user',
        config: {
          user_id: '{{auto_assign_user_by_skills}}'
        }
      },
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{assigned_user_id}}',
          message: 'Zostałeś automatycznie przypisany do zadania "{{task.title}}" na podstawie Twoich umiejętności',
          notification_type: 'automated_action'
        }
      }
    ],
    variables: [
      {
        key: 'skill_tags',
        label: 'Tagi umiejętności do uwzględnienia',
        type: 'text',
        required: true,
        default: 'frontend,backend,design,testing'
      },
      {
        key: 'workload_balance',
        label: 'Uwzględniać równowagę obciążenia',
        type: 'select',
        required: false,
        options: ['true', 'false'],
        default: 'true'
      },
      {
        key: 'fallback_user',
        label: 'Użytkownik fallback (gdy brak dopasowania)',
        type: 'user',
        required: false
      }
    ],
    tags: ['assignment', 'skills', 'automation'],
    estimated_time_saved: '45 min/week'
  },

  {
    id: 'project-completion',
    name: 'Project Completion Workflow',
    description: 'Automatycznie zmień status projektu na "Ukończony" gdy wszystkie zadania zostaną zakończone',
    category: 'project-management',
    icon: '🏁',
    popularity: 85,
    trigger_type: 'task_status_changed',
    trigger_config: {
      to_status: 'done'
    },
    conditions: {
      all_project_tasks_done: true
    },
    actions: [
      {
        type: 'update_project_status',
        config: {
          status: 'completed'
        }
      },
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{project.manager_id}}',
          message: 'Projekt "{{project.name}}" został automatycznie oznaczony jako ukończony!',
          notification_type: 'completed'
        }
      },
      {
        type: 'create_calendar_event',
        config: {
          title: 'Zakończenie projektu: {{project.name}}',
          description: 'Projekt został pomyślnie ukończony. Czas na retrospektywę i podsumowanie.',
          start_time: '{{now}}',
          end_time: '{{now + 1hour}}',
          attendees: ['{{project.team_members}}']
        }
      }
    ],
    variables: [
      {
        key: 'create_celebration_event',
        label: 'Utwórz wydarzenie celebracji',
        type: 'select',
        required: false,
        options: ['true', 'false'],
        default: 'true'
      },
      {
        key: 'notify_stakeholders',
        label: 'Powiadom interesariuszy',
        type: 'select',
        required: false,
        options: ['true', 'false'],
        default: 'true'
      }
    ],
    tags: ['project', 'completion', 'celebration'],
    estimated_time_saved: '20 min/project'
  },

  {
    id: 'file-organization',
    name: 'Smart File Organization',
    description: 'Automatycznie kategoryzuj i organizuj pliki na podstawie typu i zawartości',
    category: 'file-management',
    icon: '📁',
    popularity: 72,
    trigger_type: 'file_uploaded',
    trigger_config: {},
    conditions: {},
    actions: [
      {
        type: 'update_custom_field',
        config: {
          field_name: 'file_category',
          value: '{{auto_detect_category}}',
          entity_type: 'file'
        }
      },
      {
        type: 'add_comment',
        config: {
          comment: 'Plik został automatycznie kategoryzowany jako: {{file_category}}',
          is_system_comment: true
        }
      }
    ],
    variables: [
      {
        key: 'auto_categorization',
        label: 'Automatyczna kategoryzacja',
        type: 'select',
        required: false,
        options: ['true', 'false'],
        default: 'true'
      },
      {
        key: 'file_naming_convention',
        label: 'Konwencja nazewnictwa',
        type: 'text',
        required: false,
        default: '{{project_name}}_{{file_type}}_{{date}}'
      }
    ],
    tags: ['files', 'organization', 'automation'],
    estimated_time_saved: '25 min/week'
  },

  {
    id: 'daily-standup-prep',
    name: 'Daily Standup Preparation',
    description: 'Codziennie o 8:30 przygotuj podsumowanie dla daily standup każdego członka zespołu',
    category: 'scheduling',
    icon: '🗣️',
    popularity: 68,
    trigger_type: 'scheduled',
    trigger_config: {
      schedule_type: 'daily',
      schedule_time: '08:30',
      days_of_week: [1, 2, 3, 4, 5] // Monday to Friday
    },
    conditions: {},
    actions: [
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{team_members}}',
          message: 'Daily Standup za 30 minut! Twoje zadania na dziś: {{user_today_tasks}}',
          notification_type: 'system'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Daily Standup - {{today_date}}',
          description: 'Automatycznie utworzone zadanie dla daily standup',
          assigned_to: '{{scrum_master}}',
          due_date: '{{today + 1hour}}',
          priority: 'medium'
        }
      }
    ],
    variables: [
      {
        key: 'standup_time',
        label: 'Godzina daily standup',
        type: 'text',
        required: true,
        default: '09:00'
      },
      {
        key: 'scrum_master',
        label: 'Scrum Master',
        type: 'user',
        required: true
      },
      {
        key: 'working_days',
        label: 'Dni robocze',
        type: 'text',
        required: false,
        default: 'pon,wto,śr,czw,pt'
      }
    ],
    tags: ['standup', 'scrum', 'daily', 'team'],
    estimated_time_saved: '15 min/day'
  },

  {
    id: 'code-review-reminder',
    name: 'Code Review Reminder',
    description: 'Przypominaj o oczekujących code review i automatycznie przypisuj reviewerów',
    category: 'development',
    icon: '👨‍💻',
    popularity: 81,
    trigger_type: 'custom_field_changed',
    trigger_config: {
      field_name: 'status',
      to_value: 'ready_for_review'
    },
    conditions: {
      task_category: 'development'
    },
    actions: [
      {
        type: 'assign_to_user',
        config: {
          user_id: '{{auto_select_reviewer}}',
          role: 'reviewer'
        }
      },
      {
        type: 'send_notification',
        config: {
          recipient_id: '{{reviewer_id}}',
          message: 'Nowe code review do przejrzenia: "{{task.title}}"',
          notification_type: 'system'
        }
      },
      {
        type: 'update_custom_field',
        config: {
          field_name: 'review_requested_at',
          value: '{{now}}',
          entity_type: 'task'
        }
      }
    ],
    variables: [
      {
        key: 'review_team',
        label: 'Zespół reviewerów',
        type: 'text',
        required: true,
        default: 'senior-dev-1,senior-dev-2'
      },
      {
        key: 'max_reviews_per_person',
        label: 'Maksymalna liczba review na osobę',
        type: 'select',
        required: false,
        options: ['2', '3', '5'],
        default: '3'
      }
    ],
    tags: ['development', 'review', 'code', 'automation'],
    estimated_time_saved: '20 min/week'
  }
];

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category);
};

/**
 * Get popular templates (sorted by popularity)
 */
export const getPopularTemplates = (limit: number = 5): WorkflowTemplate[] => {
  return [...WORKFLOW_TEMPLATES]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
};

/**
 * Search templates by name, description, or tags
 */
export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const searchTerm = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Get all unique categories
 */
export const getCategories = (): string[] => {
  const categories = WORKFLOW_TEMPLATES.map(template => template.category);
  return [...new Set(categories)];
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(template => template.id === id);
};

/**
 * Category display names and icons
 */
export const CATEGORY_INFO = {
  'task-automation': {
    name: 'Automatyzacja Zadań',
    icon: '⚙️',
    description: 'Automatyzacja cyklu życia zadań i procesów'
  },
  'notifications': {
    name: 'Powiadomienia',
    icon: '🔔',
    description: 'Inteligentne powiadomienia i alerty'
  },
  'scheduling': {
    name: 'Harmonogramowanie',
    icon: '📅',
    description: 'Zarządzanie czasem i terminami'
  },
  'assignment': {
    name: 'Przypisywanie',
    icon: '👥',
    description: 'Automatyczne przypisywanie zadań i ról'
  },
  'project-management': {
    name: 'Zarządzanie Projektami',
    icon: '📊',
    description: 'Procesy na poziomie projektu'
  },
  'file-management': {
    name: 'Zarządzanie Plikami',
    icon: '📁',
    description: 'Organizacja i kategoryzacja plików'
  },
  'development': {
    name: 'Rozwój Oprogramowania',
    icon: '💻',
    description: 'Procesy deweloperskie i code review'
  }
};

/**
 * Validate template configuration
 */
export const validateTemplate = (template: WorkflowTemplate): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }

  if (!template.description?.trim()) {
    errors.push('Template description is required');
  }

  if (!template.trigger_type) {
    errors.push('Trigger type is required');
  }

  if (!template.actions || template.actions.length === 0) {
    errors.push('At least one action is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 