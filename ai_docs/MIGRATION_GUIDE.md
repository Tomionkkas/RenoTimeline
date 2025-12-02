# Migration Guide: From Old Database to New Clean Architecture

## Overview

This guide provides step-by-step instructions for migrating from the current problematic database to the new clean architecture. The migration process is designed to be safe, reversible, and minimize downtime.

## Pre-Migration Checklist

### 1. Backup Current Data
- [ ] Create full database backup
- [ ] Export user accounts from `auth.users`
- [ ] Export saved properties from `public.properties`
- [ ] Export user watchlists from `public.user_watchlists`
- [ ] Export any other critical data
- [ ] Document current data structure

### 2. Prepare New Environment
- [ ] Create new Supabase project
- [ ] Set up environment variables
- [ ] Configure project settings
- [ ] Test basic connectivity

### 3. Plan Migration Window
- [ ] Schedule migration during low-usage period
- [ ] Notify team members
- [ ] Prepare rollback plan
- [ ] Set up monitoring

## Migration Process

### Phase 1: New Project Setup

#### Step 1.1: Create New Supabase Project
```bash
# 1. Go to Supabase Dashboard
# 2. Click "New Project"
# 3. Choose organization
# 4. Enter project details:
#    - Name: "renoscout-clean"
#    - Database Password: [generate secure password]
#    - Region: [choose closest region]
# 5. Click "Create new project"
```

#### Step 1.2: Configure Project Settings
```bash
# 1. Go to Settings > API
# 2. Copy new project URL and anon key
# 3. Update environment variables:
#    VITE_SUPABASE_URL=https://[new-project-id].supabase.co
#    VITE_SUPABASE_ANON_KEY=[new-anon-key]
# 4. Go to Settings > Database
# 5. Configure connection pooling if needed
```

#### Step 1.3: Test Basic Connectivity
```bash
# Test connection with simple query
curl -X GET "https://[new-project-id].supabase.co/rest/v1/" \
  -H "apikey: [new-anon-key]" \
  -H "Authorization: Bearer [new-anon-key]"
```

### Phase 2: Schema Creation

#### Step 2.1: Create Schemas
```sql
-- Connect to new database and run:

-- Create schemas
CREATE SCHEMA shared_schema;
CREATE SCHEMA renoscout_schema;
CREATE SCHEMA calcreno_schema;
CREATE SCHEMA renotimeline_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA shared_schema TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA renoscout_schema TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA calcreno_schema TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA renotimeline_schema TO anon, authenticated, service_role;
```

#### Step 2.2: Configure PostgREST
```bash
# 1. Go to Settings > API in Supabase Dashboard
# 2. Under "Data API Settings", add to "Exposed schemas":
#    - shared_schema
#    - renoscout_schema
#    - calcreno_schema
#    - renotimeline_schema
# 3. Click "Save"
# 4. Wait 2-3 minutes for changes to take effect
```

#### Step 2.3: Create Tables
```sql
-- Run the complete schema creation script from NEW_DATABASE_SCHEMA_DESIGN.md
-- This includes all tables, indexes, RLS policies, and triggers

-- Verify schemas are accessible
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('shared_schema', 'renoscout_schema', 'calcreno_schema', 'renotimeline_schema')
ORDER BY schemaname, tablename;
```

### Phase 3: Data Migration

#### Step 3.1: Export Data from Old Project
```sql
-- Connect to old database and export data

-- Export user accounts (if not using Supabase Auth)
COPY (
  SELECT id, email, encrypted_password, email_confirmed_at, created_at, updated_at
  FROM auth.users
  WHERE email IS NOT NULL
) TO '/tmp/users_export.csv' WITH CSV HEADER;

-- Export profiles
COPY (
  SELECT id, email, full_name, avatar_url, phone, preferences, expertise, created_at, updated_at
  FROM public.profiles
  WHERE id IS NOT NULL
) TO '/tmp/profiles_export.csv' WITH CSV HEADER;

-- Export properties
COPY (
  SELECT id, title, description, price, location, images, source_url, source_platform, 
         created_at, last_updated, is_active, metadata
  FROM public.properties
  WHERE is_active = true
) TO '/tmp/properties_export.csv' WITH CSV HEADER;

-- Export user watchlists
COPY (
  SELECT user_id, property_id, notes, priority, created_at, updated_at, is_active
  FROM public.user_watchlists
  WHERE is_active = true
) TO '/tmp/watchlists_export.csv' WITH CSV HEADER;
```

