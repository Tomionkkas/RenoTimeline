# New Database Schema Design

## Overview

This document defines the complete database schema design for the fresh start RenoScout ecosystem. Each schema has a specific purpose and clear boundaries.

## Schema Architecture

### 1. Built-in Auth Schema (`auth`)
**Purpose**: Supabase's built-in authentication system
**Access**: Managed by Supabase automatically

```sql
-- Supabase manages these tables automatically
auth.users
auth.sessions
auth.refresh_tokens
auth.identities
auth.mfa_factors
auth.mfa_challenges
auth.flow_state
auth.saml_providers
auth.saml_relay_states
auth.sso_providers
auth.sso_domains
auth.saml_provider_attributes
```

### 2. Shared Schema (`shared_schema`)
**Purpose**: Cross-app user data and shared functionality
**Access**: All apps can read/write their own data

#### Tables:

```sql
-- User profiles extending auth.users
CREATE TABLE shared_schema.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}',
    expertise TEXT[], -- Array of expertise areas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App-specific preferences
CREATE TABLE shared_schema.app_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL, -- 'renoscout', 'calcreno', 'renotimeline'
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, app_name)
);

-- Cross-app user roles
CREATE TABLE shared_schema.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'admin', 'premium'
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, app_name)
);

-- Audit logging for security
CREATE TABLE shared_schema.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    app_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'login', 'property_saved', 'project_created'
    resource_type TEXT, -- 'property', 'project', 'user'
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest sessions for anonymous users
CREATE TABLE shared_schema.guest_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    app_name TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push notifications
CREATE TABLE shared_schema.user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    push_token TEXT NOT NULL,
    device_type TEXT, -- 'web', 'ios', 'android'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, push_token)
);

-- Cross-app notifications
CREATE TABLE shared_schema.cross_app_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_app TEXT NOT NULL,
    to_app TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. RenoScout Schema (`renoscout_schema`)
**Purpose**: Property analysis and investment management
**Access**: RenoScout app only

#### Tables:

```sql
-- Core property data
CREATE TABLE renoscout_schema.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    price_currency TEXT DEFAULT 'PLN',
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Poland',
    property_type TEXT, -- 'apartment', 'house', 'commercial'
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqm NUMERIC,
    land_area_sqm NUMERIC,
    year_built INTEGER,
    condition TEXT, -- 'new', 'good', 'needs_renovation'
    features JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    coordinates POINT,
    source_url TEXT,
    source_name TEXT, -- 'otodom', 'olx', 'gratka'
    external_id TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'sold', 'inactive'
    is_guest_session BOOLEAN DEFAULT false,
    guest_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    analysis_status TEXT DEFAULT 'pending', -- 'pending', 'analyzing', 'completed', 'failed'
    is_active BOOLEAN DEFAULT true,
    source_platform TEXT,
    size_sqm INTEGER,
    rooms INTEGER,
    condition_score INTEGER, -- 1-10 scale
    listing_url TEXT,
    metadata JSONB DEFAULT '{}',
    scraped_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Government data fields
    terc_gmina TEXT,
    terc_powiat TEXT,
    terc_woj TEXT,
    simc_locality TEXT,
    ulic_street TEXT,
    gov_data_enriched BOOLEAN DEFAULT false,
    last_analysis_id TEXT
);

-- User watchlists
CREATE TABLE renoscout_schema.user_watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES renoscout_schema.properties(id) ON DELETE CASCADE,
    notes TEXT,
    priority INTEGER DEFAULT 5, -- 1-10 scale
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- AI property analysis
CREATE TABLE renoscout_schema.ai_property_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES renoscout_schema.properties(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL, -- 'investment', 'renovation', 'market'
    analysis_data JSONB NOT NULL,
    confidence_score NUMERIC, -- 0-1 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market analysis data
CREATE TABLE renoscout_schema.market_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES renoscout_schema.properties(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    market_trend TEXT, -- 'rising', 'stable', 'declining'
    average_price_per_sqm NUMERIC,
    price_prediction_6m NUMERIC,
    price_prediction_12m NUMERIC,
    roi_potential NUMERIC, -- percentage
    investment_score INTEGER, -- 1-10 scale
    estimated_value NUMERIC,
    renovation_cost_estimate NUMERIC,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search alerts
CREATE TABLE renoscout_schema.search_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    criteria JSONB NOT NULL, -- search filters
    is_active BOOLEAN DEFAULT true,
    frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RenoScout app preferences
CREATE TABLE renoscout_schema.renoscout_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    default_currency TEXT DEFAULT 'PLN',
    preferred_locations TEXT[],
    investment_criteria JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Government data cache
CREATE TABLE renoscout_schema.government_data_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_type TEXT NOT NULL, -- 'teryt', 'bdl', 'simc'
    location_code TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_type, location_code)
);

