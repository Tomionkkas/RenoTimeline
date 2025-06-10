import { WorkflowEventBus, type WorkflowEventHandler } from './WorkflowEventBus';
import { WorkflowEngine } from './WorkflowEngine';
import type { 
  WorkflowTriggerType, 
  TriggerData, 
  WorkflowExecution 
} from '../types/workflow';

// Workflow queue item
interface WorkflowQueueItem {
  id: string;
  workflowId: string;
  triggerData: TriggerData;
  priority: 'high' | 'normal' | 'low';
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

// Workflow execution result
interface ExecutionResult {
  success: boolean;
  execution?: WorkflowExecution;
  error?: string;
}

// Queue statistics
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageExecutionTime: number;
}

/**
 * Automatic workflow manager - handles background workflow processing
 * Connects the event bus to the workflow engine
 */
// Global instance to survive HMR reloads
declare global {
  var __autoWorkflowManagerInstance: AutoWorkflowManager | undefined;
}

export class AutoWorkflowManager {
  private static instance: AutoWorkflowManager;
  private isInitialized = false;
  private isProcessing = false;
  private executionQueue: WorkflowQueueItem[] = [];
  private processingQueue: Set<string> = new Set();
  private eventHandlers: Map<WorkflowTriggerType, WorkflowEventHandler> = new Map();
  private unsubscribeFunctions: Map<WorkflowTriggerType, () => void> = new Map();
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
    averageExecutionTime: 0
  };

  private constructor() {
    // Private constructor for singleton
    // Initialize all properties explicitly
    this.isInitialized = false;
    this.isProcessing = false;
    this.executionQueue = [];
    this.processingQueue = new Set();
    this.eventHandlers = new Map();
    this.unsubscribeFunctions = new Map();
    this.stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalProcessed: 0,
      averageExecutionTime: 0
    };
    
    console.log('🏗️ [AUTO-MANAGER] Constructor called - instance created');
  }

  /**
   * Get singleton instance (HMR-resilient with auto-initialization)
   */
  public static getInstance(): AutoWorkflowManager {
    // Check global instance first (survives HMR)
    if (globalThis.__autoWorkflowManagerInstance) {
      AutoWorkflowManager.instance = globalThis.__autoWorkflowManagerInstance;
      
      // Ensure properties exist and are properly initialized
      if (typeof AutoWorkflowManager.instance.isInitialized === 'undefined') {
        AutoWorkflowManager.instance.isInitialized = false;
      }
      if (typeof AutoWorkflowManager.instance.isProcessing === 'undefined') {
        AutoWorkflowManager.instance.isProcessing = false;
      }
      if (!AutoWorkflowManager.instance.eventHandlers) {
        AutoWorkflowManager.instance.eventHandlers = new Map();
      }
      if (!AutoWorkflowManager.instance.unsubscribeFunctions) {
        AutoWorkflowManager.instance.unsubscribeFunctions = new Map();
      }
      if (!AutoWorkflowManager.instance.executionQueue) {
        AutoWorkflowManager.instance.executionQueue = [];
      }
      if (!AutoWorkflowManager.instance.processingQueue) {
        AutoWorkflowManager.instance.processingQueue = new Set();
      }
      if (!AutoWorkflowManager.instance.stats) {
        AutoWorkflowManager.instance.stats = {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          totalProcessed: 0,
          averageExecutionTime: 0
        };
      }
      
      // Re-initialize if needed
      if (!AutoWorkflowManager.instance.isInitialized) {
        console.log('🔄 [AUTO-MANAGER] Re-initializing recovered instance...');
        AutoWorkflowManager.instance.initializeInternal();
      }
      
      return AutoWorkflowManager.instance;
    }
    
    if (!AutoWorkflowManager.instance) {
      console.log('🆕 [AUTO-MANAGER] Creating new instance...');
      AutoWorkflowManager.instance = new AutoWorkflowManager();
      // Store in global to survive HMR
      globalThis.__autoWorkflowManagerInstance = AutoWorkflowManager.instance;
      
      // AUTO-INITIALIZE immediately
      AutoWorkflowManager.instance.initializeInternal();
    }
    
    return AutoWorkflowManager.instance;
  }

  /**
   * Initialize the workflow manager
   */
  public static initialize(): void {
    const instance = AutoWorkflowManager.getInstance();
    instance.initializeInternal();
  }

  /**
   * Internal initialization
   */
  private initializeInternal(): void {
    console.log('🚀 [AUTO-MANAGER] Starting internal initialization...');
    
    if (this.isInitialized) {
      console.log('⚠️ [AUTO-MANAGER] Already initialized, skipping');
      return;
    }
    
    // Safety check - ensure all properties exist
    if (!this.eventHandlers) {
      this.eventHandlers = new Map();
      console.log('🔧 [AUTO-MANAGER] Re-created eventHandlers Map');
    }
    if (!this.unsubscribeFunctions) {
      this.unsubscribeFunctions = new Map();
      console.log('🔧 [AUTO-MANAGER] Re-created unsubscribeFunctions Map');
    }

    // Initialize stats if not already done
    if (!this.stats) {
      this.stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0,
        averageExecutionTime: 0
      };
      console.log('📊 [AUTO-MANAGER] Stats initialized');
    }

    console.log('🔧 [AUTO-MANAGER] Setting up event handlers...');
    // Setup event handlers for all workflow trigger types
    this.setupEventHandlers();

    console.log('⚡ [AUTO-MANAGER] Starting queue processor...');
    // Start queue processing
    this.startQueueProcessor();

    this.isInitialized = true;
    console.log('✅ [AUTO-MANAGER] Internal initialization completed successfully');
  }

  /**
   * Setup event handlers for all workflow triggers
   */
  private setupEventHandlers(): void {
    console.log('🔧 [AUTO-MANAGER] Setting up event handlers...');
    
    // EMERGENCY FIX: Clear existing handlers first
    this.unsubscribeFunctions.forEach((unsubscribe, eventType) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(`⚠️ [AUTO-MANAGER] Failed to unsubscribe from ${eventType}:`, error);
      }
    });
    this.unsubscribeFunctions.clear();
    
    // Define all possible trigger types
    const triggerTypes: WorkflowTriggerType[] = [
      'task_status_changed',
      'task_created',
      'task_assigned',
      'due_date_approaching',
      'custom_field_changed',
      'file_uploaded',
      'comment_added',
      'project_status_changed',
      'team_member_added'
    ];

    // EMERGENCY FIX: Force direct registration
    console.log('🚨 [AUTO-MANAGER] FORCE REGISTERING HANDLERS - NO RETRY NEEDED');
    
    const masterHandler: WorkflowEventHandler = async (triggerData: TriggerData) => {
      try {
        console.log(`🎯 [AUTO-MANAGER] Master handler received event:`, triggerData);
        
        // Determine trigger type from event data
        const triggerType = 'task_status_changed'; // For now, focus on the main trigger
        
        console.log(`🎯 [AUTO-MANAGER] Processing ${triggerType} event:`, triggerData);
        await this.handleWorkflowEvent(triggerType, triggerData);
        console.log(`✅ [AUTO-MANAGER] Event ${triggerType} processed successfully`);
      } catch (error) {
        console.error(`❌ [AUTO-MANAGER] Master handler error:`, error);
      }
    };

    // Register the master handler for task_status_changed MULTIPLE TIMES to ensure it sticks
    console.log('🔄 [AUTO-MANAGER] Registering master handler for task_status_changed...');
    
    // Try 3 times to ensure registration
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📝 [AUTO-MANAGER] Registration attempt ${attempt}/3 for task_status_changed`);
        
        const unsubscribe = WorkflowEventBus.subscribe('task_status_changed', masterHandler);
        this.unsubscribeFunctions.set('task_status_changed', unsubscribe);
        
        // Immediately verify
        const eventBusInstance = WorkflowEventBus.getInstance();
        const handlerCount = eventBusInstance.getHandlerCount('task_status_changed');
        console.log(`✅ [AUTO-MANAGER] Attempt ${attempt}: Registered handler for task_status_changed - Verified: ${handlerCount} handlers`);
        
        if (handlerCount > 0) {
          console.log(`🎉 [AUTO-MANAGER] SUCCESS on attempt ${attempt}! Handler registered successfully`);
          break;
        } else {
          console.warn(`⚠️ [AUTO-MANAGER] Attempt ${attempt} failed - handler count still 0`);
        }
      } catch (error) {
        console.error(`❌ [AUTO-MANAGER] Registration attempt ${attempt} failed:`, error);
      }
    }

    // Register other event types normally
    triggerTypes.filter(type => type !== 'task_status_changed').forEach(triggerType => {
      try {
        console.log(`📝 [AUTO-MANAGER] Registering handler for ${triggerType}...`);
        
        const handler: WorkflowEventHandler = async (triggerData: TriggerData) => {
          console.log(`🎯 [AUTO-MANAGER] Received ${triggerType} event:`, triggerData);
          await this.handleWorkflowEvent(triggerType, triggerData);
        };

        const unsubscribe = WorkflowEventBus.subscribe(triggerType, handler);
        this.unsubscribeFunctions.set(triggerType, unsubscribe);
        
        console.log(`✅ [AUTO-MANAGER] Handler registered for ${triggerType}`);
      } catch (error) {
        console.error(`❌ [AUTO-MANAGER] Failed to register handler for ${triggerType}:`, error);
      }
    });

    console.log(`🎉 [AUTO-MANAGER] Event handler setup completed. Total handlers: ${this.unsubscribeFunctions.size}`);
    
    // FINAL VERIFICATION
    setTimeout(() => {
      const eventBusInstance = WorkflowEventBus.getInstance();
      const registeredEvents = eventBusInstance.getRegisteredEvents();
      const totalHandlers = eventBusInstance.getTotalHandlerCount();
      const taskHandlers = eventBusInstance.getHandlerCount('task_status_changed');
      
      console.log(`🔍 [AUTO-MANAGER] FINAL VERIFICATION:`);
      console.log(`  - Event types: ${registeredEvents.length}`);
      console.log(`  - Total handlers: ${totalHandlers}`);
      console.log(`  - task_status_changed handlers: ${taskHandlers}`);
      console.log(`  - Registered events:`, registeredEvents);
      
      if (taskHandlers === 0) {
        console.error('❌ [AUTO-MANAGER] CRITICAL: task_status_changed handler still not registered!');
        this.emergencyRegisterTaskHandler();
      } else {
        console.log('✅ [AUTO-MANAGER] SUCCESS: task_status_changed handler is properly registered!');
      }
    }, 1000);

    // Load workflows from database
    this.loadWorkflowsFromSupabase().catch(error => {
      console.error('❌ [AUTO-MANAGER] Failed to load workflows from database:', error);
    });
  }

  /**
   * Emergency handler registration (last resort)
   */
  private emergencyRegisterTaskHandler(): void {
    console.log('🚨 [AUTO-MANAGER] EMERGENCY: Registering task handler as last resort...');
    
    const emergencyHandler: WorkflowEventHandler = async (triggerData: TriggerData) => {
      console.log(`🎯 [AUTO-MANAGER] EMERGENCY handler received task_status_changed event:`, triggerData);
      await this.handleWorkflowEvent('task_status_changed', triggerData);
    };

    // Use the new emergency registration method
    const eventBusInstance = WorkflowEventBus.getInstance();
    eventBusInstance.forceRegisterHandler('task_status_changed', emergencyHandler);
    
    console.log(`🔧 [AUTO-MANAGER] Emergency handler registration completed`);
  }

  /**
   * Load workflows from Supabase database
   */
  private async loadWorkflowsFromSupabase(): Promise<void> {
    try {
      console.log('📥 [AUTO-MANAGER] Loading workflows from Supabase...');
      
      // Import supabase client
      const { supabase } = await import('../../integrations/supabase/client');
      
      const { data: workflows, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ [AUTO-MANAGER] Database error loading workflows:', error);
        return;
      }

      if (!workflows || workflows.length === 0) {
        console.log('📝 [AUTO-MANAGER] No active workflows found in database');
        return;
      }

      console.log(`✅ [AUTO-MANAGER] Loaded ${workflows.length} active workflows:`, workflows.map(w => w.name));
      
      // Log trigger types for debugging
      const triggerTypes = workflows.map(w => w.trigger_type);
      console.log('🎯 [AUTO-MANAGER] Workflow trigger types:', triggerTypes);
      
    } catch (error) {
      console.error('❌ [AUTO-MANAGER] Error loading workflows:', error);
    }
  }

  /**
   * Handle incoming workflow event
   */
  private async handleWorkflowEvent(
    triggerType: WorkflowTriggerType,
    triggerData: TriggerData
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // Event received - detailed logging available in dev mode

      // Find matching workflows and queue them for execution
      await this.queueMatchingWorkflows(triggerType, triggerData);

      const duration = Date.now() - startTime;
      // Event handling completed successfully

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [AUTO-MANAGER] Error handling workflow event ${triggerType} (${duration}ms):`, error);
    }
  }

  /**
   * Find and queue matching workflows for execution
   */
  private async queueMatchingWorkflows(
    triggerType: WorkflowTriggerType,
    triggerData: TriggerData
  ): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`🔍 [AUTO-MANAGER] Searching for workflows...`, {
        triggerType,
        projectId: triggerData.project_id,
        timestamp: new Date().toISOString()
      });
      
      // Import supabase directly to avoid type issues
      const { supabase } = await import('../../integrations/supabase/client');
      
      // Query the database directly with any type to avoid schema issues
      const { data: workflows, error } = await supabase
        .from('workflow_definitions' as any)
        .select('*')
        .eq('project_id', triggerData.project_id)
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [AUTO-MANAGER] Error fetching workflows:', error);
        return;
      }

      const workflowCount = (workflows as any)?.length || 0;
      console.log(`📊 [AUTO-MANAGER] Database query results:`, {
        triggerType,
        projectId: triggerData.project_id,
        workflowsFound: workflowCount,
        workflows: (workflows as any)?.map((w: any) => ({ id: w.id, name: w.name, is_active: w.is_active })) || []
      });

      if (workflowCount === 0) {
        console.log(`ℹ️ [AUTO-MANAGER] No active workflows found for ${triggerType} in project ${triggerData.project_id}`);
        return;
      }

      for (const workflow of (workflows as any) || []) {
        console.log(`📬 [AUTO-MANAGER] Queuing workflow: ${workflow.name} (${workflow.id})`);
        // Add to execution queue - WorkflowEngine will handle condition checking
        this.addToQueueInternal(workflow.id, triggerData, 'normal');
        console.log(`✅ [AUTO-MANAGER] Workflow queued: ${workflow.name} (${workflow.id})`);
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 [AUTO-MANAGER] Successfully queued ${workflowCount} workflows in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 [AUTO-MANAGER] Error queuing workflows (${duration}ms):`, error);
    }
  }

  /**
   * Add workflow to execution queue
   */
  public static addToQueue(
    workflowId: string,
    triggerData: TriggerData,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): void {
    const instance = AutoWorkflowManager.getInstance();
    instance.addToQueueInternal(workflowId, triggerData, priority);
  }

  /**
   * Internal add to queue implementation
   */
  private addToQueueInternal(
    workflowId: string,
    triggerData: TriggerData,
    priority: 'high' | 'normal' | 'low'
  ): void {
    const queueItem: WorkflowQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      triggerData,
      priority,
      scheduledFor: new Date(),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    // Insert based on priority
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.executionQueue.findIndex(item => 
      priorityOrder[item.priority] > priorityOrder[priority]
    );

    if (insertIndex === -1) {
      this.executionQueue.push(queueItem);
    } else {
      this.executionQueue.splice(insertIndex, 0, queueItem);
    }

    this.stats.pending = this.executionQueue.length;
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Starting workflow queue processor...');

    // Process queue every 2 seconds
    setInterval(async () => {
      await this.processQueueInternal();
    }, 2000);
  }

  /**
   * Process items in the execution queue
   */
  public static async processQueue(): Promise<void> {
    const instance = AutoWorkflowManager.getInstance();
    await instance.processQueueInternal();
  }

  /**
   * Internal queue processing
   */
  private async processQueueInternal(): Promise<void> {
    if (this.executionQueue.length === 0) {
      return;
    }

    // Process up to 3 workflows concurrently
    const maxConcurrent = 3;
    const currentProcessing = this.processingQueue.size;
    const availableSlots = maxConcurrent - currentProcessing;

    if (availableSlots <= 0) {
      return;
    }

    // Get next items to process
    const itemsToProcess = this.executionQueue
      .filter(item => !this.processingQueue.has(item.id))
      .slice(0, availableSlots);

    for (const item of itemsToProcess) {
      this.processWorkflowItem(item);
    }
  }

  /**
   * Process a single workflow item
   */
  private async processWorkflowItem(item: WorkflowQueueItem): Promise<void> {
    const startTime = Date.now();
    this.processingQueue.add(item.id);
    this.stats.processing = this.processingQueue.size;

    try {
      console.log(`⚡ Executing workflow: ${item.workflowId} (attempt ${item.attempts + 1})`);

      // Execute the workflow
      const execution = await WorkflowEngine.executeWorkflow(item.workflowId, item.triggerData);

      // Handle successful execution
      this.handleExecutionSuccess(item, execution, startTime);

    } catch (error) {
      // Handle execution failure
      await this.handleExecutionFailure(item, error, startTime);
    }
  }

  /**
   * Handle successful workflow execution
   */
  private handleExecutionSuccess(
    item: WorkflowQueueItem,
    execution: WorkflowExecution,
    startTime: number
  ): void {
    const executionTime = Date.now() - startTime;

    // Remove from queue and processing set
    this.removeFromQueue(item.id);
    this.processingQueue.delete(item.id);

    // Update stats
    this.stats.completed++;
    this.stats.totalProcessed++;
    this.stats.processing = this.processingQueue.size;
    this.stats.pending = this.executionQueue.length;
    this.updateAverageExecutionTime(executionTime);

    console.log(`✅ Workflow completed: ${item.workflowId} (${executionTime}ms)`);
  }

  /**
   * Handle failed workflow execution
   */
  private async handleExecutionFailure(
    item: WorkflowQueueItem,
    error: any,
    startTime: number
  ): Promise<void> {
    const executionTime = Date.now() - startTime;
    item.attempts++;

    this.processingQueue.delete(item.id);
    this.stats.processing = this.processingQueue.size;

    console.error(`❌ Workflow execution failed: ${item.workflowId} (attempt ${item.attempts})`, error);

    if (item.attempts >= item.maxAttempts) {
      // Max attempts reached - move to failed
      this.removeFromQueue(item.id);
      this.stats.failed++;
      this.stats.totalProcessed++;
      this.stats.pending = this.executionQueue.length;
      
      console.error(`💀 Workflow permanently failed: ${item.workflowId} (max attempts reached)`);
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, item.attempts) * 1000; // 2s, 4s, 8s...
      item.scheduledFor = new Date(Date.now() + delay);
      
      console.log(`🔄 Workflow retry scheduled: ${item.workflowId} (in ${delay}ms)`);
    }

    this.updateAverageExecutionTime(executionTime);
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(itemId: string): void {
    const index = this.executionQueue.findIndex(item => item.id === itemId);
    if (index > -1) {
      this.executionQueue.splice(index, 1);
    }
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(executionTime: number): void {
    const total = this.stats.totalProcessed;
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (total - 1) + executionTime) / total;
  }

  /**
   * Get queue statistics
   */
  public static getQueueStats(): QueueStats {
    const instance = AutoWorkflowManager.getInstance();
    if (!instance.isInitialized) {
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0,
        averageExecutionTime: 0
      };
    }
    return { ...instance.stats };
  }

  /**
   * Schedule workflow execution with delay
   */
  public static scheduleExecution(
    workflowId: string,
    triggerData: TriggerData,
    delay: number = 0
  ): void {
    const instance = AutoWorkflowManager.getInstance();
    
    const queueItem: WorkflowQueueItem = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      triggerData,
      priority: 'normal',
      scheduledFor: new Date(Date.now() + delay),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    instance.executionQueue.push(queueItem);
    instance.stats.pending = instance.executionQueue.length;
    
    console.log(`📅 Workflow scheduled: ${workflowId} (in ${delay}ms)`);
  }

  /**
   * Get queue status for debugging
   */
  public static getQueueStatus(): {
    queueLength: number;
    processing: number;
    nextExecution?: Date;
  } {
    const instance = AutoWorkflowManager.getInstance();
    
    if (!instance.isInitialized) {
      return {
        queueLength: 0,
        processing: 0,
        nextExecution: undefined
      };
    }
    
    const nextItem = instance.executionQueue
      .filter(item => !instance.processingQueue.has(item.id))
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0];

    return {
      queueLength: instance.executionQueue.length,
      processing: instance.processingQueue.size,
      nextExecution: nextItem?.scheduledFor
    };
  }

  /**
   * Cleanup - shutdown the manager
   */
  public static shutdown(): void {
    const instance = AutoWorkflowManager.getInstance();
    
    // Unsubscribe from all events using stored unsubscribe functions
    instance.unsubscribeFunctions.forEach((unsubscribe, triggerType) => {
      try {
        unsubscribe();
        console.log(`🔄 [AUTO-MANAGER] Unsubscribed from ${triggerType}`);
      } catch (error) {
        console.error(`❌ [AUTO-MANAGER] Error unsubscribing from ${triggerType}:`, error);
      }
    });

    instance.eventHandlers.clear();
    instance.unsubscribeFunctions.clear();
    instance.isInitialized = false;
    instance.isProcessing = false;
    
    console.log('🛑 AutoWorkflowManager shutdown complete');
  }
} 