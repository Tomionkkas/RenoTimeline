-- Create Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 2,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_to UUID,
    estimated_hours NUMERIC,
    actual_hours NUMERIC
);

-- Create Team Members Table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to project owners" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow read access to team members" ON public.projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members WHERE team_members.project_id = projects.id AND team_members.user_id = auth.uid()
  )
);

-- RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to project members" ON public.tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members WHERE team_members.project_id = tasks.project_id AND team_members.user_id = auth.uid()
  )
);

-- RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow project owners to manage team" ON public.team_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects WHERE projects.id = team_members.project_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "Allow team members to see themselves" ON public.team_members FOR SELECT USING (team_members.user_id = auth.uid());
