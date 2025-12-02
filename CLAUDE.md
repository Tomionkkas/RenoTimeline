# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.

## Project Overview

RenoTimeline is a comprehensive project management application for renovation and construction projects, built with React, TypeScript, Vite, and Supabase. The application features task management, workflows, team collaboration, calendar integration, and cross-app notifications with CalcReno (a cost calculation app).

**Tech Stack**: React 18, TypeScript, Vite, Supabase, TailwindCSS, shadcn-ui, React Query, React DnD, React Router

## Essential Commands

### Development
```bash
npm run dev              # Start development server on port 8080
npm run build            # Production build (runs TypeScript compiler + Vite)
npm run build:dev        # Development build
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

### Supabase
```bash
npx supabase start       # Start local Supabase (requires Docker)
npx supabase stop        # Stop local Supabase
npx supabase db reset    # Reset local database
npx supabase migration new <name>  # Create new migration
npx supabase db push     # Push migrations to remote
```

## Architecture

### Multi-Schema Database Architecture

This project uses a **multi-schema Supabase architecture** for separation of concerns:

- **`auth` schema**: Built-in Supabase authentication (users, sessions)
- **`shared_schema`**: Cross-app user data (profiles, app_preferences, user_roles, audit_log, cross_app_notifications)
- **`renotimeline_schema`**: RenoTimeline app data (projects, tasks, subtasks, workflows, custom_fields)
- **`calcreno_schema`**: CalcReno integration (planned - for project imports)
- **`public` schema**: Legacy data (being phased out)

**Critical**: All client code must use the correct schema-specific client from `src/integrations/supabase/client.ts`:
- `supabase` / `renotimelineClient` - for RenoTimeline data
- `sharedClient` - for shared schema (profiles, notifications, roles)
- `calcrenoClient` - for CalcReno integration
- `publicClient` - for legacy public schema

### Supabase Client Configuration

The application uses **shared authentication** across all schema-specific clients. All clients share the same auth instance from the main client to ensure consistent session management. Located in `src/integrations/supabase/client.ts`:

```typescript
// All clients share authentication:
const mainClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, commonOptions);
// Schema clients use: (client as any).auth = mainClient.auth;
```

### Key Architectural Patterns

#### 1. React Query for Data Management
All data fetching uses `@tanstack/react-query` for caching, optimistic updates, and invalidation. Key hooks:
- `useProjects()` - Fetches projects from both owned and assigned
- `useTasks()` - Task management with real-time updates
- `useWorkflows()` - Workflow definitions and execution
- `useAuth()` - Authentication state and user profile

#### 2. Workflow Engine System
Location: `src/lib/workflow/`

The workflow engine enables automation through triggers and actions:
- **WorkflowEngine.ts**: Core execution engine, evaluates and executes workflows
- **WorkflowTriggers.ts**: Event detection (task status changes, creation, assignment, due dates)
- **EnhancedActionExecutors.ts**: Action implementations (create task, send notification, update field, etc.)
- **VariableSubstitution.ts**: Dynamic variable replacement in workflow actions

Workflows are stored in `workflow_definitions` table and executed via `WorkflowEngine.evaluateWorkflows()`.

#### 3. Custom Fields System
Location: `src/hooks/useCustomField*.tsx`, `src/components/ui/CustomField*.tsx`

Extensible metadata system for tasks:
- **Custom Field Definitions**: Schema stored in `custom_field_definitions` table
- **Custom Field Values**: Instance data in `custom_field_values` table
- **Field Types**: text, number, date, select, checkbox, url
- **Workflow Integration**: Custom fields can be used in workflow triggers/conditions

#### 4. Cross-App Notification System (CalcReno Integration)
Phase 1 of CalcReno ↔ RenoTimeline integration is complete:

**Implemented Features**:
- Cross-app notification infrastructure (`shared_schema.cross_app_notifications`)
- Project import API endpoint (`supabase/functions/import-calcreno-project/`)
- UI indicators showing CalcReno-imported projects (ProjectCard badge)
- Hook: `useCrossAppNotifications()` for notification management
- Component: `CalcRenoNotificationCard` for displaying notifications

**Integration Flow**:
1. CalcReno project → RenoTimeline import (via Edge Function)
2. Project created with `imported_from_calcreno: true` and `calcreno_project_id`
3. Cross-app notifications for project updates
4. Unidirectional data flow: CalcReno → RenoTimeline

Reference: `ai_docs/integracja-calcreno-renotimeline.md` for full integration plan.

### Component Organization

```
src/
├── components/
│   ├── Auth/              # Authentication UI (login, protected routes)
│   ├── Calendar/          # Calendar views, event management
│   ├── Dashboard/         # Stats, widgets, quick actions
│   ├── Files/             # File management
│   ├── Kanban/            # Drag-and-drop task boards
│   ├── Notifications/     # Notification center, CalcReno notifications
│   ├── Onboarding/        # User onboarding flow
│   ├── Projects/          # Project CRUD, cards, dialogs
│   ├── Reports/           # Project reports and analytics
│   ├── Settings/          # Application settings
│   ├── Tasks/             # Task management (details, checklists, reminders)
│   ├── Team/              # Team management, assignments
│   ├── Timeline/          # Timeline visualization
│   ├── Workflows/         # Workflow builder, templates, execution logs
│   └── ui/                # shadcn-ui components + custom fields
├── hooks/                 # Custom React hooks (useAuth, useProjects, useTasks, etc.)
├── integrations/supabase/ # Supabase client configuration
├── lib/
│   ├── workflow/          # Workflow engine implementation
│   └── types/             # TypeScript type definitions
└── pages/                 # Route pages (Index, ProjectDashboard)
```

### TypeScript Configuration

The project has **relaxed TypeScript settings** to balance development speed with type safety:
- `noImplicitAny: false` - Implicit any types allowed
- `noUnusedParameters: false` - Unused parameters allowed
- `noUnusedLocals: false` - Unused locals allowed
- `strictNullChecks: false` - Null checks not strict
- `skipLibCheck: true` - Skip type checking of declaration files

When working on this codebase, match the existing patterns rather than adding strict typing.

## Critical Development Guidelines

### Database Interactions

**Always use Row-Level Security (RLS)**:
All tables have RLS enabled. Users can only access their own data via `auth.uid()` policies. Reference: `ai_docs/DEVELOPMENT_GUIDELINES.md`

**Multi-User Project Access**:
Projects can be accessed by:
1. Owner (`projects.user_id` matches `auth.uid()`)
2. Team members (via `shared_schema.user_roles` with `app_name = 'renotimeline'`)

The `useProjects()` hook handles this automatically by querying both sources.

**Always handle errors**:
```typescript
const { data, error } = await renotimelineClient.from('table').select('*');
if (error) {
  console.error('Error:', error);
  // Handle gracefully
}
```

### Schema-Specific Patterns

When creating new features:
1. Determine correct schema (RenoTimeline app data vs. shared data)
2. Use correct client (`renotimelineClient` vs `sharedClient`)
3. Add RLS policies in migration
4. Create proper indexes for query patterns
5. Test with multiple users

### Workflow Integration

When adding new workflow triggers:
1. Define trigger type in `src/lib/types/workflow.ts`
2. Add detection logic to `WorkflowTriggers.ts`
3. Call `WorkflowEngine.evaluateWorkflows()` when event occurs
4. Test workflow execution with sample data

### Edge Functions

Location: `supabase/functions/`

Current Edge Functions:
- `import-calcreno-project` - CalcReno project import
- `create-calcreno-notification` - Create cross-app notifications
- `workflow-scheduler` - Scheduled workflow execution
- `manage-profile` - User profile management
- `delete-account` - Account deletion
- `change-password` - Password change

Deploy with: `npx supabase functions deploy <function-name>`

## Important Files

- **`src/integrations/supabase/client.ts`** - Supabase client configuration (multi-schema setup)
- **`src/hooks/useAuth.tsx`** - Authentication state management
- **`src/hooks/useProjects.ts`** - Project data access (handles owned + assigned projects)
- **`src/lib/workflow/WorkflowEngine.ts`** - Core workflow execution logic
- **`supabase/config.toml`** - Supabase configuration (exposed schemas: public, shared_schema, storage, graphql_public)
- **`ai_docs/integracja-calcreno-renotimeline.md`** - CalcReno integration roadmap
- **`ai_docs/DEVELOPMENT_GUIDELINES.md`** - Comprehensive development patterns
- **`ai_docs/NEW_DATABASE_SCHEMA_DESIGN.md`** - Full schema documentation

## Migration Strategy

The project is in Phase 1 of a migration from `public` schema to `renotimeline_schema`. When working with data:

1. **New features**: Always use `renotimeline_schema`
2. **Existing features**: Check which schema is being used in current implementation
3. **Migration**: Use `shared_schema` for cross-app data, not `public`

Reference: `ai_docs/FRESH_START_PLAN.md` for migration phases.

## Cursor Rules

From `.cursor/rules/supabase.mdc`:
- Use kebab-case for component names (e.g., `my-component.tsx`)
- Favor React Server Components patterns where applicable
- Always add loading and error states to data fetching
- Focus on readability over performance
- Implement complete functionality - no TODOs or placeholders
- Be concise in prose

## Common Pitfalls

1. **Wrong Schema Client**: Using `supabase` instead of `renotimelineClient` for app data
2. **Shared Auth**: Not all clients share auth - they're configured to do so, but bugs can occur if new clients are created incorrectly
3. **RLS Policies**: Forgetting to test policies with different users
4. **Query Performance**: Not using proper WHERE clauses or indexes
5. **Workflow Execution**: Not awaiting `WorkflowEngine.evaluateWorkflows()` after trigger events
6. **Custom Fields**: Not validating field types when setting values
7. **Real-time Subscriptions**: Not cleaning up subscriptions in useEffect cleanup

## Testing Approach

The project does not have automated tests. When making changes:
1. Test in development environment (`npm run dev`)
2. Test with local Supabase (`npx supabase start`)
3. Manually verify authentication flows
4. Test multi-user scenarios (different accounts)
5. Test workflow execution end-to-end
6. Verify RLS policies prevent unauthorized access

## Additional Context

- This is a Lovable.dev project (see README.md)
- Original project ID: `10fe1a67-c440-4093-bd33-e18cb871dcb6`
- The app is designed for Polish market (some UI text may be in Polish)
- Part of a larger ecosystem: RenoScout (property analysis), CalcReno (cost calculation), RenoTimeline (this app)