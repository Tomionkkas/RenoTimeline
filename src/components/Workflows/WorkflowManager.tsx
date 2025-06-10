import React, { useState } from 'react';
import { Plus, Play, Pause, Edit, Trash2, Copy, Activity, BookOpen, Settings, Bug, HelpCircle, Zap, TrendingUp, Star, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useWorkflows } from '../../hooks/useWorkflows';
import { WorkflowBuilder } from './WorkflowBuilder';
import { WorkflowExecutionLog } from './WorkflowExecutionLog';
import ScheduledWorkflowManagerComponent from './ScheduledWorkflowManager';
import WorkflowTemplates from './WorkflowTemplates';
import { WorkflowDeleteModal } from './WorkflowDeleteModal';
import { WorkflowEventBus, AutoWorkflowManager, getWorkflowSystemStatus, initializeWorkflowSystem, workflowDebugLog, workflowDebugError } from '../../lib/workflow';
import WorkflowOnboarding from './WorkflowOnboarding';
import type { WorkflowDefinition } from '../../lib/types/workflow';

interface WorkflowManagerProps {
  projectId: string;
}

// Development mode - can be toggled with localStorage or environment
const isDevelopmentMode = () => {
  if (typeof window === 'undefined') return false;
  // Explicit enable via localStorage
  if (localStorage.getItem('workflow_dev_mode') === 'true') return true;
  // Explicit disable via localStorage
  if (localStorage.getItem('workflow_dev_mode') === 'false') return false;
  // Default: enabled only in dev environment
  return import.meta.env.DEV;
};

