import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Save, Zap, Settings, Activity, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { useWorkflows } from '../../hooks/useWorkflows';
import { TriggerSelector } from './TriggerSelector';
import { SimpleEnhancedActionBuilder } from './SimpleEnhancedActionBuilder';
import type { WorkflowDefinition, WorkflowAction, WorkflowTriggerType, TriggerConfig } from '../../lib/types/workflow';

interface WorkflowBuilderProps {
  projectId: string;
  workflow?: WorkflowDefinition | null;
  onClose: () => void;
}

type WizardStep = 'basic' | 'trigger' | 'actions' | 'review';

const STEPS: { key: WizardStep; label: string; description: string; icon: any }[] = [
  { key: 'basic', label: 'Podstawowe', description: 'Nazwa i opis', icon: Settings },
  { key: 'trigger', label: 'Wyzwalacz', description: 'Kiedy uruchomić', icon: Zap },
  { key: 'actions', label: 'Akcje', description: 'Co zrobić', icon: Activity },
  { key: 'review', label: 'Przegląd', description: 'Sprawdź i zapisz', icon: Eye }
];

export function WorkflowBuilder({ projectId, workflow, onClose }: WorkflowBuilderProps) {
  const { createWorkflow, updateWorkflow } = useWorkflows(projectId);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    is_active: workflow?.is_active ?? true,
    trigger_type: (workflow?.trigger_type || 'task_status_changed') as WorkflowTriggerType,
    trigger_config: (workflow?.trigger_config || {}) as TriggerConfig,
    conditions: workflow?.conditions || {},
    actions: (workflow?.actions || []) as WorkflowAction[]
  });

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim().length > 0;
      case 'trigger':
        return formData.trigger_type.length > 0;
      case 'actions':
        return formData.actions.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const workflowData = {
        name: formData.name,
        description: formData.description,
        project_id: projectId,
        is_active: formData.is_active,
        trigger_type: formData.trigger_type,
        trigger_config: formData.trigger_config,
        conditions: formData.conditions,
        actions: formData.actions,
        created_by: 'current-user'
      };

      if (workflow?.id) {
        await updateWorkflow(workflow.id, workflowData);
      } else {
        console.log('WorkflowBuilder - Creating workflow...');
        await createWorkflow(workflowData as any);
        console.log('WorkflowBuilder - Workflow created successfully');
      }

              console.log('WorkflowBuilder - Closing builder...');
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="text-center animate-slideUp">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="absolute top-6 left-6 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót
          </Button>
          
          <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mb-6 mx-auto w-fit border border-blue-500/30">
            <Activity className="h-12 w-12 text-blue-400 animate-pulse" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            {workflow ? 'Edytuj przepływ pracy' : 'Utwórz przepływ pracy'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Automatyzuj zadania, gdy wystąpią określone zdarzenia
          </p>
        </div>

        {/* Enhanced Progress Section */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
          <CardContent className="p-8">
            {/* Step Navigation */}
            <div className="flex justify-between text-sm mb-6">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;
                const isAccessible = index <= currentStepIndex;
                
                return (
                  <div 
                    key={step.key} 
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                      isAccessible ? 'text-white cursor-pointer' : 'text-gray-500'
                    } ${isActive ? 'scale-110' : ''}`}
                    onClick={() => isAccessible && setCurrentStep(step.key)}
                  >
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isComplete
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                          : isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-400 shadow-lg animate-pulse' 
                          : 'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}
                    >
                      {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="text-center min-w-0">
                      <div className={`font-medium ${isActive ? 'text-blue-400' : ''}`}>{step.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative mb-4">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="absolute -top-8 right-0 text-sm font-medium text-blue-400">
                {Math.round(progress)}%
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm">
              Krok {currentStepIndex + 1} z {STEPS.length}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Content Section */}
        <div className="min-h-[500px] animate-slideUp">
          {/* Basic Information Step */}
          {currentStep === 'basic' && (
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                    <Settings className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Podstawowe informacje</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Nadaj nazwa i opis swojemu przepływowi pracy
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-white font-medium text-lg">Nazwa przepływu *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Auto-uzupełnij zadania po przeniesieniu do 'Gotowe'"
                    required
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg p-4"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-white font-medium text-lg">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Opisz, co robi ten przepływ i kiedy powinien się uruchomić..."
                    rows={5}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg p-4 resize-none"
                  />
                </div>

                {/* Info Card */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mt-6">
                  <div className="flex items-center gap-3 text-blue-300">
                    <Activity className="h-5 w-5" />
                    <span className="font-medium">Wskazówka</span>
                  </div>
                  <p className="text-blue-200 mt-2">
                    Wybierz opisową nazwę, która wyjaśnia cel automatyzacji. To pomoże Ci później łatwo zarządzać wieloma przepływami pracy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trigger Configuration Step */}
          {currentStep === 'trigger' && (
            <div className="animate-slideUp">
              <TriggerSelector
                selectedTrigger={formData.trigger_type}
                triggerConfig={formData.trigger_config}
                onTriggerChange={(trigger) => setFormData(prev => ({ 
                  ...prev, 
                  trigger_type: trigger,
                  trigger_config: {} 
                }))}
                onConfigChange={(config) => setFormData(prev => ({ 
                  ...prev, 
                  trigger_config: config 
                }))}
              />
            </div>
          )}

          {/* Actions Configuration Step */}
          {currentStep === 'actions' && (
            <div className="animate-slideUp">
              <SimpleEnhancedActionBuilder
                actions={formData.actions}
                onActionsChange={(actions) => setFormData(prev => ({ 
                  ...prev, 
                  actions: actions 
                }))}
              />
            </div>
          )}

          {/* Enhanced Review Step */}
          {currentStep === 'review' && (
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-600/20 rounded-lg border border-green-500/30">
                    <Eye className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Przegląd przepływu pracy</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Sprawdź konfigurację przepływu przed zapisaniem
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {/* Basic Info Review */}
                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                  <h4 className="font-bold mb-4 text-white text-xl flex items-center gap-2">
                    <div className="p-1 bg-blue-600/20 rounded border border-blue-500/30">
                      <Settings className="h-5 w-5 text-blue-400" />
                    </div>
                    Podstawowe informacje
                  </h4>
                  <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 p-6 rounded-lg space-y-3">
                    <div className="text-white text-lg">
                      <strong className="text-blue-400">Nazwa:</strong> 
                      <span className="ml-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-blue-300">
                        {formData.name}
                      </span>
                    </div>
                    {formData.description && (
                      <div className="text-white">
                        <strong className="text-blue-400">Opis:</strong>
                        <div className="mt-2 p-3 bg-blue-800/20 border border-blue-500/20 rounded text-blue-100">
                          {formData.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trigger Review */}
                <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                  <h4 className="font-bold mb-4 text-white text-xl flex items-center gap-2">
                    <div className="p-1 bg-yellow-600/20 rounded border border-yellow-500/30">
                      <Zap className="h-5 w-5 text-yellow-400" />
                    </div>
                    Wyzwalacz
                  </h4>
                  <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30 p-6 rounded-lg space-y-3">
                    <div className="text-white text-lg">
                      <strong className="text-yellow-400">Typ:</strong> 
                      <span className="ml-2 px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-yellow-300">
                        {formData.trigger_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {Object.keys(formData.trigger_config).length > 0 && (
                      <div className="text-white">
                        <strong className="text-yellow-400">Konfiguracja:</strong>
                        <div className="mt-3 p-4 bg-yellow-800/20 border border-yellow-500/20 rounded">
                          {Object.entries(formData.trigger_config)
                            .filter(([_, value]) => value !== undefined && value !== '')
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center py-1">
                                <span className="text-cyan-400 font-medium">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-green-400 font-mono text-sm px-2 py-1 bg-green-900/20 border border-green-500/30 rounded">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Review */}
                <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
                  <h4 className="font-bold mb-4 text-white text-xl flex items-center gap-2">
                    <div className="p-1 bg-purple-600/20 rounded border border-purple-500/30">
                      <Activity className="h-5 w-5 text-purple-400" />
                    </div>
                    Akcje ({formData.actions.length})
                  </h4>
                  <div className="space-y-4">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-500/30 p-6 rounded-lg animate-slideUp" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
                        <div className="font-bold text-lg mb-3 text-white flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="capitalize text-purple-300">{action.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="bg-purple-800/20 border border-purple-500/20 p-4 rounded">
                          {Object.entries(action.config || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-purple-500/10 last:border-b-0">
                              <span className="text-cyan-400 font-medium">{key}:</span>
                              <span className="text-green-400 font-mono text-sm px-2 py-1 bg-green-900/20 border border-green-500/30 rounded max-w-xs truncate">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Status */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-6 animate-slideUp" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3 text-green-300 mb-3">
                    <div className="p-1 bg-green-600/30 rounded-full">
                      <Check className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl">Workflow gotowy do zapisania!</span>
                  </div>
                  <p className="text-green-200 text-lg">
                    Wszystkie kroki zostały skonfigurowane. Kliknij "Zapisz przepływ" aby aktywować automatyzację.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Navigation */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-lg"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Poprzedni
              </Button>

              <div className="text-center">
                <div className="text-lg font-medium text-white">
                  {STEPS[currentStepIndex]?.label}
                </div>
                <div className="text-sm text-gray-400">
                  {STEPS[currentStepIndex]?.description}
                </div>
              </div>

              {currentStep === 'review' ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Zapisz przepływ
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-lg"
                >
                  Następny
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 