import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalcRenoProjectData {
  calcreno_project_id: string;
  name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  total_cost?: number;
  calcreno_reference_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const projectData: CalcRenoProjectData = await req.json();

    // Validate required fields
    if (!projectData.calcreno_project_id || !projectData.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: calcreno_project_id and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if project already exists
    const { data: existingProject } = await supabaseClient
      .schema('renotimeline_schema')
      .from('projects')
      .select('id')
      .eq('calcreno_project_id', projectData.calcreno_project_id)
      .eq('user_id', user.id)
      .single();

    if (existingProject) {
      return new Response(
        JSON.stringify({ 
          error: 'Project already imported',
          existing_project_id: existingProject.id 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new project in RenoTimeline
    const { data: newProject, error: insertError } = await supabaseClient
      .schema('renotimeline_schema')
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description || `Imported from CalcReno - ${projectData.name}`,
        budget: projectData.budget || projectData.total_cost,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        status: 'planning',
        user_id: user.id,
        imported_from_calcreno: true,
        calcreno_project_id: projectData.calcreno_project_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating project:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create project', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Automatically assign the user to the project in the shared_schema
    const { error: assignmentError } = await supabaseClient
      .schema('shared_schema')
      .from('user_roles')
      .insert({
        project_id: newProject.id,
        user_id: user.id,
        role: 'owner',
        app_name: 'renotimeline',
      });

    if (assignmentError) {
      console.error('Error assigning user to project:', assignmentError);
      // Continue anyway - project was created successfully
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        project: {
          id: newProject.id,
          name: newProject.name,
          renotimeline_url: `${req.headers.get('origin') || 'https://your-renotimeline-app.com'}/project/${newProject.id}`,
          imported_at: newProject.imported_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 