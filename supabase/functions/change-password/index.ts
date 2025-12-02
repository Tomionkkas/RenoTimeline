import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  sessionId?: string
}

interface ChangePasswordResponse {
  success: boolean
  message: string
  requiresReauth?: boolean
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

    const accessToken = authHeader.replace('Bearer ', '')

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
    const body = await req.json() as ChangePasswordRequest
    const { currentPassword, newPassword, sessionId } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Current password and new password are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character' 
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

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabaseUser.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      // Log failed password verification attempt
      await supabaseAdmin.from('audit_log').insert({
        user_id: user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        resource_type: 'user_auth',
        resource_id: user.id,
        details: {
          reason: 'invalid_current_password',
          ip_address: clientIP,
          user_agent: userAgent,
          session_id: sessionId
        },
        success: false,
        error_message: 'Invalid current password',
        ip_address: clientIP,
        user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Current password is incorrect' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      // Log failed password update
      await supabaseAdmin.from('audit_log').insert({
        user_id: user.id,
        action: 'PASSWORD_UPDATE_FAILED',
        resource_type: 'user_auth',
        resource_id: user.id,
        details: {
          error: updateError.message,
          ip_address: clientIP,
          user_agent: userAgent,
          session_id: sessionId
        },
        success: false,
        error_message: updateError.message,
        ip_address: clientIP,
        user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to update password. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Invalidate all other sessions except current one
    // This forces the user to re-authenticate on other devices
    await supabaseAdmin.from('user_sessions').update({
      is_active: false
    }).neq('session_token', accessToken).eq('user_id', user.id)

    // Log successful password change
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'PASSWORD_CHANGED',
      resource_type: 'user_auth',
      resource_id: user.id,
      details: {
        ip_address: clientIP,
        user_agent: userAgent,
        session_id: sessionId,
        sessions_invalidated: true
      },
      success: true,
      ip_address: clientIP,
      user_agent: userAgent
    })

    // Update user's last password change timestamp
    await supabaseAdmin.from('profiles').update({
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password changed successfully. You may need to sign in again on other devices.',
        requiresReauth: false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Change password error:', error)
    
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