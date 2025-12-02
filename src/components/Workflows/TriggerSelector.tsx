import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { AlertCircle, Calendar, FileUp, MessageSquare, Users, Clock, Zap, Settings } from 'lucide-react';
import type { WorkflowTriggerType, TriggerConfig } from '../../lib/types/workflow';

interface TriggerSelectorProps {
  selectedTrigger: WorkflowTriggerType;
  triggerConfig: TriggerConfig;
  onTriggerChange: (trigger: WorkflowTriggerType) => void;
  onConfigChange: (config: TriggerConfig) => void;
}

const triggerOptions = [
  {
    value: 'task_status_changed' as WorkflowTriggerType,
    label: 'Zmiana statusu zadania',
    description: 'Gdy zadanie zostanie przeniesione między kolumnami',
    icon: Zap,
    color: 'bg-blue-500'
  },
  {
    value: 'task_created' as WorkflowTriggerType,
    label: 'Utworzenie zadania',
    description: 'Gdy zostanie utworzone nowe zadanie',
    icon: Calendar,
    color: 'bg-green-500'
  },
  {
    value: 'task_assigned' as WorkflowTriggerType,
    label: 'Przypisanie zadania',
    description: 'Gdy zadanie zostanie komuś przypisane',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    value: 'due_date_approaching' as WorkflowTriggerType,
    label: 'Zbliżający się termin',
    description: 'Gdy termin zadania jest już blisko',
    icon: Clock,
    color: 'bg-orange-500'
  },
  {
    value: 'custom_field_changed' as WorkflowTriggerType,
    label: 'Zmiana pola niestandardowego',
    description: 'Gdy wartość pola niestandardowego się zmieni',
    icon: AlertCircle,
    color: 'bg-indigo-500'
  },
  {
    value: 'file_uploaded' as WorkflowTriggerType,
    label: 'Przesłanie pliku',
    description: 'Gdy plik zostanie przesłany do projektu',
    icon: FileUp,
    color: 'bg-cyan-500'
  },
  {
    value: 'comment_added' as WorkflowTriggerType,
    label: 'Dodanie komentarza',
    description: 'Gdy zostanie dodany komentarz do zadania',
    icon: MessageSquare,
    color: 'bg-pink-500'
  },
  {
    value: 'project_status_changed' as WorkflowTriggerType,
    label: 'Zmiana statusu projektu',
    description: 'Gdy status całego projektu zostanie zmieniony',
    icon: Settings,
    color: 'bg-yellow-500'
  },
  {
    value: 'team_member_added' as WorkflowTriggerType,
    label: 'Dodanie członka zespołu',
    description: 'Gdy nowy członek zostanie dodany do projektu',
    icon: Users,
    color: 'bg-teal-500'
  },
  {
    value: 'scheduled' as WorkflowTriggerType,
    label: 'Zaplanowany czas',
    description: 'Uruchamiaj w określonych terminach',
    icon: Clock,
    color: 'bg-red-500'
  }
];

