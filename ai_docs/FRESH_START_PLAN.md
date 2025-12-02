# Fresh Start Plan: Rebuilding RenoScout Database Architecture

## Overview

This document outlines the complete strategy for rebuilding the RenoScout ecosystem database from scratch with proper architecture, security, and performance from day one.

## Why Fresh Start?

### Current Problems (198 Issues)
- **41 Security Issues**: Tables without RLS, exposed sensitive data
- **157 Performance Issues**: Slow queries, inefficient indexes
- **Schema Chaos**: 40+ tables in public schema, mixed app data
- **PostgREST Issues**: Custom schemas not accessible
- **Technical Debt**: Overwhelming complexity and maintenance burden

### Benefits of Fresh Start
- ✅ **Zero Technical Debt**: Clean slate, no legacy issues
- ✅ **Proper Security**: RLS from day one, no exposed data
- ✅ **Optimized Performance**: Proper indexes, efficient queries
- ✅ **Clean Architecture**: Separate schemas, clear boundaries
- ✅ **Maintainable**: Easy to debug, understand, and extend
- ✅ **Scalable**: Built for growth from the start

## New Architecture Design

### Schema Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Single Supabase Project                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   auth (built-in)│  │ shared_schema  │  │ renoscout_schema│  │
│  │                 │  │                 │  │                 │  │
│  │ • users         │  │ • profiles      │  │ • properties    │  │
│  │ • sessions      │  │ • app_preferences│  │ • ai_analysis   │  │
│  │ • refresh_tokens│  │ • user_roles    │  │ • market_data   │  │
│  │ • identities    │  │ • audit_log     │  │ • watchlists    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │ calcreno_schema │  │renotimeline_schema│                     │
│  │                 │  │                 │                     │
│  │ • projects      │  │ • projects      │                     │
│  │ • rooms         │  │ • tasks         │                     │
│  │ • elements      │  │ • workflows     │                     │
│  │ • calculations  │  │ • timelines     │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Cross-App Integration
- **Authentication**: All apps use built-in `auth` schema
- **Shared Data**: Cross-app user data in `shared_schema`
- **Data Export**: `calcreno_schema` → `renotimeline_schema` (one-way)
- **User Context**: Seamless user experience across schemas

## Implementation Phases

### Phase 1: Project Setup & Planning (Day 1)
**Goal**: Establish foundation and planning

#### 1.1 Create New Supabase Project
- [ ] Create new Supabase project
- [ ] Configure project settings
- [ ] Set up environment variables
- [ ] Test basic connectivity

#### 1.2 Design Database Schema
- [ ] Design `shared_schema` tables
- [ ] Design `renoscout_schema` tables
- [ ] Design `calcreno_schema` tables
- [ ] Design `renotimeline_schema` tables
- [ ] Plan RLS policies for each table
- [ ] Plan indexes for performance

#### 1.3 Export Essential Data
- [ ] Export user accounts from current project
- [ ] Export saved properties data
- [ ] Export any other critical data
- [ ] Document data structure for import

### Phase 2: Schema Creation & Configuration (Day 2)
**Goal**: Create clean, secure schemas

#### 2.1 Create Schemas
- [ ] Create `shared_schema`
- [ ] Create `renoscout_schema`
- [ ] Create `calcreno_schema`
- [ ] Create `renotimeline_schema`

#### 2.2 Configure PostgREST
- [ ] Add schemas to "Exposed schemas" in dashboard
- [ ] Grant proper permissions
- [ ] Test schema accessibility
- [ ] Verify PostgREST configuration

#### 2.3 Create Tables with RLS
- [ ] Create all tables with proper structure
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for security
- [ ] Test security policies

### Phase 3: Data Migration & Testing (Day 3)
**Goal**: Migrate data and verify functionality

#### 3.1 Import Data
- [ ] Import user accounts to `auth.users`
- [ ] Import user profiles to `shared_schema.profiles`
- [ ] Import properties to `renoscout_schema.properties`
- [ ] Import watchlists to `renoscout_schema.user_watchlists`
- [ ] Verify data integrity

#### 3.2 Update Application Code
- [ ] Update Supabase client configuration
- [ ] Update all data access functions
- [ ] Update authentication flows
- [ ] Test all functionality

#### 3.3 Performance Optimization
- [ ] Add proper indexes
- [ ] Optimize queries
- [ ] Test performance
- [ ] Monitor resource usage

### Phase 4: Validation & Cleanup (Day 4)
**Goal**: Ensure everything works perfectly

#### 4.1 Comprehensive Testing
- [ ] Test user authentication
- [ ] Test property saving/viewing
- [ ] Test cross-app data access
- [ ] Test security policies
- [ ] Performance testing

#### 4.2 Documentation
- [ ] Document new architecture
- [ ] Document migration process
- [ ] Create troubleshooting guide
- [ ] Update development guidelines

#### 4.3 Cleanup
- [ ] Archive old project
- [ ] Update environment variables
- [ ] Update deployment scripts
- [ ] Team handover documentation

## Risk Mitigation

### High-Risk Scenarios
1. **Data Loss During Migration**
   - Mitigation: Multiple backups, test migrations
2. **PostgREST Configuration Issues**
   - Mitigation: Test configuration before migration
3. **Application Compatibility Issues**
   - Mitigation: Gradual migration, fallback options
4. **Performance Issues**
   - Mitigation: Performance testing, optimization

### Contingency Plans
1. **Migration Failure**: Keep old project as backup
2. **Configuration Issues**: Use public schema temporarily
3. **Data Corruption**: Restore from backup
4. **Application Issues**: Rollback to working version

## Success Criteria

### Technical Success
- [ ] Zero security issues in Supabase dashboard
- [ ] All schemas accessible via PostgREST
- [ ] RLS policies working correctly
- [ ] Performance meets or exceeds current levels
- [ ] No data loss or corruption

### Business Success
- [ ] Users can seamlessly use all apps
- [ ] All functionality working as expected
- [ ] Improved system reliability
- [ ] Better scalability for future growth
- [ ] Easier maintenance and debugging

## Timeline Summary

| Phase | Duration | Key Deliverables | Status |
|-------|----------|------------------|---------|
| Phase 1 | 1 day | Project setup & planning | ⏳ PENDING |
| Phase 2 | 1 day | Schema creation & config | ⏳ PENDING |
| Phase 3 | 1 day | Data migration & testing | ⏳ PENDING |
| Phase 4 | 1 day | Validation & cleanup | ⏳ PENDING |
| **Total** | **4 days** | **Complete fresh start** | **0% Complete** |

## Next Steps

1. **Review and approve this plan**
2. **Create new Supabase project**
3. **Begin Phase 1 implementation**
4. **Execute migration plan**
5. **Validate and deploy**

## Notes

- This plan assumes 4 days of focused work
- Each phase should be completed before moving to the next
- Regular backups and testing throughout the process
- Team communication and coordination essential
- Documentation should be updated as we progress