#### Step 3.2: Import Data to New Project
```sql
-- Connect to new database and import data

-- Import user accounts (if not using Supabase Auth)
\copy auth.users(id, email, encrypted_password, email_confirmed_at, created_at, updated_at) 
FROM '/tmp/users_export.csv' WITH CSV HEADER;

-- Import profiles
\copy shared_schema.profiles(id, email, full_name, avatar_url, phone, preferences, expertise, created_at, updated_at)
FROM '/tmp/profiles_export.csv' WITH CSV HEADER;

-- Import properties
\copy renoscout_schema.properties(id, title, description, price, address, images, listing_url, source_platform, created_at, last_updated, is_active, metadata)
FROM '/tmp/properties_export.csv' WITH CSV HEADER;

-- Import user watchlists
\copy renoscout_schema.user_watchlists(user_id, property_id, notes, priority, created_at, updated_at, is_active)
FROM '/tmp/watchlists_export.csv' WITH CSV HEADER;
```

#### Step 3.3: Verify Data Integrity
```sql
-- Check data counts
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'shared_schema.profiles', COUNT(*) FROM shared_schema.profiles
UNION ALL
SELECT 'renoscout_schema.properties', COUNT(*) FROM renoscout_schema.properties
UNION ALL
SELECT 'renoscout_schema.user_watchlists', COUNT(*) FROM renoscout_schema.user_watchlists;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_watchlists
FROM renoscout_schema.user_watchlists w
LEFT JOIN auth.users u ON w.user_id = u.id
LEFT JOIN renoscout_schema.properties p ON w.property_id = p.id
WHERE u.id IS NULL OR p.id IS NULL;
```

### Phase 4: Application Code Update

#### Step 4.1: Update Environment Variables
```bash
# Update .env.local file
VITE_SUPABASE_URL=https://[new-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[new-anon-key]
```

#### Step 4.2: Update Supabase Client Configuration
```typescript
// Update src/lib/supabase-client.ts
export const supabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'renoscout_schema' // Now using proper schema
  }
});

// Update other client configurations
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
```

#### Step 4.3: Update Data Access Functions
```typescript
// Update src/lib/data/user-data-service.ts
export async function getUserProperties(userId: string): Promise<Property[]> {
  try {
    // Now using proper schema
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

    // ... rest of function
  } catch (error) {
    console.error('Error getting user properties:', error);
    return [];
  }
}
```

#### Step 4.4: Update Authentication Service
```typescript
// Update src/lib/auth/auth-service.ts
export async function createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  try {
    const { error } = await sharedSupabase
      .from('profiles')
      .insert({
        id: userId,
        ...profile
      });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
}
```

### Phase 5: Testing and Validation

#### Step 5.1: Test Authentication
```bash
# Test user registration
curl -X POST "https://[new-project-id].supabase.co/auth/v1/signup" \
  -H "apikey: [new-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Test user login
curl -X POST "https://[new-project-id].supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: [new-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

#### Step 5.2: Test Data Access
```bash
# Test property retrieval
curl -X GET "https://[new-project-id].supabase.co/rest/v1/properties?select=*&is_active=eq.true" \
  -H "apikey: [new-anon-key]" \
  -H "Authorization: Bearer [new-anon-key]"

# Test user watchlists
curl -X GET "https://[new-project-id].supabase.co/rest/v1/user_watchlists?select=*&user_id=eq.[user-id]" \
  -H "apikey: [new-anon-key]" \
  -H "Authorization: Bearer [new-anon-key]"
```

#### Step 5.3: Test Application Functionality
```bash
# 1. Start development server
npm run dev

