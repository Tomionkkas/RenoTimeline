-- Enums for custom fields
CREATE TYPE public.entity_type AS ENUM ('task', 'project');
CREATE TYPE public.field_type AS ENUM ('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox', 'user');

-- Table for custom field definitions
CREATE TABLE public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type public.field_type NOT NULL,
    entity_type public.entity_type NOT NULL,
    options JSONB,
    default_value TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    position INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for custom field values
CREATE TABLE public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- Refers to task_id or project_id
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(definition_id, entity_id)
);

-- Indexes for performance
CREATE INDEX idx_custom_field_definitions_project_id ON public.custom_field_definitions(project_id);
CREATE INDEX idx_custom_field_values_definition_id ON public.custom_field_values(definition_id);
CREATE INDEX idx_custom_field_values_entity_id ON public.custom_field_values(entity_id);

-- RLS policies for custom_field_definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to project members on custom_field_definitions"
ON public.custom_field_definitions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.project_id = custom_field_definitions.project_id
      AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Allow full access to project owners on custom_field_definitions"
ON public.custom_field_definitions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = custom_field_definitions.project_id
      AND p.user_id = auth.uid()
  )
);

-- RLS policies for custom_field_values
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to project members on custom_field_values"
ON public.custom_field_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM custom_field_definitions cfd
    JOIN team_members tm ON cfd.project_id = tm.project_id
    WHERE cfd.id = custom_field_values.definition_id
      AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Allow full access to project members for their entities on custom_field_values"
ON public.custom_field_values
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM custom_field_definitions cfd
    JOIN team_members tm ON cfd.project_id = tm.project_id
    WHERE cfd.id = custom_field_values.definition_id
      AND tm.user_id = auth.uid()
  )
);