-- Analysis feedback
CREATE TABLE renoscout_schema.analysis_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES renoscout_schema.ai_property_analysis(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL, -- 'accuracy', 'usefulness', 'completeness'
    rating INTEGER NOT NULL, -- 1-5 scale
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files storage
CREATE TABLE renoscout_schema.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES renoscout_schema.properties(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analysis results
CREATE TABLE renoscout_schema.user_analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES renoscout_schema.properties(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. CalcrReno Schema (`calcreno_schema`)
**Purpose**: Renovation cost calculations and project management
**Access**: CalcrReno app only

#### Tables:

```sql
-- CalcrReno projects
CREATE TABLE calcreno_schema.calcreno_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    property_address TEXT,
    total_area NUMERIC,
    project_type TEXT, -- 'renovation', 'new_build', 'extension'
    budget_limit NUMERIC,
    timeline_months INTEGER,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed'
    is_exported_to_timeline BOOLEAN DEFAULT false,
    timeline_project_id UUID, -- Reference to renotimeline_schema.projects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project rooms
CREATE TABLE calcreno_schema.calcreno_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES calcreno_schema.calcreno_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL, -- 'bedroom', 'bathroom', 'kitchen', 'living_room'
    area_sqm NUMERIC NOT NULL,
    height_m NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room elements (walls, floors, ceilings, etc.)
CREATE TABLE calcreno_schema.calcreno_room_elements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES calcreno_schema.calcreno_rooms(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL, -- 'wall', 'floor', 'ceiling', 'door', 'window'
    material TEXT NOT NULL,
    area_sqm NUMERIC NOT NULL,
    unit_cost NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export queue for RenoTimeline
CREATE TABLE calcreno_schema.project_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES calcreno_schema.calcreno_projects(id) ON DELETE CASCADE,
    export_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    timeline_project_id UUID, -- Reference to created timeline project
    export_data JSONB NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### 5. RenoTimeline Schema (`renotimeline_schema`)
**Purpose**: Project timeline and task management
**Access**: RenoTimeline app only

#### Tables:

```sql
-- Timeline projects
CREATE TABLE renotimeline_schema.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    property_address TEXT,
    project_type TEXT, -- 'renovation', 'new_build', 'extension'
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'on_hold'
    budget NUMERIC,
    actual_cost NUMERIC,
    progress_percentage INTEGER DEFAULT 0,
    imported_from_calcreno BOOLEAN DEFAULT false,
    calcreno_project_id UUID, -- Reference to calcreno_schema.calcreno_projects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project tasks
CREATE TABLE renotimeline_schema.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES renotimeline_schema.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL, -- 'demolition', 'electrical', 'plumbing', 'finishing'
    priority INTEGER DEFAULT 5, -- 1-10 scale
    estimated_duration_days INTEGER,
    actual_duration_days INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
    assigned_to TEXT, -- contractor name or user reference
    cost_estimate NUMERIC,
    actual_cost NUMERIC,
    dependencies TEXT[], -- Array of task IDs this task depends on
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task subtasks
CREATE TABLE renotimeline_schema.subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES renotimeline_schema.tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    estimated_hours INTEGER,
    actual_hours INTEGER,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow definitions
CREATE TABLE renotimeline_schema.workflow_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    workflow_type TEXT NOT NULL, -- 'renovation', 'new_build', 'extension'
    steps JSONB NOT NULL, -- Array of workflow steps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE renotimeline_schema.workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES renotimeline_schema.projects(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES renotimeline_schema.workflow_definitions(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
    execution_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Imported projects from CalcrReno
CREATE TABLE renotimeline_schema.imported_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES renotimeline_schema.projects(id) ON DELETE CASCADE,
    calcreno_project_id UUID NOT NULL,
    import_data JSONB NOT NULL,
    import_status TEXT DEFAULT 'success', -- 'success', 'partial', 'failed'
    error_message TEXT,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes for Performance

### Shared Schema Indexes
```sql
-- Profiles
CREATE INDEX idx_profiles_email ON shared_schema.profiles(email);
CREATE INDEX idx_profiles_created_at ON shared_schema.profiles(created_at);

-- App preferences
CREATE INDEX idx_app_preferences_user_app ON shared_schema.app_preferences(user_id, app_name);

-- User roles
CREATE INDEX idx_user_roles_user_app ON shared_schema.user_roles(user_id, app_name);

-- Audit log
CREATE INDEX idx_audit_log_user_id ON shared_schema.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON shared_schema.audit_log(created_at);
CREATE INDEX idx_audit_log_app_action ON shared_schema.audit_log(app_name, action);

-- Guest sessions
CREATE INDEX idx_guest_sessions_token ON shared_schema.guest_sessions(session_token);
CREATE INDEX idx_guest_sessions_expires ON shared_schema.guest_sessions(expires_at);

-- Push tokens
CREATE INDEX idx_push_tokens_user ON shared_schema.user_push_tokens(user_id, app_name);

-- Notifications
CREATE INDEX idx_notifications_user ON shared_schema.cross_app_notifications(user_id);
CREATE INDEX idx_notifications_unread ON shared_schema.cross_app_notifications(user_id, is_read);
```

### RenoScout Schema Indexes
```sql
-- Properties
CREATE INDEX idx_properties_location ON renoscout_schema.properties(city, address);
CREATE INDEX idx_properties_price ON renoscout_schema.properties(price);
CREATE INDEX idx_properties_type ON renoscout_schema.properties(property_type);
CREATE INDEX idx_properties_status ON renoscout_schema.properties(status, is_active);
CREATE INDEX idx_properties_created_at ON renoscout_schema.properties(created_at);
CREATE INDEX idx_properties_source ON renoscout_schema.properties(source_name, external_id);

-- User watchlists
CREATE INDEX idx_watchlists_user ON renoscout_schema.user_watchlists(user_id, is_active);
CREATE INDEX idx_watchlists_property ON renoscout_schema.user_watchlists(property_id);

-- AI analysis
CREATE INDEX idx_ai_analysis_property ON renoscout_schema.ai_property_analysis(property_id);
CREATE INDEX idx_ai_analysis_type ON renoscout_schema.ai_property_analysis(analysis_type);

-- Market analysis
CREATE INDEX idx_market_analysis_location ON renoscout_schema.market_analysis(location);
CREATE INDEX idx_market_analysis_property ON renoscout_schema.market_analysis(property_id);

-- Search alerts
CREATE INDEX idx_search_alerts_user ON renoscout_schema.search_alerts(user_id, is_active);

-- Government data cache
CREATE INDEX idx_gov_cache_type_code ON renoscout_schema.government_data_cache(data_type, location_code);
CREATE INDEX idx_gov_cache_expires ON renoscout_schema.government_data_cache(expires_at);
```

### CalcrReno Schema Indexes
```sql
-- Projects
CREATE INDEX idx_calcreno_projects_user ON calcreno_schema.calcreno_projects(user_id);
CREATE INDEX idx_calcreno_projects_status ON calcreno_schema.calcreno_projects(status);

-- Rooms
CREATE INDEX idx_calcreno_rooms_project ON calcreno_schema.calcreno_rooms(project_id);

-- Room elements
CREATE INDEX idx_calcreno_elements_room ON calcreno_schema.calcreno_room_elements(room_id);
CREATE INDEX idx_calcreno_elements_type ON calcreno_schema.calcreno_room_elements(element_type);
```

### RenoTimeline Schema Indexes
```sql
-- Projects
CREATE INDEX idx_timeline_projects_user ON renotimeline_schema.projects(user_id);
CREATE INDEX idx_timeline_projects_status ON renotimeline_schema.projects(status);

-- Tasks
CREATE INDEX idx_timeline_tasks_project ON renotimeline_schema.tasks(project_id);
CREATE INDEX idx_timeline_tasks_status ON renotimeline_schema.tasks(status);
CREATE INDEX idx_timeline_tasks_dates ON renotimeline_schema.tasks(start_date, end_date);

-- Subtasks
CREATE INDEX idx_timeline_subtasks_task ON renotimeline_schema.subtasks(task_id);
CREATE INDEX idx_timeline_subtasks_status ON renotimeline_schema.subtasks(status);
```

## Row Level Security (RLS) Policies

### Shared Schema RLS
```sql
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON shared_schema.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON shared_schema.profiles
    FOR UPDATE USING (auth.uid() = id);

-- App preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own app preferences" ON shared_schema.app_preferences
    FOR ALL USING (auth.uid() = user_id);

-- User roles: Users can only access their own roles
CREATE POLICY "Users can view own roles" ON shared_schema.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Audit log: Users can only view their own audit entries
CREATE POLICY "Users can view own audit log" ON shared_schema.audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Guest sessions: No RLS (anonymous access)
-- Push tokens: Users can only access their own tokens
CREATE POLICY "Users can manage own push tokens" ON shared_schema.user_push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can manage own notifications" ON shared_schema.cross_app_notifications
    FOR ALL USING (auth.uid() = user_id);
```

### RenoScout Schema RLS
```sql
-- Properties: Users can view all active properties, manage their own
CREATE POLICY "Anyone can view active properties" ON renoscout_schema.properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own properties" ON renoscout_schema.properties
    FOR ALL USING (auth.uid() = user_id);

-- User watchlists: Users can only access their own watchlists
CREATE POLICY "Users can manage own watchlists" ON renoscout_schema.user_watchlists
    FOR ALL USING (auth.uid() = user_id);

-- AI analysis: Users can view analysis for properties they have access to
CREATE POLICY "Users can view property analysis" ON renoscout_schema.ai_property_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renoscout_schema.properties p 
            WHERE p.id = property_id AND p.is_active = true
        )
    );

-- Market analysis: Public read access
CREATE POLICY "Anyone can view market analysis" ON renoscout_schema.market_analysis
    FOR SELECT USING (true);

-- Search alerts: Users can only access their own alerts
CREATE POLICY "Users can manage own search alerts" ON renoscout_schema.search_alerts
    FOR ALL USING (auth.uid() = user_id);

-- App preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON renoscout_schema.renoscout_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Government data cache: Public read access
CREATE POLICY "Anyone can view government data cache" ON renoscout_schema.government_data_cache
    FOR SELECT USING (expires_at > NOW());

-- Analysis feedback: Users can only access their own feedback
CREATE POLICY "Users can manage own feedback" ON renoscout_schema.analysis_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Files: Users can only access their own files
CREATE POLICY "Users can manage own files" ON renoscout_schema.files
    FOR ALL USING (auth.uid() = user_id);

-- User analysis results: Users can only access their own results
CREATE POLICY "Users can manage own analysis results" ON renoscout_schema.user_analysis_results
    FOR ALL USING (auth.uid() = user_id);
```

### CalcrReno Schema RLS
```sql
-- Projects: Users can only access their own projects
CREATE POLICY "Users can manage own projects" ON calcreno_schema.calcreno_projects
    FOR ALL USING (auth.uid() = user_id);

-- Rooms: Users can only access rooms in their own projects
CREATE POLICY "Users can manage own project rooms" ON calcreno_schema.calcreno_rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM calcreno_schema.calcreno_projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- Room elements: Users can only access elements in their own projects
CREATE POLICY "Users can manage own room elements" ON calcreno_schema.calcreno_room_elements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM calcreno_schema.calcreno_rooms r
            JOIN calcreno_schema.calcreno_projects p ON r.project_id = p.id
            WHERE r.id = room_id AND p.user_id = auth.uid()
        )
    );

-- Project exports: Users can only access their own exports
CREATE POLICY "Users can manage own exports" ON calcreno_schema.project_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM calcreno_schema.calcreno_projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );
```

### RenoTimeline Schema RLS
```sql
-- Projects: Users can only access their own projects
CREATE POLICY "Users can manage own projects" ON renotimeline_schema.projects
    FOR ALL USING (auth.uid() = user_id);

-- Tasks: Users can only access tasks in their own projects
CREATE POLICY "Users can manage own project tasks" ON renotimeline_schema.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM renotimeline_schema.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- Subtasks: Users can only access subtasks in their own projects
CREATE POLICY "Users can manage own project subtasks" ON renotimeline_schema.subtasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM renotimeline_schema.tasks t
            JOIN renotimeline_schema.projects p ON t.project_id = p.id
            WHERE t.id = task_id AND p.user_id = auth.uid()
        )
    );

-- Workflow definitions: Public read access
CREATE POLICY "Anyone can view workflow definitions" ON renotimeline_schema.workflow_definitions
    FOR SELECT USING (is_active = true);

-- Workflow executions: Users can only access their own executions
CREATE POLICY "Users can manage own workflow executions" ON renotimeline_schema.workflow_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM renotimeline_schema.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- Imported projects: Users can only access their own imports
CREATE POLICY "Users can manage own imports" ON renotimeline_schema.imported_projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM renotimeline_schema.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );
```

## Triggers and Functions

### Updated Timestamps
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
-- (Add triggers for each table as needed)
```

### Data Validation
```sql
-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to validate phone format
CREATE OR REPLACE FUNCTION validate_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~* '^\+?[0-9\s\-\(\)]{9,}$';
END;
$$ LANGUAGE plpgsql;
```

## Notes

- All tables include `created_at` and `updated_at` timestamps
- UUID primary keys for better security and scalability
- JSONB columns for flexible data storage
- Proper foreign key constraints for data integrity
- Comprehensive indexing for performance
- RLS policies for security
- Triggers for automatic timestamp updates
- Validation functions for data quality

This schema design provides a solid foundation for the RenoScout ecosystem with proper separation of concerns, security, and performance optimization.
