// Main workflow system exports
export { WorkflowEventBus, emitWorkflowEvent, subscribeToWorkflowEvent } from './WorkflowEventBus';
export { AutoWorkflowManager } from './AutoWorkflowManager';
export { WorkflowEngine } from './WorkflowEngine';
export { 
  WorkflowSystemInitializer, 
  initializeWorkflowSystem, 
  getWorkflowSystemStatus, 
  forceResetWorkflowSystem, 
  testWorkflowExecution 
} from './WorkflowSystemInitializer';

// Enhanced workflow system exports
export { EnhancedActionExecutors } from './EnhancedActionExecutors';
export { VariableSubstitution } from './VariableSubstitution';
export { WORKFLOW_TEMPLATES } from './WorkflowTemplates';
export { ScheduledWorkflowManager } from './ScheduledWorkflowManager';

// Workflow triggers
export { WorkflowTriggers } from './WorkflowTriggers';

// Development mode utilities
export const isWorkflowDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Explicit enable via localStorage
  if (localStorage.getItem('workflow_dev_mode') === 'true') return true;
  // Explicit disable via localStorage
  if (localStorage.getItem('workflow_dev_mode') === 'false') return false;
  // Default: enabled only in dev environment
  return import.meta.env.DEV;
};

// Debug utilities
export const workflowDebugLog = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).__workflowDevMode) {
    console.log(`🔍 [WORKFLOW-DEBUG] ${message}`, ...args);
  }
};

export const workflowDebugError = (message: string, ...args: any[]) => {
  console.error(`🚨 [WORKFLOW-DEBUG] ${message}`, ...args);
};

export const workflowDebugWarn = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).__workflowDevMode) {
    console.warn(`⚠️ [WORKFLOW-DEBUG] ${message}`, ...args);
  }
};

// Global workflow debugging
if (typeof window !== 'undefined') {
  (window as any).workflowDebug = {
    enableDevMode: () => {
      (window as any).__workflowDevMode = true;
      console.log('🔧 Workflow development mode enabled');
    },
    disableDevMode: () => {
      (window as any).__workflowDevMode = false;
      console.log('🔧 Workflow development mode disabled');
    },
    getStatus: () => {
      const autoManager = AutoWorkflowManager.getInstance();
      const queueStats = AutoWorkflowManager.getQueueStats();
      const queueStatus = AutoWorkflowManager.getQueueStatus();
      const eventBus = WorkflowEventBus.getInstance();
      
      return {
        autoManagerInitialized: !!autoManager,
        queueStats,
        queueStatus,
        totalHandlers: getTotalHandlerCount(),
        registeredEvents: getRegisteredEvents()
      };
    },
    test: async (projectId: string = 'test-project') => {
      console.log('🧪 Testing workflow system...');
      
      // Force re-initialization
      AutoWorkflowManager.initialize();
      
      const status = (window as any).workflowDebug.getStatus();
      console.log('📊 System status:', status);
      
      // Test event emission
      const testData = {
        taskId: 'test-task-' + Date.now(),
        projectId,
        oldStatus: 'todo', 
        newStatus: 'done',
        userId: 'test-user',
        timestamp: new Date().toISOString()
      };
      
      console.log('🎯 Emitting test event:', testData);
      emitWorkflowEvent('task_status_changed', testData);
      
      console.log('✅ Test completed - check console for execution logs');
    },
    forceReset: () => {
      try {
        forceResetWorkflowSystem();
        console.log('🔄 Workflow system reset');
      } catch (error) {
        console.error('❌ Reset failed:', error);
      }
    }
  };
}

// Legacy exports (kept for compatibility)
export { ENHANCED_WORKFLOW_EXAMPLES, demonstrateEnhancedWorkflows } from './EnhancedWorkflowExamples';

// Types
export type { 
  WorkflowTriggerType, 
  TriggerData, 
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionContext 
} from '../types/workflow'; 