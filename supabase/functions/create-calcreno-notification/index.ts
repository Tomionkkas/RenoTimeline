import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-realtime-revalidate, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Set the auth token for the client
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    })

    const { notification_data } = await req.json()

    console.log('Creating CalcReno notification:', notification_data.notification_type)

    // Transform notification_data to match database schema
    const dbNotificationData = {
      user_id: notification_data.user_id,
      project_id: notification_data.project_id,
      calcreno_project_id: notification_data.calcreno_project_id,
      source_app: notification_data.source_app,
      target_app: 'renotimeline',
      notification_type: notification_data.notification_type,
      title: notification_data.title,
      message: notification_data.message,
      priority: notification_data.priority,
      data: notification_data.data,
      action_url: notification_data.calcreno_reference_url,
      is_read: false
    }

    console.log('Transformed notification data for database:', {
      notification_type: dbNotificationData.notification_type,
      title: dbNotificationData.title,
      user_id: dbNotificationData.user_id,
      project_id: dbNotificationData.project_id
    });

    // Try to insert into cross_app_notifications table
    const { data, error } = await supabaseClient
      .from('cross_app_notifications')
      .insert(dbNotificationData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting cross-app notification:', error)
      
      // Fallback: Insert into regular notifications table with CalcReno prefix
      const fallbackNotification = {
        user_id: notification_data.user_id,
        project_id: notification_data.project_id,
        title: `[CalcReno] ${notification_data.title}`,
        message: notification_data.message,
        type: 'system',
        priority: notification_data.priority,
        metadata: {
          ...notification_data,
          is_calcreno_notification: true,
          original_type: notification_data.notification_type
        }
      }

      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('notifications')
        .insert(fallbackNotification)
        .select()
        .single()

      if (fallbackError) {
        throw fallbackError
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: fallbackData,
          method: 'fallback',
          message: 'Used fallback notifications table'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        method: 'cross_app_notifications',
        message: 'CalcReno notification created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-calcreno-notification function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 