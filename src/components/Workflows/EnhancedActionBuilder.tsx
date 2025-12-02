import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Info, Wand2 } from 'lucide-react';
import type { WorkflowAction } from '../../lib/types/workflow';
import { VariableSubstitution } from '../../lib/workflow/VariableSubstitution';

interface EnhancedActionBuilderProps {
  actions: WorkflowAction[];
  onActionsChange: (actions: WorkflowAction[]) => void;
}

/**
 * Enhanced Action Builder with variable substitution support and better UX
 */
export function EnhancedActionBuilder({ actions, onActionsChange }: EnhancedActionBuilderProps) {
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
  const [showVariableHelp, setShowVariableHelp] = useState<boolean>(false);

  const actionTypes = [
    { value: 'update_task', label: 'Aktualizuj zadanie', icon: '' },
    { value: 'create_task', label: 'Utwórz zadanie', icon: '' },
    { value: 'send_notification', label: 'Wyślij powiadomienie', icon: '' },
    { value: 'add_comment', label: 'Dodaj komentarz', icon: '' },
    { value: 'update_custom_field', label: 'Aktualizuj pole niestandardowe', icon: '' },
    { value: 'send_email', label: 'Wyślij email', icon: '' },
    { value: 'create_calendar_event', label: 'Utwórz wydarzenie w kalendarzu', icon: '' },
    { value: 'assign_to_user', label: 'Przypisz do użytkownika', icon: '' },
    { value: 'batch_update_tasks', label: 'Masowa aktualizacja zadań', icon: '' }
  ];

  const addAction = () => {
    const newAction = {
      type: 'update_task' as const,
      config: { status: 'done' }
    } as WorkflowAction;
    
    const newActions = [...actions, newAction];
    onActionsChange(newActions);
    
    // Expand the new action
    setExpandedActions(prev => new Set([...prev, newActions.length - 1]));
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updatedActions = actions.map((action, i) => 
      i === index ? { ...action, ...updates } : action
    );
    onActionsChange(updatedActions);
  };

  const toggleExpanded = (index: number) => {
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const insertVariable = (actionIndex: number, field: string, variable: string) => {
    const action = actions[actionIndex];
    const currentValue = (action.config as any)[field] || '';
    const newValue = currentValue + variable;
    
    updateAction(actionIndex, {
      config: { ...action.config, [field]: newValue }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Akcje
                <Badge variant="secondary">{actions.length}</Badge>
              </CardTitle>
              <CardDescription>
                Określ co ma się stać, gdy workflow zostanie uruchomiony
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVariableHelp(!showVariableHelp)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Zmienne
              </Button>
              <Button onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj akcję
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showVariableHelp && (
          <CardContent className="border-t">
            <VariableHelp />
          </CardContent>
        )}
      </Card>

      {actions.length > 0 && (
        <div className="space-y-4">
          {actions.map((action, index) => {
            const actionType = actionTypes.find(t => t.value === action.type);
            const isExpanded = expandedActions.has(index);
            
            return (
              <Card key={index} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleExpanded(index)}
                    >
                      <div className="text-lg">{actionType?.icon}</div>
                      <div>
                        <div className="font-medium">{actionType?.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Akcja #{index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {action.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Typ akcji</Label>
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, { 
                          type: value as any, 
                          config: {} 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ActionConfiguration 
                      action={action}
                      actionIndex={index}
                      onUpdate={updateAction}
                      onInsertVariable={insertVariable}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {actions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="text-6xl mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Brak akcji</h3>
            <p className="text-muted-foreground text-center mb-4">
              Dodaj akcje, które mają zostać wykonane gdy workflow zostanie uruchomiony
            </p>
            <Button onClick={addAction}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pierwszą akcję
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Action-specific configuration component
 */
function ActionConfiguration({ 
  action, 
  actionIndex, 
  onUpdate, 
  onInsertVariable 
}: {
  action: WorkflowAction;
  actionIndex: number;
  onUpdate: (index: number, updates: Partial<WorkflowAction>) => void;
  onInsertVariable: (actionIndex: number, field: string, variable: string) => void;
}) {
  const updateConfig = (updates: any) => {
    onUpdate(actionIndex, {
      config: { ...action.config, ...updates }
    });
  };

  switch (action.type) {
    case 'update_task':
      return <UpdateTaskConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'create_task':
      return <CreateTaskConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'send_notification':
      return <SendNotificationConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'add_comment':
      return <AddCommentConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'update_custom_field':
      return <UpdateCustomFieldConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'send_email':
      return <SendEmailConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    case 'create_calendar_event':
      return <CreateCalendarEventConfig action={action} onUpdate={updateConfig} onInsertVariable={onInsertVariable} actionIndex={actionIndex} />;
    
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Konfiguracja dla tego typu akcji nie jest jeszcze dostępna.
        </div>
      );
  }
}

/**
 * Variable help component
 */
function VariableHelp() {
  const variables = {
    'Zadanie': ['{{task.title}}', '{{task.status}}', '{{task.priority}}', '{{task.due_date}}'],
    'Użytkownik': ['{{user.name}}', '{{user.email}}', '{{user.id}}'],
    'Data/Czas': ['{{current_date}}', '{{current_time}}', '{{current_date | +3 days}}', '{{current_date | tomorrow}}'],
    'Projekt': ['{{project.name}}', '{{project.id}}'],
    'Pola niestandardowe': ['{{custom_field.nazwa_pola}}', '{{custom_field.department}}']
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4" />
        <h4 className="font-medium">Dostępne zmienne</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Użyj tych zmiennych w treści wiadomości, komentarzy i innych polach tekstowych. 
        Zostaną one automatycznie zastąpione rzeczywistymi wartościami.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(variables).map(([category, vars]) => (
          <div key={category} className="space-y-2">
            <h5 className="font-medium text-sm">{category}</h5>
            <div className="space-y-1">
              {vars.map(variable => (
                <Badge key={variable} variant="secondary" className="text-xs font-mono">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Field component with variable insertion support
 */
function VariableField({ 
  label, 
  value, 
  onChange, 
  onInsertVariable, 
  field, 
  actionIndex, 
  placeholder = "",
  multiline = false 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onInsertVariable: (actionIndex: number, field: string, variable: string) => void;
  field: string;
  actionIndex: number;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [showVariables, setShowVariables] = useState(false);
  
  const commonVariables = [
    '{{task.title}}',
    '{{task.status}}',
    '{{user.name}}',
    '{{current_date}}'
  ];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          {commonVariables.map(variable => (
            <Button
              key={variable}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onInsertVariable(actionIndex, field, variable)}
            >
              {variable.replace(/[{}]/g, '')}
            </Button>
          ))}
        </div>
      </div>
      
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/**
 * Update Task Configuration
 */
function UpdateTaskConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={config.status || ''}
            onValueChange={(value) => onUpdate({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Do zrobienia</SelectItem>
              <SelectItem value="in_progress">W trakcie</SelectItem>
              <SelectItem value="review">Do przeglądu</SelectItem>
              <SelectItem value="done">Ukończone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Priorytet</Label>
          <Select
            value={config.priority || ''}
            onValueChange={(value) => onUpdate({ priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz priorytet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niski</SelectItem>
              <SelectItem value="medium">Średni</SelectItem>
              <SelectItem value="high">Wysoki</SelectItem>
              <SelectItem value="urgent">Pilny</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <VariableField
        label="Tytuł zadania (opcjonalnie)"
        value={config.title || ''}
        onChange={(value) => onUpdate({ title: value })}
        onInsertVariable={onInsertVariable}
        field="title"
        actionIndex={actionIndex}
        placeholder="Nowy tytuł zadania lub zostaw puste"
      />
      
      <VariableField
        label="Opis zadania (opcjonalnie)"
        value={config.description || ''}
        onChange={(value) => onUpdate({ description: value })}
        onInsertVariable={onInsertVariable}
        field="description"
        actionIndex={actionIndex}
        placeholder="Nowy opis zadania lub zostaw puste"
        multiline
      />
    </div>
  );
}

/**
 * Create Task Configuration
 */
function CreateTaskConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <VariableField
        label="Tytuł zadania *"
        value={config.title || ''}
        onChange={(value) => onUpdate({ title: value })}
        onInsertVariable={onInsertVariable}
        field="title"
        actionIndex={actionIndex}
        placeholder="Tytuł nowego zadania"
      />
      
      <VariableField
        label="Opis zadania"
        value={config.description || ''}
        onChange={(value) => onUpdate({ description: value })}
        onInsertVariable={onInsertVariable}
        field="description"
        actionIndex={actionIndex}
        placeholder="Opis nowego zadania"
        multiline
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorytet</Label>
          <Select
            value={config.priority || 'medium'}
            onValueChange={(value) => onUpdate({ priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niski</SelectItem>
              <SelectItem value="medium">Średni</SelectItem>
              <SelectItem value="high">Wysoki</SelectItem>
              <SelectItem value="urgent">Pilny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <VariableField
          label="Termin wykonania"
          value={config.due_date || ''}
          onChange={(value) => onUpdate({ due_date: value })}
          onInsertVariable={onInsertVariable}
          field="due_date"
          actionIndex={actionIndex}
          placeholder="+3 days, tomorrow, 2024-12-31"
        />
      </div>
    </div>
  );
}

/**
 * Send Notification Configuration
 */
function SendNotificationConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <VariableField
        label="Tytuł powiadomienia"
        value={config.title || ''}
        onChange={(value) => onUpdate({ title: value })}
        onInsertVariable={onInsertVariable}
        field="title"
        actionIndex={actionIndex}
        placeholder="Tytuł powiadomienia"
      />
      
      <VariableField
        label="Treść powiadomienia *"
        value={config.message || ''}
        onChange={(value) => onUpdate({ message: value })}
        onInsertVariable={onInsertVariable}
        field="message"
        actionIndex={actionIndex}
        placeholder="Treść powiadomienia z możliwością użycia zmiennych"
        multiline
      />
      
      <div className="space-y-2">
        <Label>Priorytet</Label>
        <Select
          value={config.priority || 'medium'}
          onValueChange={(value) => onUpdate({ priority: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Niski</SelectItem>
            <SelectItem value="medium">Średni</SelectItem>
            <SelectItem value="high">Wysoki</SelectItem>
            <SelectItem value="urgent">Pilny</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Add Comment Configuration
 */
function AddCommentConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <VariableField
        label="Treść komentarza *"
        value={config.comment || ''}
        onChange={(value) => onUpdate({ comment: value })}
        onInsertVariable={onInsertVariable}
        field="comment"
        actionIndex={actionIndex}
        placeholder="Treść komentarza z możliwością użycia zmiennych"
        multiline
      />
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`system-comment-${actionIndex}`}
          checked={config.is_system_comment !== false}
          onChange={(e) => onUpdate({ is_system_comment: e.target.checked })}
        />
        <Label htmlFor={`system-comment-${actionIndex}`}>
          Komentarz systemowy (nie może być edytowany przez użytkowników)
        </Label>
      </div>
    </div>
  );
}

/**
 * Update Custom Field Configuration
 */
function UpdateCustomFieldConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Typ obiektu</Label>
          <Select
            value={config.entity_type || 'task'}
            onValueChange={(value) => onUpdate({ entity_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Zadanie</SelectItem>
              <SelectItem value="project">Projekt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <VariableField
          label="Nazwa pola"
          value={config.field_name || ''}
          onChange={(value) => onUpdate({ field_name: value })}
          onInsertVariable={onInsertVariable}
          field="field_name"
          actionIndex={actionIndex}
          placeholder="Nazwa pola niestandardowego"
        />
      </div>
      
      <VariableField
        label="Nowa wartość *"
        value={config.value || ''}
        onChange={(value) => onUpdate({ value: value })}
        onInsertVariable={onInsertVariable}
        field="value"
        actionIndex={actionIndex}
        placeholder="Nowa wartość pola z możliwością użycia zmiennych"
      />
    </div>
  );
}

/**
 * Send Email Configuration
 */
function SendEmailConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <VariableField
        label="Adres email odbiorcy"
        value={config.recipient_email || ''}
        onChange={(value) => onUpdate({ recipient_email: value })}
        onInsertVariable={onInsertVariable}
        field="recipient_email"
        actionIndex={actionIndex}
        placeholder="email@example.com lub {{user.email}}"
      />
      
      <VariableField
        label="Temat wiadomości *"
        value={config.subject || ''}
        onChange={(value) => onUpdate({ subject: value })}
        onInsertVariable={onInsertVariable}
        field="subject"
        actionIndex={actionIndex}
        placeholder="Temat email z możliwością użycia zmiennych"
      />
      
      <VariableField
        label="Treść wiadomości *"
        value={config.content || ''}
        onChange={(value) => onUpdate({ content: value })}
        onInsertVariable={onInsertVariable}
        field="content"
        actionIndex={actionIndex}
        placeholder="Treść email z możliwością użycia zmiennych"
        multiline
      />
    </div>
  );
}

/**
 * Create Calendar Event Configuration
 */
function CreateCalendarEventConfig({ action, onUpdate, onInsertVariable, actionIndex }: any) {
  const config = action.config as any;
  
  return (
    <div className="space-y-4">
      <VariableField
        label="Tytuł wydarzenia *"
        value={config.title || ''}
        onChange={(value) => onUpdate({ title: value })}
        onInsertVariable={onInsertVariable}
        field="title"
        actionIndex={actionIndex}
        placeholder="Tytuł wydarzenia w kalendarzu"
      />
      
      <VariableField
        label="Opis wydarzenia"
        value={config.description || ''}
        onChange={(value) => onUpdate({ description: value })}
        onInsertVariable={onInsertVariable}
        field="description"
        actionIndex={actionIndex}
        placeholder="Opis wydarzenia"
        multiline
      />
      
      <div className="grid grid-cols-2 gap-4">
        <VariableField
          label="Data rozpoczęcia *"
          value={config.start_date || ''}
          onChange={(value) => onUpdate({ start_date: value })}
          onInsertVariable={onInsertVariable}
          field="start_date"
          actionIndex={actionIndex}
          placeholder="+3 days, tomorrow, 2024-12-31"
        />
        
        <VariableField
          label="Data zakończenia"
          value={config.end_date || ''}
          onChange={(value) => onUpdate({ end_date: value })}
          onInsertVariable={onInsertVariable}
          field="end_date"
          actionIndex={actionIndex}
          placeholder="Jeśli puste, tak samo jak start_date"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`all-day-${actionIndex}`}
          checked={config.all_day || false}
          onChange={(e) => onUpdate({ all_day: e.target.checked })}
        />
        <Label htmlFor={`all-day-${actionIndex}`}>
          Wydarzenie całodniowe
        </Label>
      </div>
    </div>
  );
} 