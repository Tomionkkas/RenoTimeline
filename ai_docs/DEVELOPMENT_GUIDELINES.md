# Development Guidelines: New Database Architecture

## Overview

This document provides development guidelines and best practices for working with the new clean database architecture. It covers coding standards, database interactions, security practices, and team workflows.

## Architecture Principles

### 1. Schema Separation
- **Clear Boundaries**: Each app has its own schema
- **Shared Data**: Cross-app data goes in `shared_schema`
- **Authentication**: Use built-in `auth` schema
- **No Cross-Contamination**: Don't mix app data between schemas

### 2. Security First
- **RLS Everywhere**: All tables must have RLS enabled
- **Principle of Least Privilege**: Users only access their own data
- **Input Validation**: Validate all user inputs
- **Audit Logging**: Log all important actions

### 3. Performance Optimization
- **Proper Indexing**: Create indexes for common queries
- **Efficient Queries**: Use appropriate WHERE clauses and LIMITs
- **Connection Pooling**: Use connection pooling for production
- **Caching**: Cache frequently accessed data

### 4. Data Integrity
- **Foreign Key Constraints**: Maintain referential integrity
- **Data Validation**: Validate data at database level
- **Consistent Naming**: Use consistent naming conventions
- **Type Safety**: Use appropriate data types

## Database Schema Guidelines

### Schema Naming Conventions
```sql
-- Use descriptive schema names
shared_schema          -- Cross-app data
renoscout_schema       -- RenoScout app data
calcreno_schema        -- CalcrReno app data
renotimeline_schema    -- RenoTimeline app data
```

### Table Naming Conventions
```sql
-- Use snake_case for table names
properties             -- Not Properties or properties
user_watchlists        -- Not userWatchlists or UserWatchlists
ai_property_analysis   -- Not aiPropertyAnalysis
```

### Column Naming Conventions
```sql
-- Use snake_case for column names
user_id                -- Not userId or userID
created_at             -- Not createdAt or created_at
is_active              -- Not isActive or is_active
```

### Data Types
```sql
-- Use appropriate data types
UUID                   -- For primary keys and foreign keys
TEXT                   -- For variable-length strings
NUMERIC                -- For decimal numbers (prices, areas)
BOOLEAN                -- For true/false values
TIMESTAMP WITH TIME ZONE -- For dates and times
JSONB                  -- For flexible data structures
TEXT[]                 -- For arrays of strings
```

## Application Code Guidelines

### Supabase Client Configuration

#### Multiple Client Instances
```typescript
// src/lib/supabase-client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Main client for RenoScout schema
export const supabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'renoscout_schema'
  }
});

// Client for shared schema
export const sharedSupabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'shared_schema'
  }
});

// Client for public schema (legacy)
export const publicSupabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  }
});
```

#### Dynamic Client Selection
```typescript
// Helper function for dynamic client selection
export function getSupabaseClient(schema: string): SupabaseClient {
  switch (schema) {
    case 'shared_schema':
      return sharedSupabase;
    case 'renoscout_schema':
      return supabase;
    case 'public':
      return publicSupabase;
    default:
      return supabase; // Default to RenoScout schema
  }
}
```

### Data Access Patterns

#### TypeScript Interfaces
```typescript
// Define interfaces for all data structures
export interface Property {
  id: string;
  title: string;
  description?: string;
  price?: number;
  location?: string;
  images?: string[];
  url?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  preferences?: Record<string, any>;
  expertise?: string[];
  created_at?: string;
  updated_at?: string;
}
```

