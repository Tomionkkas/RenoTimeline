import { AutoWorkflowManager } from './AutoWorkflowManager';
import { 
  WorkflowEventBus, 
  emitWorkflowEvent,
  getHandlerCount,
  getRegisteredEvents,
  getTotalHandlerCount
} from './WorkflowEventBus';
import { supabase } from '../../integrations/supabase/client';

/**
 * Workflow System Initializer
 * Centralizes the initialization of the entire real-time workflow system
 */
export class WorkflowSystemInitializer {
  private static isInitialized = false;

  /**
   * Initialize the complete workflow system
   * Should be called once at application startup
   */
  public static async initialize(): Promise<void> {
    console.log('🔄 [WORKFLOW-INIT] Starting workflow system initialization...');
    
    if (this.isInitialized) {
      console.warn('⚠️ [WORKFLOW-INIT] Workflow system already initialized');
      return;
    }

    try {
      console.log('🚀 [WORKFLOW-INIT] Initializing Real-time Workflow System...');

      // Step 1: Initialize Event Bus
      console.log('📡 [WORKFLOW-INIT] Step 1: Initializing Event Bus...');
      const eventBus = WorkflowEventBus.getInstance();
      eventBus.initialize();
      console.log('✅ [WORKFLOW-INIT] Event Bus initialized');

      // Step 2: Initialize Auto Workflow Manager
      console.log('🤖 [WORKFLOW-INIT] Step 2: Initializing Auto Workflow Manager...');
      
      // Force get instance to ensure it's created and initialized
      const autoManager = AutoWorkflowManager.getInstance();
      console.log('🔍 [WORKFLOW-INIT] AutoManager instance:', autoManager);
      
      // Explicitly call initialize to be sure
      AutoWorkflowManager.initialize();
      console.log('✅ [WORKFLOW-INIT] Auto Workflow Manager initialized');
      
      // Verify handlers were registered
      const registeredEvents = WorkflowEventBus.getRegisteredEvents();
      console.log('🔍 [WORKFLOW-INIT] Registered events after AutoManager init:', registeredEvents);
      
      if (registeredEvents.length === 0) {
        console.error('❌ [WORKFLOW-INIT] No events registered! AutoManager failed to initialize properly');
        throw new Error('AutoWorkflowManager failed to register event handlers');
      } else {
        console.log(`✅ [WORKFLOW-INIT] Successfully registered ${registeredEvents.length} event types`);
      }

      // Step 3: Run health checks
      console.log('🏥 [WORKFLOW-INIT] Step 3: Running health checks...');
      const eventBusHealthy = await WorkflowEventBus.healthCheck();
      if (!eventBusHealthy) {
        throw new Error('Event Bus health check failed');
      }
      console.log('✅ [WORKFLOW-INIT] Health checks passed');

      this.isInitialized = true;
      
      const finalStatus = {
        eventBus: 'healthy',
        autoManager: 'running',
        registeredEvents: WorkflowEventBus.getRegisteredEvents(),
        queueStatus: AutoWorkflowManager.getQueueStatus()
      };
      
      console.log('🎉 [WORKFLOW-INIT] Real-time Workflow System initialized successfully!');
      console.log('📊 [WORKFLOW-INIT] Final System Status:', finalStatus);

      // Expose system status globally for debugging
      if (typeof window !== 'undefined') {
        (window as any).__workflowSystemStatus = finalStatus;
        (window as any).initializeWorkflowSystem = WorkflowSystemInitializer.initialize;
        (window as any).forceResetWorkflowSystem = WorkflowSystemInitializer.forceReset;
        console.log('🔧 [WORKFLOW-INIT] Debug functions exposed to window.workflowDebug');
      }

    } catch (error) {
      console.error('💥 [WORKFLOW-INIT] Failed to initialize workflow system:', error);
      throw error;
    }
  }

