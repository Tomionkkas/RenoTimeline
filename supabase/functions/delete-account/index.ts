import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DeleteAccountRequest {
  password: string
  confirmationText: string
  reason?: string
}

interface DeleteAccountResponse {
  success: boolean
  message: string
  deletionId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized user' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const body = await req.json() as DeleteAccountRequest
    const { password, confirmationText, reason } = body

    // Validate input
    if (!password || !confirmationText) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Password and confirmation text are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify confirmation text
    if (confirmationText !== 'USUŃ KONTO') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Confirmation text must be exactly "USUŃ KONTO"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Real-IP') || 
                    req.headers.get('X-Forwarded-For')?.split(',')[0] || 
                    'unknown'
    const userAgent = req.headers.get('User-Agent') || 'unknown'

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseUser.auth.signInWithPassword({
      email: user.email!,
      password: password
    })

    if (signInError) {
      // Log failed password verification attempt
      await supabaseAdmin.from('audit_log').insert({
        user_id: user.id,
        action: 'ACCOUNT_DELETION_FAILED',
        resource_type: 'user_auth',
        resource_id: user.id,
        details: {
          reason: 'invalid_password',
          ip_address: clientIP,
          user_agent: userAgent
        },
        success: false,
        error_message: 'Invalid password for account deletion',
        ip_address: clientIP,
        user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid password' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate deletion ID for tracking
    const deletionId = crypto.randomUUID()

    // Start transaction-like deletion process
    try {
      // 1. Log the account deletion request
      await supabaseAdmin.from('audit_log').insert({
        user_id: user.id,
        action: 'ACCOUNT_DELETION_STARTED',
        resource_type: 'user_account',
        resource_id: user.id,
        details: {
          deletion_id: deletionId,
          reason: reason || 'user_requested',
          ip_address: clientIP,
          user_agent: userAgent,
          email: user.email,
          created_at: user.created_at
        },
        success: true,
        ip_address: clientIP,
        user_agent: userAgent
      })

      // 2. Get user's avatar files for cleanup
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list(user.id, { limit: 100 })

      // 3. Delete user's avatar files
      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map(file => `${user.id}/${file.name}`)
        await supabaseAdmin.storage.from('avatars').remove(filePaths)
      }

      // 4. Anonymize or delete user data from custom tables
      // Delete user's tasks
      await supabaseAdmin.from('tasks').delete().eq('user_id', user.id)
      
      // Delete user's projects (cascading deletes will handle related data)
      await supabaseAdmin.from('projects').delete().eq('user_id', user.id)
      
      // Delete user's files
      await supabaseAdmin.from('files').delete().eq('user_id', user.id)
      
      // Delete user's team memberships
      await supabaseAdmin.from('team_members').delete().eq('user_id', user.id)
      
      // Delete user's notifications
      await supabaseAdmin.from('notifications').delete().eq('user_id', user.id)
      
      // Delete user's workflows
      await supabaseAdmin.from('workflows').delete().eq('user_id', user.id)
      
      // Mark user sessions as inactive
      await supabaseAdmin.from('user_sessions').update({
        is_active: false
      }).eq('user_id', user.id)

      // 5. Delete user's profile
      await supabaseAdmin.from('profiles').delete().eq('id', user.id)

      // 6. Delete the auth user (this will cascade to any remaining related data)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        throw new Error(`Failed to delete auth user: ${deleteError.message}`)
      }

      // 7. Log successful deletion
      await supabaseAdmin.from('audit_log').insert({
        user_id: null, // User no longer exists
        action: 'ACCOUNT_DELETION_COMPLETED',
        resource_type: 'user_account',
        resource_id: user.id,
        details: {
          deletion_id: deletionId,
          original_user_id: user.id,
          original_email: user.email,
          ip_address: clientIP,
          user_agent: userAgent,
          deleted_at: new Date().toISOString()
        },
        success: true,
        ip_address: clientIP,
        user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account deleted successfully',
          deletionId: deletionId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (deletionError) {
      console.error('Account deletion error:', deletionError)
      
      // Log failed deletion
      await supabaseAdmin.from('audit_log').insert({
        user_id: user.id,
        action: 'ACCOUNT_DELETION_FAILED',
        resource_type: 'user_account',
        resource_id: user.id,
        details: {
          deletion_id: deletionId,
          error: deletionError instanceof Error ? deletionError.message : 'Unknown error',
          ip_address: clientIP,
          user_agent: userAgent
        },
        success: false,
        error_message: deletionError instanceof Error ? deletionError.message : 'Unknown error',
        ip_address: clientIP,
        user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to delete account. Please contact support.',
          deletionId: deletionId
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Delete account error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 