#### Data Access Functions
```typescript
// Use consistent patterns for data access
export async function getUserProperties(userId: string): Promise<Property[]> {
  try {
    const { data: watchlists, error: watchlistError } = await supabase
      .from('user_watchlists')
      .select(`
        *,
        properties (
          id,
          title,
          description,
          price,
          address,
          city,
          images,
          listing_url,
          source_platform,
          created_at,
          last_updated,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (watchlistError) {
      console.error('Error fetching user watchlists:', watchlistError);
      return [];
    }

    // Map database fields to application interface
    const properties = watchlists
      ?.map(watchlist => {
        const property = watchlist.properties;
        if (!property) return null;
        
        return {
          id: property.id,
          title: property.title,
          description: property.description,
          price: property.price,
          location: property.address, // Map address to location
          images: property.images,
          url: property.listing_url, // Map listing_url to url
          source: property.source_platform, // Map source_platform to source
          created_at: property.created_at,
          updated_at: property.last_updated, // Map last_updated to updated_at
          is_active: property.is_active
        } as Property;
      })
      .filter(Boolean) as Property[] || [];

    return properties;
  } catch (error) {
    console.error('Error getting user properties:', error);
    return [];
  }
}
```

#### Error Handling
```typescript
// Always handle errors properly
export async function saveProperty(property: Property, userId?: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error('User ID is required to save property');
      return false;
    }

    const { error } = await supabase
      .from('user_watchlists')
      .insert({
        user_id: userId,
        property_id: property.id,
        notes: property.description,
        priority: 5,
        is_active: true
      });

    if (error) {
      console.error('Error saving property to user watchlist:', error);
      return false;
    }

    // Log the action for audit
    await authService.logAuditEvent(userId, 'renoscout', 'property_saved', 'property', property.id, {
      source: property.source
    });

    return true;
  } catch (error) {
    console.error('Error saving property:', error);
    return false;
  }
}
```

### Authentication Patterns

#### User Context Management
```typescript
// Use React context for user state
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  appPreferences: AppPreferences | null;
  loading: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, profile: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updateAppPreferences: (updates: Partial<AppPreferences>) => Promise<boolean>;
}

// Auth hook
export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    appPreferences: null,
    loading: true
  });

  useEffect(() => {
    // Load user data when authenticated
    if (state.user && !state.profile) {
      loadUserProfile(state.user.id);
      loadAppPreferences(state.user.id);
    }
  }, [state.user]);

  // ... implementation
}
```

#### Cross-App Authentication
```typescript
// Handle cross-app user data
export async function ensureUserProfile(userId: string): Promise<boolean> {
  try {
    // Check if profile exists
    const { data: existingProfile } = await sharedSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return true; // Profile already exists
    }

    // Get user data from auth
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not found in auth');
      return false;
    }

    // Create profile
    const { error } = await sharedSupabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.user.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return false;
  }
}
```

## Security Guidelines

### Row Level Security (RLS)

#### Policy Patterns
```sql
-- Users can only access their own data
CREATE POLICY "Users can manage own data" ON your_schema.your_table
    FOR ALL USING (auth.uid() = user_id);

-- Users can view all active records but only manage their own
CREATE POLICY "Anyone can view active records" ON your_schema.your_table
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own records" ON your_schema.your_table
    FOR ALL USING (auth.uid() = user_id);

-- Public read access for certain data
CREATE POLICY "Public read access" ON your_schema.your_table
    FOR SELECT USING (true);
```

#### Testing RLS Policies
```typescript
// Test RLS policies in development
export async function testRLSPolicies() {
  // Test as anonymous user
  const { data: anonData, error: anonError } = await supabase
    .from('properties')
    .select('*')
    .limit(1);

  console.log('Anonymous access:', anonData, anonError);

  // Test as authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: authData, error: authError } = await supabase
      .from('user_watchlists')
      .select('*')
      .eq('user_id', user.id);

    console.log('Authenticated access:', authData, authError);
  }
}
```

### Input Validation

#### Client-Side Validation
```typescript
// Validate user inputs
export function validateProperty(property: Partial<Property>): string[] {
  const errors: string[] = [];

  if (!property.title || property.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (property.title && property.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (property.price && property.price < 0) {
    errors.push('Price must be positive');
  }

  if (property.price && property.price > 1000000000) {
    errors.push('Price is too high');
  }

  return errors;
}
```

#### Server-Side Validation
```sql
-- Database-level validation
ALTER TABLE renoscout_schema.properties 
ADD CONSTRAINT check_title_length 
CHECK (char_length(title) <= 200);

ALTER TABLE renoscout_schema.properties 
ADD CONSTRAINT check_price_positive 
CHECK (price > 0);

ALTER TABLE renoscout_schema.properties 
ADD CONSTRAINT check_price_reasonable 
CHECK (price <= 1000000000);
```

### Audit Logging

#### Logging Patterns
```typescript
// Log all important actions
export async function logAuditEvent(
  userId: string,
  appName: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await sharedSupabase
      .from('audit_log')
      .insert({
        user_id: userId,
        app_name: appName,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: 'client_ip', // Get from request context
        user_agent: 'user_agent' // Get from request context
      });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't fail the main operation if logging fails
  }
}
```

## Performance Guidelines

### Query Optimization

#### Efficient Queries
```typescript
// Use appropriate WHERE clauses and LIMITs
export async function getRecentProperties(limit: number = 20): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent properties:', error);
    return [];
  }

  return data || [];
}