  /**
   * Check if the workflow system is initialized
   */
  public static isWorkflowSystemInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get system status for debugging
   */
  public static getSystemStatus() {
    try {
      return {
        initialized: this.isInitialized,
        eventBusRegistered: WorkflowEventBus.getRegisteredEvents(),
        queueStats: AutoWorkflowManager.getQueueStats(),
        queueStatus: AutoWorkflowManager.getQueueStatus()
      };
    } catch (error) {
      console.error('🚨 [WORKFLOW-INIT] Error getting system status:', error);
      return {
        initialized: false,
        error: 'Failed to get system status',
        eventBusRegistered: [],
        queueStats: { pending: 0, processing: 0, completed: 0, failed: 0, totalProcessed: 0, averageExecutionTime: 0 },
        queueStatus: { queueLength: 0, processing: 0 }
      };
    }
  }

  /**
   * Shutdown the workflow system
   */
  public static shutdown(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Shutting down workflow system...');
    
    AutoWorkflowManager.shutdown();
    WorkflowEventBus.clearAllHandlers();
    
    this.isInitialized = false;
    console.log('✅ Workflow system shutdown complete');
  }

  /**
   * Force complete reset and re-initialization
   * Use this when the system gets into a bad state
   */
  public static async forceReset(): Promise<void> {
    console.log('🔄 [WORKFLOW-INIT] Force resetting workflow system...');
    
    try {
      // Clear all global instances
      if (typeof window !== 'undefined') {
        (window as any).__autoWorkflowManagerInstance = undefined;
        (window as any).__workflowEventBusInstance = undefined;
        (window as any).__workflowSystemStatus = undefined;
      }
      
      // Reset static instances
      (AutoWorkflowManager as any).instance = undefined;
      (WorkflowEventBus as any).instance = undefined;
      
      // Reset initialization flag
      this.isInitialized = false;
      
      console.log('🧹 [WORKFLOW-INIT] Cleared all instances');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-initialize
      await this.initialize();
      
      console.log('✅ [WORKFLOW-INIT] Force reset completed successfully');
    } catch (error) {
      console.error('❌ [WORKFLOW-INIT] Force reset failed:', error);
      throw error;
    }
  }

  /**
   * Test workflow execution functionality
   */
  public static async testWorkflowExecution(projectId?: string): Promise<void> {
    console.log('🧪 [WORKFLOW-TEST] Starting workflow execution test...');
    
    try {
      // Check system status first
      const status = this.getSystemStatus();
      console.log('📊 [WORKFLOW-TEST] System status:', status);
      
      if (!status.initialized) {
        console.log('🔧 [WORKFLOW-TEST] System not initialized, initializing now...');
        await this.initialize();
      }

      // Force re-initialization of AutoWorkflowManager
      console.log('🔄 [WORKFLOW-TEST] Forcing AutoWorkflowManager re-initialization...');
      AutoWorkflowManager.initialize();
      
      // Get handler counts directly from the workflow bus
      const totalHandlers = getTotalHandlerCount();
      const registeredEvents = getRegisteredEvents();
      
      console.log('📊 [WORKFLOW-TEST] Handler status:', {
        totalHandlers,
        registeredEvents,
        handlerCounts: registeredEvents.map(event => ({
          event,
          count: getHandlerCount(event)
        }))
      });

      // Test manual event emission
      const testEventData = {
        taskId: 'test-task-id',
        projectId: projectId || 'test-project-id',
        oldStatus: 'todo',
        newStatus: 'done',
        userId: 'test-user-id',
        timestamp: new Date().toISOString()
      };

      console.log('🎯 [WORKFLOW-TEST] Emitting test event:', testEventData);
      WorkflowEventBus.emit('task_status_changed', testEventData);
      
      console.log('✅ [WORKFLOW-TEST] Test completed successfully!');
      
    } catch (error) {
      console.error('❌ [WORKFLOW-TEST] Test failed:', error);
      throw error;
    }
  }
}

// Export convenience function for easier usage
export const initializeWorkflowSystem = WorkflowSystemInitializer.initialize;
export const getWorkflowSystemStatus = WorkflowSystemInitializer.getSystemStatus;
export const forceResetWorkflowSystem = WorkflowSystemInitializer.forceReset;
export const testWorkflowExecution = WorkflowSystemInitializer.testWorkflowExecution; 