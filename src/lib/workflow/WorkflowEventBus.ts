import type { 
  WorkflowTriggerType, 
  TriggerData, 
  WorkflowExecutionContext 
} from '../types/workflow';

// Event handler function type
export type WorkflowEventHandler = (triggerData: TriggerData) => Promise<void>;

// Event registry for type-safe event management
interface EventRegistry {
  [eventType: string]: WorkflowEventHandler[];
}

// Event validation result
interface EventValidationResult {
  isValid: boolean;
  error?: string;
}

// Global instance to survive HMR reloads
declare global {
  var __workflowEventBusInstance: WorkflowEventBus | undefined;
}

/**
 * Central event bus for workflow system
 * Handles all workflow-related events in the application
 */
export class WorkflowEventBus {
  private static instance: WorkflowEventBus;
  private eventRegistry: EventRegistry = {};
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
    this.eventRegistry = {};
    this.isInitialized = false;
    console.log('🏗️ [EVENT-BUS] Constructor called - instance created');
  }

  /**
   * Get singleton instance (HMR-resilient)
   */
  public static getInstance(): WorkflowEventBus {
    // Check global instance first (survives HMR)
    if (globalThis.__workflowEventBusInstance) {
      WorkflowEventBus.instance = globalThis.__workflowEventBusInstance;
      
      // Ensure properties exist and are properly initialized
      if (!WorkflowEventBus.instance.eventRegistry) {
        WorkflowEventBus.instance.eventRegistry = {};
        console.log('🔧 [EVENT-BUS] Re-created event registry');
      }
      if (typeof WorkflowEventBus.instance.isInitialized === 'undefined') {
        WorkflowEventBus.instance.isInitialized = false;
      }
      
      // Ensure it's initialized
      if (!WorkflowEventBus.instance.isInitialized) {
        console.log('🔄 [EVENT-BUS] Re-initializing recovered instance...');
        WorkflowEventBus.instance.initialize();
      }
      return WorkflowEventBus.instance;
    }
    
    if (!WorkflowEventBus.instance) {
      console.log('🆕 [EVENT-BUS] Creating new instance...');
      WorkflowEventBus.instance = new WorkflowEventBus();
      // Store in global to survive HMR
      globalThis.__workflowEventBusInstance = WorkflowEventBus.instance;
      // Auto-initialize
      WorkflowEventBus.instance.initialize();
    }
    return WorkflowEventBus.instance;
  }

  /**
   * Initialize the event bus (should be called once at app startup)
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('WorkflowEventBus already initialized');
      return;
    }

    console.log('🚀 WorkflowEventBus initialized');
    this.isInitialized = true;
  }

  /**
   * Emit a workflow event
   */
  public static async emit(
    eventType: WorkflowTriggerType, 
    eventData: TriggerData
  ): Promise<void> {
    const instance = WorkflowEventBus.getInstance();
    const startTime = Date.now();
    
    console.log(`🚀 [EVENT-BUS] Starting emission of ${eventType}`, {
      projectId: eventData.project_id,
      taskId: (eventData as any).task_id || 'N/A',
      timestamp: new Date().toISOString(),
      initialized: instance.isInitialized
    });
    
    if (!instance.isInitialized) {
      console.warn('🔄 [EVENT-BUS] Not initialized - auto-initializing');
      instance.initialize();
    }

    try {
      // Validate event data
      const validation = instance.validateEvent(eventType, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      console.log(`✅ [EVENT-BUS] Event validation passed for ${eventType}`);

      // Execute all registered handlers for this event type
      const handlers = instance.eventRegistry[eventType] || [];
      
      console.log(`📋 [EVENT-BUS] Found ${handlers.length} registered handlers for ${eventType}`);
      console.log(`📝 [EVENT-BUS] All registered events:`, Object.keys(instance.eventRegistry));
      
      if (handlers.length === 0) {
        console.warn(`⚠️ [EVENT-BUS] No handlers registered for event: ${eventType}`);
        return;
      }

      // Execute handlers in parallel for better performance
      console.log(`⚡ [EVENT-BUS] Executing ${handlers.length} handlers for ${eventType}...`);
      const handlerPromises = handlers.map((handler, index) => 
        handler(eventData).then(() => {
          console.log(`✅ [EVENT-BUS] Handler ${index + 1} completed for ${eventType}`);
        }).catch(error => {
          console.error(`❌ [EVENT-BUS] Handler ${index + 1} failed for ${eventType}:`, error);
          // Don't throw - we want other handlers to continue executing
        })
      );

      await Promise.all(handlerPromises);

      const duration = Date.now() - startTime;
      console.log(`🎉 [EVENT-BUS] Event ${eventType} processed by ${handlers.length} handlers in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 [EVENT-BUS] Error emitting workflow event ${eventType} (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Subscribe to workflow events
   */
  public static subscribe(
    eventType: WorkflowTriggerType, 
    handler: WorkflowEventHandler
  ): () => void {
    const instance = WorkflowEventBus.getInstance();
    
    // Ensure the instance is properly initialized
    if (!instance.isInitialized) {
      console.log(`⚠️ [EVENT-BUS] Event bus not initialized, initializing now...`);
      instance.initialize();
    }
    
    // Ensure event registry exists
    if (!instance.eventRegistry) {
      instance.eventRegistry = {};
      console.log(`🔧 [EVENT-BUS] Re-created event registry`);
    }
    
    console.log(`📝 [EVENT-BUS] Subscribing to ${eventType}...`);
    
    if (!instance.eventRegistry[eventType]) {
      instance.eventRegistry[eventType] = [];
      console.log(`📝 [EVENT-BUS] Created new handler array for ${eventType}`);
    }
    
    instance.eventRegistry[eventType].push(handler);
    
    const totalHandlers = instance.eventRegistry[eventType].length;
    console.log(`✅ [EVENT-BUS] Handler subscribed to ${eventType} (${totalHandlers} total handlers for this event)`);
    console.log(`📊 [EVENT-BUS] Registry status:`, {
      totalEvents: Object.keys(instance.eventRegistry).length,
      totalHandlers: Object.values(instance.eventRegistry).reduce((sum, handlers) => sum + handlers.length, 0),
      eventTypes: Object.keys(instance.eventRegistry)
    });
    
    // Return unsubscribe function
    return () => {
      console.log(`🔄 [EVENT-BUS] Unsubscribing handler from ${eventType}...`);
      instance.unsubscribe(eventType, handler);
    };
  }

  /**
   * Unsubscribe from workflow events
   */
  public static unsubscribe(
    eventType: WorkflowTriggerType, 
    handler: WorkflowEventHandler
  ): void {
    const instance = WorkflowEventBus.getInstance();
    instance.unsubscribe(eventType, handler);
  }

  /**
   * Private unsubscribe implementation
   */
  private unsubscribe(
    eventType: WorkflowTriggerType, 
    handler: WorkflowEventHandler
  ): void {
    if (!this.eventRegistry[eventType]) {
      return;
    }

    const handlerIndex = this.eventRegistry[eventType].indexOf(handler);
    if (handlerIndex > -1) {
      this.eventRegistry[eventType].splice(handlerIndex, 1);
      console.log(`📝 Handler unsubscribed from ${eventType} (${this.eventRegistry[eventType].length} remaining)`);
    }
  }

  /**
   * Get the number of handlers for a specific event type
   */
  public getHandlerCount(eventType: WorkflowTriggerType): number {
    const handlers = this.eventRegistry[eventType] || [];
    return handlers.length;
  }

  /**
   * Get all registered event types
   */
  public getRegisteredEvents(): WorkflowTriggerType[] {
    return Object.keys(this.eventRegistry) as WorkflowTriggerType[];
  }

  /**
   * Get total number of handlers across all events
   */
  public getTotalHandlerCount(): number {
    let total = 0;
    for (const handlers of Object.values(this.eventRegistry)) {
      total += handlers.length;
    }
    return total;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  public static clearAllHandlers(): void {
    const instance = WorkflowEventBus.getInstance();
    instance.eventRegistry = {};
    console.log('🧹 All workflow event handlers cleared');
  }

  /**
   * Emergency direct handler registration (bypasses normal subscription)
   */
  public forceRegisterHandler(eventType: WorkflowTriggerType, handler: WorkflowEventHandler): void {
    if (!this.eventRegistry) {
      this.eventRegistry = {};
    }
    if (!this.eventRegistry[eventType]) {
      this.eventRegistry[eventType] = [];
    }
    this.eventRegistry[eventType].push(handler);
    console.log(`🔧 [EVENT-BUS] Emergency handler directly registered for ${eventType}. Total handlers: ${this.eventRegistry[eventType].length}`);
  }

  /**
   * Validate event data structure
   */
  private validateEvent(
    eventType: WorkflowTriggerType, 
    eventData: TriggerData
  ): EventValidationResult {
    // Basic validation - check required fields
    if (!eventData) {
      return { isValid: false, error: 'Event data is required' };
    }

    if (!eventData.project_id) {
      return { isValid: false, error: 'project_id is required in event data' };
    }

    // Type-specific validation
    switch (eventType) {
      case 'task_status_changed':
        if (!(eventData as any).task_id) {
          return { isValid: false, error: 'task_id is required for task_status_changed events' };
        }
        break;

      case 'task_created':
        if (!(eventData as any).task_id) {
          return { isValid: false, error: 'task_id is required for task_created events' };
        }
        break;

      case 'task_assigned':
        if (!(eventData as any).task_id) {
          return { isValid: false, error: 'task_id is required for task_assigned events' };
        }
        break;

      case 'file_uploaded':
        if (!(eventData as any).file_id) {
          return { isValid: false, error: 'file_id is required for file_uploaded events' };
        }
        break;

      case 'custom_field_changed':
        if (!(eventData as any).entity_id) {
          return { isValid: false, error: 'entity_id is required for custom_field_changed events' };
        }
        break;

      // Add more validations as needed
    }

    return { isValid: true };
  }

  /**
   * Health check - verify event bus is working
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const instance = WorkflowEventBus.getInstance();
      
      if (!instance.isInitialized) {
        console.error('WorkflowEventBus health check failed: not initialized');
        return false;
      }

      // Test event emission (with a dummy handler)
      let testHandlerCalled = false;
      const testHandler = async () => {
        testHandlerCalled = true;
      };

      const unsubscribe = this.subscribe('task_created', testHandler);
      
      // Emit test event
      await this.emit('task_created', {
        type: 'task_created',
        task_id: 'test-task-id',
        project_id: 'test-project-id',
        user_id: 'test-user-id',
        timestamp: new Date().toISOString()
      });

      unsubscribe();

      if (!testHandlerCalled) {
        console.error('WorkflowEventBus health check failed: test handler not called');
        return false;
      }

      console.log('✅ WorkflowEventBus health check passed');
      return true;

    } catch (error) {
      console.error('WorkflowEventBus health check failed:', error);
      return false;
    }
  }
}

// Export static methods and instance methods
export const {
  getInstance,
  subscribe: subscribeToWorkflowEvent,
  emit: emitWorkflowEvent,
  unsubscribe,
  clearAllHandlers,
  healthCheck: workflowEventBusHealthCheck
} = WorkflowEventBus;

// Export instance methods through static wrappers
export const getHandlerCount = (eventType: WorkflowTriggerType): number => {
  return WorkflowEventBus.getInstance().getHandlerCount(eventType);
};

export const getRegisteredEvents = (): WorkflowTriggerType[] => {
  return WorkflowEventBus.getInstance().getRegisteredEvents();
};

export const getTotalHandlerCount = (): number => {
  return WorkflowEventBus.getInstance().getTotalHandlerCount();
}; 