// Use joins for related data
export async function getPropertiesWithAnalysis(propertyIds: string[]): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      ai_property_analysis (
        analysis_type,
        analysis_data,
        confidence_score
      )
    `)
    .in('id', propertyIds)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching properties with analysis:', error);
    return [];
  }

  return data || [];
}
```

#### Index Usage
```sql
-- Create indexes for common query patterns
CREATE INDEX idx_properties_active_created 
ON renoscout_schema.properties(is_active, created_at DESC);

CREATE INDEX idx_watchlists_user_active 
ON renoscout_schema.user_watchlists(user_id, is_active);

CREATE INDEX idx_analysis_property_type 
ON renoscout_schema.ai_property_analysis(property_id, analysis_type);
```

### Caching Strategies

#### Client-Side Caching
```typescript
// Use React Query for client-side caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserProperties(userId: string) {
  return useQuery({
    queryKey: ['user-properties', userId],
    queryFn: () => getUserProperties(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSaveProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (property: Property) => saveProperty(property),
    onSuccess: () => {
      // Invalidate and refetch user properties
      queryClient.invalidateQueries({ queryKey: ['user-properties'] });
    },
  });
}
```

#### Database Caching
```sql
-- Use materialized views for expensive queries
CREATE MATERIALIZED VIEW renoscout_schema.property_summary AS
SELECT 
    p.id,
    p.title,
    p.price,
    p.city,
    COUNT(w.id) as watchlist_count,
    AVG(ma.estimated_value) as avg_estimated_value
FROM renoscout_schema.properties p
LEFT JOIN renoscout_schema.user_watchlists w ON p.id = w.property_id
LEFT JOIN renoscout_schema.market_analysis ma ON p.id = ma.property_id
WHERE p.is_active = true
GROUP BY p.id, p.title, p.price, p.city;

-- Refresh materialized view periodically
REFRESH MATERIALIZED VIEW renoscout_schema.property_summary;
```

## Testing Guidelines

### Unit Testing

#### Database Function Testing
```typescript
// Test data access functions
describe('getUserProperties', () => {
  it('should return user properties', async () => {
    const mockUser = { id: 'test-user-id' };
    const mockProperties = [
      { id: 'prop-1', title: 'Test Property' }
    ];

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({
        data: mockProperties,
        error: null
      })
    };

    const result = await getUserProperties(mockUser.id);
    expect(result).toEqual(mockProperties);
  });

  it('should handle errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    };

    const result = await getUserProperties('test-user-id');
    expect(result).toEqual([]);
  });
});
```

#### RLS Policy Testing
```typescript
// Test RLS policies
describe('RLS Policies', () => {
  it('should allow users to access their own data', async () => {
    const user = await createTestUser();
    const property = await createTestProperty(user.id);

    const { data, error } = await supabase
      .from('user_watchlists')
      .select('*')
      .eq('user_id', user.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].property_id).toBe(property.id);
  });

  it('should prevent users from accessing other users data', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const property = await createTestProperty(user1.id);

    const { data, error } = await supabase
      .from('user_watchlists')
      .select('*')
      .eq('user_id', user1.id);

    expect(data).toHaveLength(0); // Should not see other user's data
  });
});
```

### Integration Testing

#### End-to-End Testing
```typescript
// Test complete user flows
describe('Property Management Flow', () => {
  it('should allow users to save and view properties', async () => {
    // 1. User logs in
    const user = await loginUser('test@example.com', 'password');

    // 2. User searches for properties
    const properties = await searchProperties('Warsaw');

    // 3. User saves a property
    const saved = await saveProperty(properties[0], user.id);
    expect(saved).toBe(true);

    // 4. User views saved properties
    const savedProperties = await getUserProperties(user.id);
    expect(savedProperties).toHaveLength(1);
    expect(savedProperties[0].id).toBe(properties[0].id);
  });
});
```