export function TriggerSelector({ 
  selectedTrigger, 
  triggerConfig, 
  onTriggerChange, 
  onConfigChange 
}: TriggerSelectorProps) {
  const [localConfig, setLocalConfig] = useState<TriggerConfig>(triggerConfig);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(triggerConfig);
  }, [triggerConfig]);

  // Update parent when local config changes
  useEffect(() => {
    onConfigChange(localConfig);
  }, [localConfig, onConfigChange]);

  const handleTriggerChange = (value: WorkflowTriggerType) => {
    onTriggerChange(value);
    // Reset config when trigger type changes
    setLocalConfig({});
  };

  const updateConfig = (key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const selectedTriggerOption = triggerOptions.find(option => option.value === selectedTrigger);

  return (
    <div className="space-y-6">
      {/* Trigger Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Wybierz typ wyzwalacza</CardTitle>
          <CardDescription>
            Wybierz zdarzenie, które ma uruchomić ten przepływ pracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {triggerOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedTrigger === option.value;
              
              return (
                <div
                  key={option.value}
                  onClick={() => handleTriggerChange(option.value)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
                    ${isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md ${option.color} text-white flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="mt-2 text-xs">
                          Wybrany
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Trigger Configuration */}
      {selectedTriggerOption && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${selectedTriggerOption.color} text-white`}>
                <selectedTriggerOption.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Konfiguracja: {selectedTriggerOption.label}</CardTitle>
                <CardDescription>
                  Ustaw szczegółowe warunki tego wyzwalacza
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Task Status Changed Configuration */}
            {selectedTrigger === 'task_status_changed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_status">Ze statusu (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).from_status || 'any'}
                    onValueChange={(value) => updateConfig('from_status', value === 'any' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dowolny status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Dowolny status</SelectItem>
                      <SelectItem value="todo">Do zrobienia</SelectItem>
                      <SelectItem value="in_progress">W trakcie</SelectItem>
                      <SelectItem value="review">Do sprawdzenia</SelectItem>
                      <SelectItem value="done">Gotowe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="to_status">Do statusu (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).to_status || 'any'}
                    onValueChange={(value) => updateConfig('to_status', value === 'any' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dowolny status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Dowolny status</SelectItem>
                      <SelectItem value="todo">Do zrobienia</SelectItem>
                      <SelectItem value="in_progress">W trakcie</SelectItem>
                      <SelectItem value="review">Do sprawdzenia</SelectItem>
                      <SelectItem value="done">Gotowe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      Jeśli nie wybierzesz statusów, przepływ uruchomi się przy każdej zmianie statusu zadania.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date Approaching Configuration */}
            {selectedTrigger === 'due_date_approaching' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="days_before">Ile dni przed terminem</Label>
                  <Select
                    value={(localConfig as any).days_before?.toString() || '1'}
                    onValueChange={(value) => updateConfig('days_before', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dzień przed</SelectItem>
                      <SelectItem value="3">3 dni przed</SelectItem>
                      <SelectItem value="7">Tydzień przed</SelectItem>
                      <SelectItem value="14">2 tygodnie przed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority_filter">Tylko dla priorytetu (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).priority_filter || 'all'}
                    onValueChange={(value) => updateConfig('priority_filter', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie priorytety" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie priorytety</SelectItem>
                      <SelectItem value="urgent">Tylko pilne</SelectItem>
                      <SelectItem value="high">Wysokie</SelectItem>
                      <SelectItem value="medium">Średnie</SelectItem>
                      <SelectItem value="low">Niskie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                  <p className="text-sm text-orange-300">
                    Ten wyzwalacz będzie sprawdzany codziennie o 9:00 rano.
                  </p>
                </div>
              </div>
            )}

            {/* Custom Field Changed Configuration */}
            {selectedTrigger === 'custom_field_changed' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="field_name">Nazwa pola</Label>
                  <Input
                    id="field_name"
                    value={(localConfig as any).field_name || ''}
                    onChange={(e) => updateConfig('field_name', e.target.value)}
                    placeholder="Wprowadź nazwę pola niestandardowego"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_type">Typ encji</Label>
                  <Select
                    value={(localConfig as any).entity_type || 'task'}
                    onValueChange={(value) => updateConfig('entity_type', value)}
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
                
                <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                  <p className="text-sm text-indigo-300">
                    Przepływ uruchomi się gdy wartość wybranego pola się zmieni.
                  </p>
                </div>
              </div>
            )}

            {/* File Uploaded Configuration */}
            {selectedTrigger === 'file_uploaded' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file_type_filter">Filtr typu pliku (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).file_type_filter || 'all'}
                    onValueChange={(value) => updateConfig('file_type_filter', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie typy plików" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie typy plików</SelectItem>
                      <SelectItem value="image">Tylko obrazy</SelectItem>
                      <SelectItem value="document">Tylko dokumenty</SelectItem>
                      <SelectItem value="video">Tylko filmy</SelectItem>
                      <SelectItem value="audio">Tylko audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_file_size">Minimalny rozmiar pliku (MB, opcjonalne)</Label>
                  <Input
                    id="min_file_size"
                    type="number"
                    value={(localConfig as any).min_file_size || ''}
                    onChange={(e) => updateConfig('min_file_size', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-cyan-300">
                    📁 Przepływ uruchomi się gdy zostanie przesłany plik spełniający warunki.
                  </p>
                </div>
              </div>
            )}

            {/* Comment Added Configuration */}
            {selectedTrigger === 'comment_added' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment_type_filter">Typ komentarza (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).comment_type_filter || 'all'}
                    onValueChange={(value) => updateConfig('comment_type_filter', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie komentarze" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie komentarze</SelectItem>
                      <SelectItem value="user">Tylko od użytkowników</SelectItem>
                      <SelectItem value="system">Tylko systemowe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                  <p className="text-sm text-pink-300">
                    💬 Przepływ uruchomi się gdy zostanie dodany komentarz do zadania.
                  </p>
                </div>
              </div>
            )}

            {/* Project Status Changed Configuration */}
            {selectedTrigger === 'project_status_changed' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from_project_status">Ze statusu (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).from_project_status || 'any'}
                    onValueChange={(value) => updateConfig('from_project_status', value === 'any' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dowolny status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Dowolny status</SelectItem>
                      <SelectItem value="planning">Planowanie</SelectItem>
                      <SelectItem value="active">Aktywny</SelectItem>
                      <SelectItem value="on_hold">Wstrzymany</SelectItem>
                      <SelectItem value="completed">Ukończony</SelectItem>
                      <SelectItem value="cancelled">Anulowany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="to_project_status">Do statusu (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).to_project_status || 'any'}
                    onValueChange={(value) => updateConfig('to_project_status', value === 'any' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dowolny status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Dowolny status</SelectItem>
                      <SelectItem value="planning">Planowanie</SelectItem>
                      <SelectItem value="active">Aktywny</SelectItem>
                      <SelectItem value="on_hold">Wstrzymany</SelectItem>
                      <SelectItem value="completed">Ukończony</SelectItem>
                      <SelectItem value="cancelled">Anulowany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    🎯 Przepływ uruchomi się gdy status projektu zostanie zmieniony.
                  </p>
                </div>
              </div>
            )}

            {/* Team Member Added Configuration */}
            {selectedTrigger === 'team_member_added' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role_filter">Filtr ról (opcjonalne)</Label>
                  <Select
                    value={(localConfig as any).role_filter || 'all'}
                    onValueChange={(value) => updateConfig('role_filter', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie role</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Członek</SelectItem>
                      <SelectItem value="viewer">Obserwator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-teal-900/20 border border-teal-500/30 rounded-lg">
                  <p className="text-sm text-teal-300">
                    👥 Przepływ uruchomi się gdy nowy członek zostanie dodany do zespołu.
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Configuration */}
            {selectedTrigger === 'scheduled' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule_type">Typ harmonogramu</Label>
                  <Select
                    value={(localConfig as any).schedule_type || 'daily'}
                    onValueChange={(value) => updateConfig('schedule_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Codziennie</SelectItem>
                      <SelectItem value="weekly">Co tydzień</SelectItem>
                      <SelectItem value="monthly">Co miesiąc</SelectItem>
                      <SelectItem value="custom">Niestandardowy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="execution_time">Godzina wykonania</Label>
                  <Input
                    id="execution_time"
                    type="time"
                    value={(localConfig as any).execution_time || '09:00'}
                    onChange={(e) => updateConfig('execution_time', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-200"
                  />
                </div>
                
                {(localConfig as any).schedule_type === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="day_of_week">Dzień tygodnia</Label>
                    <Select
                      value={(localConfig as any).day_of_week || 'monday'}
                      onValueChange={(value) => updateConfig('day_of_week', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Poniedziałek</SelectItem>
                        <SelectItem value="tuesday">Wtorek</SelectItem>
                        <SelectItem value="wednesday">Środa</SelectItem>
                        <SelectItem value="thursday">Czwartek</SelectItem>
                        <SelectItem value="friday">Piątek</SelectItem>
                        <SelectItem value="saturday">Sobota</SelectItem>
                        <SelectItem value="sunday">Niedziela</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {(localConfig as any).schedule_type === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="day_of_month">Dzień miesiąca</Label>
                    <Input
                      id="day_of_month"
                      type="number"
                      min="1"
                      max="31"
                      value={(localConfig as any).day_of_month || '1'}
                      onChange={(e) => updateConfig('day_of_month', parseInt(e.target.value))}
                      className="bg-slate-800 border-slate-600 text-slate-200"
                    />
                  </div>
                )}
                
                {(localConfig as any).schedule_type === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="cron_expression">Wyrażenie CRON</Label>
                    <Input
                      id="cron_expression"
                      value={(localConfig as any).cron_expression || '0 9 * * *'}
                      onChange={(e) => updateConfig('cron_expression', e.target.value)}
                      placeholder="0 9 * * * (codziennie o 9:00)"
                      className="bg-slate-800 border-slate-600 text-slate-200"
                    />
                    <p className="text-xs text-gray-400">
                      Format: minuta godzina dzień miesiąc dzień_tygodnia
                    </p>
                  </div>
                )}
                
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-300">
                    🕒 Przepływ będzie uruchamiany automatycznie zgodnie z harmonogramem.
                  </p>
                </div>
              </div>
            )}

            {/* Task Created - simple trigger, no config needed */}
            {selectedTrigger === 'task_created' && (
              <div className="p-6 bg-green-900/20 border-2 border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3 text-green-300 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Gotowy do działania</span>
                </div>
                <p className="text-sm text-green-400">
                  Ten przepływ będzie uruchamiany za każdym razem, gdy zostanie utworzone nowe zadanie w tym projekcie.
                </p>
              </div>
            )}

            {/* Task Assigned - simple trigger, no config needed */}
            {selectedTrigger === 'task_assigned' && (
              <div className="p-6 bg-purple-900/20 border-2 border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-3 text-purple-300 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Gotowy do działania</span>
                </div>
                <p className="text-sm text-purple-400">
                  Ten przepływ będzie uruchamiany za każdym razem, gdy zadanie zostanie komuś przypisane.
                </p>
              </div>
            )}

            {/* Enhanced Configuration Preview */}
            {Object.keys(localConfig).length > 0 && Object.values(localConfig).some(val => val !== undefined && val !== '') && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Label className="text-sm font-semibold text-blue-300">Podgląd Konfiguracji Wyzwalacza</Label>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(localConfig)
                      .filter(([_, value]) => value !== undefined && value !== '')
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600/30 rounded-md">
                          <span className="text-sm font-medium text-slate-300 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <Badge variant="secondary" className="bg-blue-600/80 text-blue-100 border-blue-500/30">
                            {String(value)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
                    <p className="text-xs text-green-300 flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Wyzwalacz zostanie uruchomiony gdy spełnione będą powyższe warunki
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 