# 2. Test user registration/login
# 3. Test property saving/viewing
# 4. Test all core functionality
# 5. Verify data persistence
# 6. Check error handling
```

### Phase 6: Performance Optimization

#### Step 6.1: Verify Indexes
```sql
-- Check if indexes were created properly
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname IN ('shared_schema', 'renoscout_schema', 'calcreno_schema', 'renotimeline_schema')
ORDER BY schemaname, tablename, indexname;
```

#### Step 6.2: Test Query Performance
```sql
-- Test performance of common queries
EXPLAIN ANALYZE
SELECT p.*, ma.estimated_value, ma.roi_potential
FROM renoscout_schema.properties p
LEFT JOIN renoscout_schema.market_analysis ma ON p.id = ma.property_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 20;
```

#### Step 6.3: Monitor Resource Usage
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname IN ('shared_schema', 'renoscout_schema', 'calcreno_schema', 'renotimeline_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Phase 7: Security Validation

#### Step 7.1: Verify RLS Policies
```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname IN ('shared_schema', 'renoscout_schema', 'calcreno_schema', 'renotimeline_schema')
ORDER BY schemaname, tablename;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname IN ('shared_schema', 'renoscout_schema', 'calcreno_schema', 'renotimeline_schema')
ORDER BY schemaname, tablename, policyname;
```

#### Step 7.2: Test Security Policies
```bash
# Test that users can only access their own data
# Test that anonymous users have appropriate access
# Test that RLS policies are working correctly
```

### Phase 8: Final Validation

#### Step 8.1: Comprehensive Testing
- [ ] Test all user flows
- [ ] Test data persistence
- [ ] Test error handling
- [ ] Test performance under load
- [ ] Test security policies
- [ ] Test cross-app functionality

#### Step 8.2: Documentation Update
- [ ] Update API documentation
- [ ] Update development guidelines
- [ ] Update deployment scripts
- [ ] Create troubleshooting guide

#### Step 8.3: Team Handover
- [ ] Document migration process
- [ ] Create maintenance procedures
- [ ] Train team on new architecture
- [ ] Set up monitoring and alerts

## Rollback Plan

### If Migration Fails
1. **Immediate Rollback**
   ```bash
   # Revert environment variables to old project
   VITE_SUPABASE_URL=https://[old-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[old-anon-key]
   ```

2. **Data Recovery**
   ```sql
   # If data was lost, restore from backup
   # Import data back to old project if needed
   ```

3. **Application Rollback**
   ```bash
   # Revert code changes
   git checkout HEAD~1
   # Or restore from backup
   ```

### If Issues Are Discovered Later
1. **Identify the Problem**
   - Check logs and error messages
   - Verify data integrity
   - Test specific functionality

2. **Fix the Issue**
   - Apply database fixes if needed
   - Update application code
   - Test thoroughly

3. **Monitor Closely**
   - Watch for new issues
   - Monitor performance
   - Check user feedback

## Post-Migration Checklist

### Immediate (Day 1)
- [ ] Verify all functionality works
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Test user flows
- [ ] Verify data integrity

### Short-term (Week 1)
- [ ] Monitor application performance
- [ ] Check for any data inconsistencies
- [ ] Verify security policies
- [ ] Test edge cases
- [ ] Gather user feedback

### Long-term (Month 1)
- [ ] Archive old project
- [ ] Update documentation
- [ ] Optimize performance
- [ ] Plan future improvements
- [ ] Set up monitoring

## Troubleshooting

### Common Issues

#### PostgREST Schema Access Issues
```bash
# Error: "The schema must be one of the following: public, graphql_public"
# Solution: Wait 5-10 minutes after adding schemas to dashboard
# Or restart the application
```

#### RLS Policy Issues
```sql
-- Error: "new row violates row-level security policy"
-- Solution: Check RLS policies and user permissions
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

#### Data Migration Issues
```sql
-- Error: "duplicate key value violates unique constraint"
-- Solution: Check for duplicate data before migration
SELECT column_name, COUNT(*) 
FROM your_table 
GROUP BY column_name 
HAVING COUNT(*) > 1;
```

#### Performance Issues
```sql
-- Slow queries after migration
-- Solution: Check if indexes were created properly
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'your_table';
```

## Success Metrics

### Technical Metrics
- [ ] Zero security issues in Supabase dashboard
- [ ] All schemas accessible via PostgREST
- [ ] RLS policies working correctly
- [ ] Performance meets or exceeds previous levels
- [ ] No data loss or corruption

### Business Metrics
- [ ] All user functionality working
- [ ] No user complaints about data loss
- [ ] Improved system reliability
- [ ] Better scalability for future growth
- [ ] Easier maintenance and debugging

## Notes

- Always test in a staging environment first
- Keep the old project as backup for at least 1 month
- Monitor closely during the first week after migration
- Have a rollback plan ready
- Document any issues and solutions for future reference
- Train the team on the new architecture
- Set up proper monitoring and alerting

This migration guide ensures a safe and successful transition to the new clean architecture while minimizing risk and downtime.