## Deployment Guidelines

### Environment Configuration

#### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env.production
VITE_SUPABASE_URL=https://your-production-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

#### Schema Configuration
```typescript
// src/lib/config/schema-config.ts
export const schemaConfig = {
  shared: 'shared_schema',
  renoscout: 'renoscout_schema',
  calcreno: 'calcreno_schema',
  renotimeline: 'renotimeline_schema',
  public: 'public'
} as const;

export type SchemaName = keyof typeof schemaConfig;
```

### Migration Scripts

#### Database Migration
```typescript
// scripts/migrate-to-new-schema.ts
import { supabase, sharedSupabase } from '../src/lib/supabase-client';

export async function migrateToNewSchema() {
  try {
    // 1. Create schemas
    await createSchemas();
    
    // 2. Create tables
    await createTables();
    
    // 3. Migrate data
    await migrateData();
    
    // 4. Update application
    await updateApplication();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
```

#### Rollback Script
```typescript
// scripts/rollback-migration.ts
export async function rollbackMigration() {
  try {
    // 1. Revert application changes
    await revertApplication();
    
    // 2. Restore old data
    await restoreOldData();
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
```

## Team Workflow Guidelines

### Code Review Checklist

#### Database Changes
- [ ] RLS policies are properly configured
- [ ] Indexes are created for performance
- [ ] Foreign key constraints are maintained
- [ ] Data validation is implemented
- [ ] Migration scripts are tested

#### Application Changes
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Security is maintained
- [ ] Performance is considered
- [ ] Tests are written

### Documentation Requirements

#### Code Documentation
```typescript
/**
 * Get properties saved by authenticated user
 * @param userId - The user's unique identifier
 * @returns Promise<Property[]> - Array of saved properties
 * @throws Error if database connection fails
 */
export async function getUserProperties(userId: string): Promise<Property[]> {
  // Implementation
}
```

#### Schema Documentation
```sql
-- Table: renoscout_schema.properties
-- Purpose: Store property listings for analysis
-- Access: Public read, authenticated users can manage their own
-- RLS: Enabled with user-specific policies

CREATE TABLE renoscout_schema.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,                    -- Property title
    description TEXT,                       -- Property description
    price NUMERIC,                          -- Property price in PLN
    -- ... other columns
);
```

### Monitoring and Alerting

#### Performance Monitoring
```typescript
// Monitor query performance
export async function monitorQueryPerformance() {
  const startTime = Date.now();
  
  try {
    const result = await getUserProperties('user-id');
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      console.warn(`Slow query detected: getUserProperties took ${duration}ms`);
      // Send alert to monitoring system
    }
    
    return result;
  } catch (error) {
    console.error('Query failed:', error);
    // Send error alert
    throw error;
  }
}
```

#### Error Monitoring
```typescript
// Centralized error handling
export function handleError(error: Error, context: string) {
  console.error(`Error in ${context}:`, error);
  
  // Send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
  }
}
```

## Best Practices Summary

### Do's
- ✅ Use TypeScript for type safety
- ✅ Implement proper error handling
- ✅ Enable RLS on all tables
- ✅ Create indexes for performance
- ✅ Validate user inputs
- ✅ Log important actions
- ✅ Write tests for critical functions
- ✅ Document code and schemas
- ✅ Monitor performance and errors

### Don'ts
- ❌ Don't disable RLS for convenience
- ❌ Don't use `any` type in TypeScript
- ❌ Don't ignore error handling
- ❌ Don't create tables without indexes
- ❌ Don't trust user input
- ❌ Don't skip testing
- ❌ Don't forget to document changes
- ❌ Don't ignore performance issues

### Performance Checklist
- [ ] Queries use appropriate WHERE clauses
- [ ] Indexes exist for common query patterns
- [ ] Large queries use LIMIT
- [ ] Joins are optimized
- [ ] Caching is implemented where appropriate
- [ ] Connection pooling is configured

### Security Checklist
- [ ] RLS is enabled on all tables
- [ ] Policies are properly configured
- [ ] User inputs are validated
- [ ] Sensitive data is encrypted
- [ ] Audit logging is implemented
- [ ] Error messages don't leak sensitive information

This development guide ensures consistent, secure, and performant code across the RenoScout ecosystem.