export function WorkflowManager({ projectId }: WorkflowManagerProps) {
  const { workflows, loading, error, realtimeConnected, deleteWorkflow, toggleWorkflow, refetch } = useWorkflows(projectId);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);
  const [showExecutions, setShowExecutions] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [devMode, setDevMode] = useState(isDevelopmentMode());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    workflow: WorkflowDefinition | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    workflow: null,
    isDeleting: false
  });

  // Conditional debug logging - only in dev mode
  React.useEffect(() => {
    workflowDebugLog('🎯 WorkflowManager - Workflows updated:', workflows.length, 'workflows');
    workflowDebugLog('🎯 WorkflowManager - Workflow list:', workflows.map(w => ({ id: w.id, name: w.name })));
  }, [workflows]);

  // Check if user should see onboarding
  React.useEffect(() => {
    const onboardingCompleted = localStorage.getItem('workflow_onboarding_completed');
    if (!onboardingCompleted && workflows.length === 0 && !loading) {
      // First time user with no workflows - show onboarding
      setShowOnboarding(true);
    }
  }, [workflows.length, loading]);

  const handleDelete = (workflow: WorkflowDefinition) => {
    setDeleteModal({
      isOpen: true,
      workflow,
      isDeleting: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.workflow) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await deleteWorkflow(deleteModal.workflow.id);
      setDeleteModal({
        isOpen: false,
        workflow: null,
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      workflow: null,
      isDeleting: false
    });
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleWorkflow(id, !isActive);
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleEdit = (workflow: WorkflowDefinition) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const handleDuplicate = (workflow: WorkflowDefinition) => {
    const duplicated = {
      ...workflow,
      name: `${workflow.name} (Copy)`,
      is_active: false
    };
    setEditingWorkflow(duplicated);
    setShowBuilder(true);
  };

  const handleBuilderClose = () => {
    workflowDebugLog('🎯 Builder closing, forcing workflow refresh...');
    setShowBuilder(false);
    setEditingWorkflow(null);
    
    // Force refresh when builder closes to ensure we have latest data
    setTimeout(() => {
      workflowDebugLog('🎯 Forcing workflow list refresh after builder close');
      refetch();
    }, 100);
  };

  const handleViewExecutions = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setShowExecutions(true);
  };

  // Debug functions - only available in dev mode
  const handleDebugCheck = async () => {
    if (!devMode) return;
    
    try {
      let systemStatus;
      try {
        systemStatus = getWorkflowSystemStatus();
      } catch (error) {
        workflowDebugError('🚨 [WORKFLOW-MANAGER] Error getting system status:', error);
        systemStatus = { 
          error: 'WorkflowSystemInitializer not initialized',
          initialized: false 
        };
      }
      
      const eventBusHandlers = WorkflowEventBus.getRegisteredEvents();
      
      let queueStatus;
      try {
        queueStatus = AutoWorkflowManager.getQueueStatus();
      } catch (error) {
        console.error('🚨 [WORKFLOW-MANAGER] Error getting queue status:', error);
        queueStatus = { 
          error: 'AutoWorkflowManager not initialized',
          queueLength: 0,
          processing: 0 
        };
      }
      
      const debug = {
        systemStatus,
        eventBusHandlers,
        queueStatus,
        currentWorkflows: workflows.length,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debug);
      setShowDebugPanel(true);
      
      console.log('🐛 [WORKFLOW-MANAGER] Debug info:', debug);
    } catch (error) {
      console.error('🚨 [WORKFLOW-MANAGER] Critical error getting debug info:', error);
    }
  };

  const handleTestEvent = async () => {
    if (!devMode) return;
    
    try {
      console.log('🧪 [WORKFLOW-MANAGER] Testing task status changed event...');
      
      await WorkflowEventBus.emit('task_status_changed', {
        type: 'task_status_changed',
        task_id: 'test-task-123',
        project_id: projectId,
        from_status: 'todo',
        to_status: 'in_progress',
        user_id: 'test-user-123',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ [WORKFLOW-MANAGER] Test event emitted successfully');
    } catch (error) {
      console.error('❌ [WORKFLOW-MANAGER] Test event failed:', error);
    }
  };

  const handleForceInit = async () => {
    if (!devMode) return;
    
    try {
      console.log('🔧 [WORKFLOW-MANAGER] Force initializing workflow system...');
      await initializeWorkflowSystem();
      console.log('✅ [WORKFLOW-MANAGER] Force initialization completed');
      
      // Refresh debug info after initialization
      setTimeout(() => {
        handleDebugCheck();
      }, 500);
    } catch (error) {
      console.error('❌ [WORKFLOW-MANAGER] Force initialization failed:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!devMode) return;
    
    try {
      console.log('🧪 [WORKFLOW-MANAGER] Creating test workflow notification...');
      const { supabase } = await import('../../integrations/supabase');
      
      // Get current user ID (simplified approach)
      const testNotification = {
        user_id: '12345678-1234-1234-1234-123456789012', // This would be replaced with actual user ID
        project_id: projectId,
        type: 'automated_action',
        title: 'Test Workflow Notification',
        message: 'This is a test notification to verify the workflow notification system is working.',
        priority: 'medium',
        workflow_id: 'test-workflow-id',
        metadata: {
          workflow_name: 'Test Workflow',
          action_type: 'send_notification',
          triggered_by: 'manual_test'
        }
      };

      const { error } = await (supabase as any)
        .from('notifications')
        .insert(testNotification);

      if (error) {
        console.error('❌ [WORKFLOW-MANAGER] Failed to create test notification:', error);
      } else {
        console.log('✅ [WORKFLOW-MANAGER] Test notification created successfully');
      }
      
    } catch (error) {
      console.error('❌ [WORKFLOW-MANAGER] Test notification failed:', error);
    }
  };

  const toggleDevMode = () => {
    const newDevMode = !devMode;
    setDevMode(newDevMode);
    localStorage.setItem('workflow_dev_mode', newDevMode.toString());
    if (newDevMode) {
      console.log('🔧 Workflow development mode enabled');
    } else {
      console.log('🔧 Workflow development mode disabled');
    }
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowBuilder(true);
  };

  const formatTriggerType = (triggerType: string) => {
    const translations: Record<string, string> = {
      'task_status_changed': 'Zmiana statusu zadania',
      'task_created': 'Utworzenie zadania',
      'task_assigned': 'Przypisanie zadania',
      'due_date_approaching': 'Zbliżający się termin',
      'custom_field_changed': 'Zmiana pola niestandardowego',
      'file_uploaded': 'Przesłanie pliku'
    };
    return translations[triggerType] || triggerType;
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        projectId={projectId}
        workflow={editingWorkflow}
        onClose={handleBuilderClose}
      />
    );
  }

  if (showExecutions) {
    return (
      <WorkflowExecutionLog
        workflowId={selectedWorkflowId || undefined}
        onClose={() => {
          setShowExecutions(false);
          setSelectedWorkflowId(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="p-4 bg-blue-800/30 rounded-full mb-4 mx-auto w-fit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
          <p className="text-blue-100 font-medium">Ładowanie przepływów pracy...</p>
          <p className="text-blue-300/70 text-sm mt-1">Przygotowujemy automatyzacje dla Twojego projektu</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 max-w-md animate-fadeIn">
          <CardContent className="text-center p-8">
            <div className="p-4 bg-red-800/30 rounded-full mb-4 mx-auto w-fit">
              <Zap className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-100 font-medium mb-4">❌ Błąd ładowania workflow</p>
            <p className="text-red-300/70 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between animate-slideUp">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ Przepływy pracy
            {/* Hidden dev mode toggle - double-click to access */}
            <span 
              className="ml-2 opacity-0 hover:opacity-30 cursor-pointer select-none text-xs"
              onDoubleClick={toggleDevMode}
              title="Double-click to toggle development mode"
            >
              DEV
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Automatyzuj powtarzające się zadania i zwiększ efektywność zespołu
            {realtimeConnected && (
              <span className="inline-flex items-center ml-3 px-3 py-1 bg-green-900/30 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-green-300 text-sm font-medium">Na żywo</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Dev mode debug controls - only visible in dev mode */}
          {devMode && (
            <div className="flex gap-2 mr-3">
              <Button variant="outline" size="sm" onClick={handleDebugCheck} className="border-orange-500/30 text-orange-300 hover:bg-orange-900/20">
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestEvent} className="border-blue-500/30 text-blue-300 hover:bg-blue-900/20">
                Test Event
              </Button>
              <Button variant="outline" size="sm" onClick={handleForceInit} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20">
                Force Init
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestNotification} className="border-green-500/30 text-green-300 hover:bg-green-900/20">
                Test Notification
              </Button>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={handleShowOnboarding}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Przewodnik
          </Button>
          <Button 
            onClick={() => setShowBuilder(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Utwórz przepływ
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700 p-1">
          <TabsTrigger 
            value="workflows" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <Activity className="w-4 h-4" />
            Moje przepływy
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <BookOpen className="w-4 h-4" />
            Szablony
          </TabsTrigger>
          <TabsTrigger 
            value="executions" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            Wykonania
          </TabsTrigger>
          <TabsTrigger 
            value="scheduled" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            Zaplanowane
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-8">
          {/* Enhanced Workflows Grid */}
          {workflows.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="p-6 bg-blue-800/30 rounded-full mb-6 mx-auto w-fit">
                    <Activity className="h-16 w-16 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">🚀 Brak przepływów pracy</h3>
                  <p className="text-gray-300 mb-8 text-lg max-w-md mx-auto">
                    Zacznij od utworzenia pierwszego przepływu aby zautomatyzować powtarzające się zadania.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleShowOnboarding}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 transform hover:scale-105"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Przewodnik
                    </Button>
                    <Button 
                      onClick={() => setShowBuilder(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200 transform hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Utwórz pierwszy przepływ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow, index) => (
                <Card 
                  key={workflow.id} 
                  className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl hover:border-gray-500 transition-all duration-300 transform hover:scale-105 animate-slideUp" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-blue-800/30 rounded-lg border border-blue-600/30">
                            <Zap className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-white">{workflow.name}</CardTitle>
                            {workflow.description && (
                              <CardDescription className="text-gray-300 mt-1">
                                {workflow.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={`ml-3 ${workflow.is_active 
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white border-0' 
                          : 'bg-gray-600 text-gray-300 border-0'
                        }`}
                      >
                        {workflow.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Trigger Info */}
                    <div className="p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm font-semibold">Wyzwalacz:</span>
                      </div>
                      <p className="text-white font-medium mt-1">
                        {formatTriggerType(workflow.trigger_type)}
                      </p>
                    </div>

                    {/* Actions Count */}
                    <div className="p-3 bg-gradient-to-r from-blue-900/30 to-green-900/30 rounded-lg border border-blue-500/30">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-semibold">Akcje:</span>
                      </div>
                      <p className="text-white font-medium mt-1">
                        {Array.isArray(workflow.actions) ? workflow.actions.length : 0} zdefiniowanych działań
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(workflow.id, workflow.is_active)}
                        className={`border-gray-600 transition-all duration-200 ${workflow.is_active 
                          ? 'text-yellow-400 hover:bg-yellow-900/20 hover:border-yellow-500/30' 
                          : 'text-green-400 hover:bg-green-900/20 hover:border-green-500/30'
                        }`}
                        title={workflow.is_active ? 'Zatrzymaj' : 'Uruchom'}
                      >
                        {workflow.is_active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(workflow)}
                        className="border-gray-600 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all duration-200"
                        title="Edytuj"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(workflow)}
                        className="border-gray-600 text-purple-400 hover:bg-purple-900/20 hover:border-purple-500/30 transition-all duration-200"
                        title="Duplikuj"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewExecutions(workflow.id)}
                        className="border-gray-600 text-green-400 hover:bg-green-900/20 hover:border-green-500/30 transition-all duration-200"
                        title="Historia wykonań"
                      >
                        <Activity className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workflow)}
                        className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-200"
                        title="Usuń"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-8">
          <WorkflowTemplates 
            projectId={projectId}
            onTemplateInstall={() => {
              // Refresh workflows and switch to workflows tab
              setActiveTab('workflows');
            }}
          />
        </TabsContent>

        <TabsContent value="executions" className="mt-8">
          <WorkflowExecutionLog onClose={() => setActiveTab('workflows')} />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-8">
          <ScheduledWorkflowManagerComponent projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Enhanced Debug Panel - only visible in dev mode */}
      {showDebugPanel && devMode && (
        <Card className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-orange-500/30 shadow-xl animate-slideUp">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-800/30 rounded-lg border border-orange-600/30">
                  <Bug className="w-5 h-5 text-orange-400" />
                </div>
                <CardTitle className="text-orange-100">🐛 Workflow Debug Panel</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebugPanel(false)}
                className="border-orange-500/30 text-orange-300 hover:bg-orange-900/20"
              >
                Zamknij
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-200">System Status:</h4>
                <pre className="bg-gray-900/50 p-4 rounded-lg text-xs text-gray-300 overflow-auto border border-gray-700">
                  {JSON.stringify(debugInfo?.systemStatus, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-200">Event Bus Handlers:</h4>
                <pre className="bg-gray-900/50 p-4 rounded-lg text-xs text-gray-300 overflow-auto border border-gray-700">
                  {JSON.stringify(debugInfo?.eventBusHandlers, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-200">Queue Status:</h4>
                <pre className="bg-gray-900/50 p-4 rounded-lg text-xs text-gray-300 overflow-auto border border-gray-700">
                  {JSON.stringify(debugInfo?.queueStatus, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-200">Current Workflows:</h4>
                <p className="text-orange-100">Znalezione przepływy: {debugInfo?.currentWorkflows || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Onboarding */}
      {showOnboarding && (
        <WorkflowOnboarding
          onClose={() => setShowOnboarding(false)}
          onCreateFirst={handleOnboardingComplete}
        />
      )}

      {/* Delete Modal */}
      <WorkflowDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        workflow={deleteModal.workflow}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
} 