import { useMemo, useCallback, useRef } from 'react';
import { useCustomFieldDefinitions, type CustomFieldDefinition } from './useCustomFieldDefinitions';
import { useCustomFieldValues } from './useCustomFieldValues';
import { useCustomFieldValidation } from './useCustomFieldValidation';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// Global cache instance
const globalCache = new PerformanceCache();

interface UseCustomFieldsPerformanceOptions {
  projectId: string;
  entityType: 'task' | 'project';
  entityId?: string;
  enableCaching?: boolean;
  cacheTime?: number;
  enableBatching?: boolean;
  batchDelay?: number;
}

export const useCustomFieldsPerformance = ({
  projectId,
  entityType,
  entityId,
  enableCaching = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  enableBatching = true,
  batchDelay = 500
}: UseCustomFieldsPerformanceOptions) => {
  const batchQueue = useRef<Map<string, any>>(new Map());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cached definitions
  const definitionsCacheKey = `definitions_${projectId}_${entityType}`;
  const { definitions: rawDefinitions, loading: definitionsLoading, ...definitionMethods } = useCustomFieldDefinitions(projectId, entityType);

  const definitions = useMemo(() => {
    if (!enableCaching) return rawDefinitions;

    const cached = globalCache.get<CustomFieldDefinition[]>(definitionsCacheKey);
    if (cached && !definitionsLoading) {
      return cached;
    }

    if (rawDefinitions.length > 0) {
      globalCache.set(definitionsCacheKey, rawDefinitions, cacheTime);
    }

    return rawDefinitions;
  }, [rawDefinitions, definitionsLoading, enableCaching, definitionsCacheKey, cacheTime]);

  // Cached values
  const valuesCacheKey = `values_${entityType}_${entityId}`;
  const { values: rawValues, loading: valuesLoading, ...valueMethods } = useCustomFieldValues(entityType, entityId);

  const values = useMemo(() => {
    if (!enableCaching || !entityId) return rawValues;

    const cached = globalCache.get<Record<string, any>>(valuesCacheKey);
    if (cached && !valuesLoading) {
      return cached;
    }

    if (Object.keys(rawValues).length > 0) {
      globalCache.set(valuesCacheKey, rawValues, cacheTime);
    }

    return rawValues;
  }, [rawValues, valuesLoading, enableCaching, valuesCacheKey, cacheTime, entityId]);

  // Validation with memoization
  const { validateAllFields, validateFieldValue } = useCustomFieldValidation();

  const memoizedValidateAll = useCallback((
    fieldDefinitions: CustomFieldDefinition[],
    fieldValues: Record<string, any>
  ) => {
    const validationKey = `validation_${JSON.stringify(fieldDefinitions.map(d => d.id))}_${JSON.stringify(fieldValues)}`;
    
    if (enableCaching) {
      const cached = globalCache.get(validationKey);
      if (cached) return cached;
    }

    const result = validateAllFields(fieldDefinitions, fieldValues);
    
    if (enableCaching) {
      globalCache.set(validationKey, result, 30000); // 30 seconds for validation
    }
    
    return result;
  }, [validateAllFields, enableCaching]);

  // Batched save operations
  const batchedSave = useCallback(async (fieldId: string, value: any) => {
    if (!enableBatching) {
      return valueMethods.saveFieldValue(fieldId, value);
    }

    batchQueue.current.set(fieldId, value);

    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }

    return new Promise<boolean>((resolve, reject) => {
      batchTimeout.current = setTimeout(async () => {
        try {
          const batchData = Object.fromEntries(batchQueue.current);
          const success = await valueMethods.saveAllFieldValues(batchData);
          
          if (success && enableCaching) {
            // Update cache
            globalCache.set(valuesCacheKey, { ...values, ...batchData }, cacheTime);
          }
          
          batchQueue.current.clear();
          resolve(success);
        } catch (error) {
          reject(error);
        }
      }, batchDelay);
    });
  }, [enableBatching, valueMethods, batchDelay, enableCaching, valuesCacheKey, values, cacheTime]);

  // Optimized field grouping
  const groupedFields = useMemo(() => {
    const groups: Record<string, CustomFieldDefinition[]> = {
      required: [],
      optional: [],
      system: []
    };

    definitions.forEach(definition => {
      if (definition.is_required) {
        groups.required.push(definition);
      } else if (definition.field_type === 'text' || definition.field_type === 'textarea') {
        groups.system.push(definition);
      } else {
        groups.optional.push(definition);
      }
    });

    return groups;
  }, [definitions]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      cache: globalCache.getStats(),
      definitions: {
        count: definitions.length,
        required: definitions.filter(d => d.is_required).length,
        optional: definitions.filter(d => !d.is_required).length
      },
      values: {
        count: Object.keys(values).length,
        cacheHit: enableCaching && globalCache.get(valuesCacheKey) !== null
      },
      batching: {
        enabled: enableBatching,
        queueSize: batchQueue.current.size,
        pendingTimeout: batchTimeout.current !== null
      }
    };
  }, [definitions, values, enableCaching, valuesCacheKey, enableBatching]);

  // Cache management
  const invalidateCache = useCallback((pattern?: string) => {
    globalCache.invalidate(pattern);
  }, []);

  const clearCache = useCallback(() => {
    globalCache.invalidate();
  }, []);

  // Preload related data
  const preloadRelatedFields = useCallback(async (relatedEntityIds: string[]) => {
    const promises = relatedEntityIds.map(async (id) => {
      const cacheKey = `values_${entityType}_${id}`;
      if (!globalCache.get(cacheKey)) {
        // This would need to be implemented with a custom fetch method
        // For now, we'll just mark it as a placeholder
        console.log(`Preloading data for entity ${id}`);
      }
    });

    await Promise.all(promises);
  }, [entityType]);

  return {
    // Data
    definitions,
    values,
    groupedFields,
    
    // Loading states
    loading: definitionsLoading || valuesLoading,
    definitionsLoading,
    valuesLoading,
    
    // Core methods
    ...definitionMethods,
    saveFieldValue: batchedSave,
    saveAllFieldValues: valueMethods.saveAllFieldValues,
    deleteFieldValue: valueMethods.deleteFieldValue,
    
    // Validation
    validateAllFields: memoizedValidateAll,
    validateFieldValue,
    
    // Performance utilities
    getPerformanceMetrics,
    invalidateCache,
    clearCache,
    preloadRelatedFields,
    
    // Advanced features
    batchOperations: {
      queue: batchQueue.current,
      flush: async () => {
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
          const batchData = Object.fromEntries(batchQueue.current);
          await valueMethods.saveAllFieldValues(batchData);
          batchQueue.current.clear();
        }
      }
    }
  };
};

// Utility function for bulk operations
export const useBulkCustomFieldOperations = (projectId: string, entityType: 'task' | 'project') => {
  const { definitions, createDefinition, updateDefinition, deleteDefinition } = useCustomFieldDefinitions(projectId, entityType);

  const bulkCreateFields = useCallback(async (fieldsData: any[]) => {
    const results = [];
    for (const fieldData of fieldsData) {
      try {
        const result = await createDefinition(fieldData);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }, [createDefinition]);

  const bulkUpdateFields = useCallback(async (updates: { id: string; data: any }[]) => {
    const results = [];
    for (const { id, data } of updates) {
      try {
        await updateDefinition(id, data);
        results.push({ success: true, id });
      } catch (error) {
        results.push({ success: false, id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }, [updateDefinition]);

  const bulkDeleteFields = useCallback(async (fieldIds: string[]) => {
    const results = [];
    for (const id of fieldIds) {
      try {
        await deleteDefinition(id);
        results.push({ success: true, id });
      } catch (error) {
        results.push({ success: false, id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }, [deleteDefinition]);

  return {
    definitions,
    bulkCreateFields,
    bulkUpdateFields,
    bulkDeleteFields
  };
}; 