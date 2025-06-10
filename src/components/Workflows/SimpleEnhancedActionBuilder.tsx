import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Info, Wand2, CheckCircle, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface SimpleEnhancedActionBuilderProps {
  actions: any[];
  onActionsChange: (actions: any[]) => void;
}

/**
 * Enhanced Action Builder with improved UX and user-friendly design
 */
export function SimpleEnhancedActionBuilder({ actions, onActionsChange }: SimpleEnhancedActionBuilderProps) {
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
  const [showVariableHelp, setShowVariableHelp] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const actionTypes = [
    { 
      value: 'update_task', 
      label: 'Aktualizuj zadanie', 
      icon: '✏️',
      description: 'Zmienia status, priorytet lub inne właściwości zadania',
      color: 'bg-blue-600/10 border-blue-400/30'
    },
    { 
      value: 'send_notification', 
      label: 'Wyślij powiadomienie', 
      icon: '🔔',
      description: 'Wysyła powiadomienie do użytkowników',
      color: 'bg-indigo-600/10 border-indigo-400/30'
    },
    { 
      value: 'add_comment', 
      label: 'Dodaj komentarz', 
      icon: '💬',
      description: 'Dodaje automatyczny komentarz do zadania',
      color: 'bg-cyan-600/10 border-cyan-400/30'
    }
  ];

  // User-friendly variable examples
  const variableExamples = [
    {
      category: 'Zadanie',
      icon: <FileText className="h-4 w-4" />,
      variables: [
        { code: '{task.title}', example: 'Nazwa zadania', description: 'Tytuł aktualnego zadania' },
        { code: '{task.status}', example: 'W trakcie', description: 'Aktualny status zadania' },
        { code: '{task.priority}', example: 'Wysoki', description: 'Priorytet zadania' }
      ]
    },
    {
      category: 'Użytkownik',
      icon: <User className="h-4 w-4" />,
      variables: [
        { code: '{user.name}', example: 'Jan Kowalski', description: 'Imię i nazwisko użytkownika' },
        { code: '{user.email}', example: 'jan@firma.pl', description: 'Adres email użytkownika' }
      ]
    },
    {
      category: 'Data i czas',
      icon: <Calendar className="h-4 w-4" />,
      variables: [
        { code: '{current_date}', example: '2024-02-15', description: 'Dzisiejsza data' },
        { code: '{current_time}', example: '14:30', description: 'Aktualny czas' }
      ]
    }
  ];

  const addAction = () => {
    const newAction = {
      type: 'send_notification',
      config: { 
        message: 'Zadanie {task.title} zostało zaktualizowane',
        title: 'Aktualizacja zadania'
      }
    };
    
    const newActions = [...actions, newAction];
    onActionsChange(newActions);
    setExpandedActions(prev => new Set([...prev, newActions.length - 1]));
    
    // Show success feedback
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateAction = (index: number, updates: any) => {
    const updatedActions = actions.map((action, i) => 
      i === index ? { ...action, ...updates } : action
    );
    onActionsChange(updatedActions);
    
    // Show saving feedback
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const insertVariable = (inputId: string, variable: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      input.value = newText;
      input.focus();
      input.setSelectionRange(start + variable.length, start + variable.length);
      
      // Trigger change event
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
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

  return (
    <div className="space-y-6">
      {/* Save Status Alert - Dark Theme */}
      {saveStatus !== 'idle' && (
        <Alert className={`${
          saveStatus === 'saved' ? 'border-green-500/50 bg-green-900/30' : 
          saveStatus === 'saving' ? 'border-blue-500/50 bg-blue-900/30' : 
          'border-red-500/50 bg-red-900/30'
        }`}>
          <CheckCircle className={`h-4 w-4 ${
            saveStatus === 'saved' ? 'text-green-400' : 
            saveStatus === 'saving' ? 'text-blue-400' : 
            'text-red-400'
          }`} />
          <AlertDescription className={`${
            saveStatus === 'saved' ? 'text-green-300' : 
            saveStatus === 'saving' ? 'text-blue-300' : 
            'text-red-300'
          }`}>
            {saveStatus === 'saved' && '✅ Akcja została zapisana pomyślnie!'}
            {saveStatus === 'saving' && '💾 Zapisywanie...'}
            {saveStatus === 'error' && '❌ Błąd podczas zapisywania. Spróbuj ponownie.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Header Card - Dark Theme */}
      <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <Wand2 className="h-5 w-5 text-blue-400" />
                Automatyczne Akcje
                <Badge variant="secondary" className="bg-blue-600/80 text-blue-100 border-blue-500/30">
                  {actions.length} {actions.length === 1 ? 'akcja' : 'akcji'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Skonfiguruj co ma się dziać, gdy workflow zostanie uruchomiony.
                Możesz używać zmiennych takich jak nazwa zadania czy imię użytkownika.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVariableHelp(!showVariableHelp)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
              >
                <Info className="h-4 w-4 mr-2" />
                Zmienne
              </Button>
              <Button 
                onClick={addAction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj Akcję
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Variable Help Panel - Dark Theme */}
        {showVariableHelp && (
          <CardContent className="border-t border-slate-600/50 bg-slate-800/30">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                <h4 className="font-semibold text-slate-200">Dostępne Zmienne</h4>
              </div>
              <div className="text-sm text-blue-300 bg-blue-900/30 border border-blue-500/30 p-3 rounded-md">
                💡 <strong>Jak używać:</strong> Kliknij na zmienną poniżej, aby ją wstawić do pola tekstowego. 
                Zmienne automatycznie zastąpią się prawdziwymi wartościami podczas wykonywania.
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {variableExamples.map((category, catIndex) => (
                  <div key={catIndex} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      {category.icon}
                      <span>{category.category}</span>
                    </div>
                    <div className="space-y-2">
                      {category.variables.map((variable, varIndex) => (
                        <div key={varIndex} className="p-3 bg-slate-800/50 border border-slate-600/30 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {variable.code}
                            </code>
                            <span className="text-xs text-green-400 font-medium">
                              {variable.example}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* No Actions State */}
      {actions.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Jeszcze nie ma żadnych akcji
              </h3>
              <p className="text-gray-600 mb-4">
                Dodaj swoją pierwszą automatyczną akcję, aby rozpocząć tworzenie przepływu pracy.
              </p>
              <Button onClick={addAction} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj Pierwszą Akcję
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions List */}
      {actions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-200">
              Skonfigurowane Akcje ({actions.length})
            </h3>
            <Badge variant="outline" className="text-green-300 bg-green-600/20 border-green-500/30">
              Gotowe do uruchomienia
            </Badge>
          </div>

          {actions.map((action, index) => {
            const actionType = actionTypes.find(t => t.value === action.type);
            const isExpanded = expandedActions.has(index);
            
            return (
              <Card key={index} className={`${actionType?.color} border-2 transition-all duration-200 hover:shadow-md`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleExpanded(index)}
                    >
                      <div className="text-2xl">{actionType?.icon}</div>
                      <div>
                        <div className="font-semibold text-slate-200">{actionType?.label}</div>
                        <div className="text-sm text-slate-400">{actionType?.description}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Akcja #{index + 1} • Kliknij aby {isExpanded ? 'zwinąć' : 'rozwinąć'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600/50">
                        {action.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t border-slate-600/30 bg-slate-800/30 pt-6">
                    {/* Action Type Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-300">Typ Akcji</Label>
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, { 
                          type: value, 
                          config: actionTypes.find(t => t.value === value)?.value === 'send_notification' 
                            ? { message: 'Zadanie {task.title} zostało zaktualizowane', title: 'Aktualizacja' }
                            : {}
                        })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{type.icon}</span>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-slate-400">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Configuration */}
                    {action.type === 'update_task' && (
                      <div className="space-y-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <h4 className="font-medium text-blue-300 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Konfiguracja Aktualizacji Zadania
                        </h4>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Nowy Status</Label>
                          <Select
                            value={action.config?.status || ''}
                            onValueChange={(value) => updateAction(index, {
                              config: { ...action.config, status: value }
                            })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                              <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">📋 Do zrobienia</SelectItem>
                              <SelectItem value="in_progress">⚡ W trakcie</SelectItem>
                              <SelectItem value="review">👀 Do przeglądu</SelectItem>
                              <SelectItem value="done">✅ Ukończone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {action.type === 'send_notification' && (
                      <div className="space-y-4 p-4 bg-indigo-600/10 border border-indigo-400/30 rounded-lg">
                        <h4 className="font-medium text-indigo-300 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Konfiguracja Powiadomienia
                        </h4>
                        
                        <div className="space-y-2">
                          <Label className="text-slate-300">Tytuł Powiadomienia</Label>
                          <div className="flex gap-2">
                            <Input
                              id={`title-${index}`}
                              value={action.config?.title || ''}
                              onChange={(e) => updateAction(index, {
                                config: { ...action.config, title: e.target.value }
                              })}
                              placeholder="np. Aktualizacja zadania"
                              className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
                            />
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`title-${index}`, '{task.title}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                Nazwa zadania
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-300">Treść Powiadomienia</Label>
                          <div className="space-y-2">
                            <Textarea
                              id={`message-${index}`}
                              value={action.config?.message || ''}
                              onChange={(e) => updateAction(index, {
                                config: { ...action.config, message: e.target.value }
                              })}
                              placeholder="np. Zadanie {task.title} zostało zaktualizowane przez {user.name}"
                              className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 min-h-[80px]"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`message-${index}`, '{task.title}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                📋 Nazwa zadania
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`message-${index}`, '{user.name}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                👤 Imię użytkownika
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`message-${index}`, '{current_date}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                📅 Dzisiejsza data
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-indigo-300 bg-indigo-600/20 border border-indigo-400/30 p-2 rounded">
                          💡 <strong>Podgląd:</strong> {action.config?.message?.replace('{task.title}', 'Przykładowe zadanie')
                            ?.replace('{user.name}', 'Jan Kowalski')
                            ?.replace('{current_date}', '2024-02-15') || 'Wprowadź treść powiadomienia'}
                        </div>
                      </div>
                    )}

                    {action.type === 'add_comment' && (
                      <div className="space-y-4 p-4 bg-cyan-600/10 border border-cyan-400/30 rounded-lg">
                        <h4 className="font-medium text-cyan-300 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Konfiguracja Komentarza
                        </h4>
                        
                        <div className="space-y-2">
                          <Label className="text-slate-300">Treść Komentarza</Label>
                          <div className="space-y-2">
                            <Textarea
                              id={`comment-${index}`}
                              value={action.config?.comment || ''}
                              onChange={(e) => updateAction(index, {
                                config: { ...action.config, comment: e.target.value }
                              })}
                              placeholder="np. Zadanie {task.title} zostało automatycznie zaktualizowane w dniu {current_date}"
                              className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 min-h-[80px]"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`comment-${index}`, '{task.title}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                📋 Nazwa zadania
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`comment-${index}`, '{user.name}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                👤 Imię użytkownika
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(`comment-${index}`, '{current_date}')}
                                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                📅 Dzisiejsza data
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-cyan-300 bg-cyan-600/20 border border-cyan-400/30 p-2 rounded">
                          💡 <strong>Podgląd:</strong> {action.config?.comment?.replace('{task.title}', 'Przykładowe zadanie')
                            ?.replace('{user.name}', 'Jan Kowalski')
                            ?.replace('{current_date}', '2024-02-15') || 'Wprowadź treść komentarza'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Section - App Theme */}
      {actions.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-blue-300">Podsumowanie Workflow</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-blue-400">
                <strong>Skonfigurowano {actions.length} {actions.length === 1 ? 'akcję' : 'akcji'}:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-300 ml-4">
                {actions.map((action, index) => {
                  const actionType = actionTypes.find(t => t.value === action.type);
                  return (
                    <li key={index}>
                      {actionType?.icon} {actionType?.label}
                      {action.type === 'send_notification' && action.config?.title && 
                        ` - "${action.config.title}"`}
                      {action.type === 'update_task' && action.config?.status && 
                        ` - zmieni status na "${action.config.status}"`}
                      {action.type === 'add_comment' && action.config?.comment && 
                        ` - doda komentarz`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 