import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProfileUpdateRequest {
  first_name?: string
  last_name?: string
  expertise?: string
  avatar_url?: string
  timezone?: string
  language?: string
  theme?: string
  notification_preferences?: Record<string, any>
}

interface ProfileResponse {
  success: boolean
  message: string
  profile?: any
}

interface AvatarUploadRequest {
  file: string // base64 encoded file
  filename: string
  contentType: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Real-IP') || 
                    req.headers.get('X-Forwarded-For')?.split(',')[0] || 
                    'unknown'
    const userAgent = req.headers.get('User-Agent') || 'unknown'

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await handleGetProfile(supabaseAdmin, user.id)
      
      case 'PUT':
        const updateData = await req.json() as ProfileUpdateRequest
        return await handleUpdateProfile(supabaseAdmin, user, updateData, clientIP, userAgent)
      
      case 'POST':
        const uploadData = await req.json() as AvatarUploadRequest
        return await handleAvatarUpload(supabaseAdmin, user, uploadData, clientIP, userAgent)
      
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Profile management error:', error)
    
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

async function handleGetProfile(supabaseAdmin: any, userId: string): Promise<Response> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile retrieved successfully',
        profile: profile
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Get profile error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to retrieve profile' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleUpdateProfile(
  supabaseAdmin: any, 
  user: any, 
  updateData: ProfileUpdateRequest,
  clientIP: string,
  userAgent: string
): Promise<Response> {
  try {
    // Get current profile for comparison
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Update profiles table
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`)
    }

    // Update auth.users metadata if name fields changed
    if (updateData.first_name || updateData.last_name) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            first_name: updateData.first_name || currentProfile?.first_name,
            last_name: updateData.last_name || currentProfile?.last_name
          }
        }
      )

      if (authError) {
        console.error('Auth metadata update failed:', authError)
        // Don't fail the whole request if metadata update fails
      }
    }

    // Log the profile update
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'PROFILE_UPDATED',
      resource_type: 'profile',
      resource_id: user.id,
      old_values: currentProfile ? {
        first_name: currentProfile.first_name,
        last_name: currentProfile.last_name,
        expertise: currentProfile.expertise,
        avatar_url: currentProfile.avatar_url,
        timezone: currentProfile.timezone,
        language: currentProfile.language,
        theme: currentProfile.theme
      } : null,
      new_values: updateData,
      details: {
        ip_address: clientIP,
        user_agent: userAgent,
        updated_fields: Object.keys(updateData)
      },
      success: true,
      ip_address: clientIP,
      user_agent: userAgent
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile updated successfully',
        profile: updatedProfile
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Update profile error:', error)
    
    // Log failed update
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'PROFILE_UPDATE_FAILED',
      resource_type: 'profile',
      resource_id: user.id,
      details: {
        attempted_update: updateData,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip_address: clientIP,
        user_agent: userAgent
      },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      ip_address: clientIP,
      user_agent: userAgent
    })

    return new Response(
      JSON.stringify({ success: false, message: 'Failed to update profile' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleAvatarUpload(
  supabaseAdmin: any, 
  user: any, 
  uploadData: AvatarUploadRequest,
  clientIP: string,
  userAgent: string
): Promise<Response> {
  try {
    const { file, filename, contentType } = uploadData

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Decode base64 file
    const fileBuffer = new Uint8Array(
      atob(file)
        .split('')
        .map(char => char.charCodeAt(0))
    )

    // Validate file size (5MB limit)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'File size too large. Maximum size is 5MB.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate unique filename
    const fileExtension = filename.split('.').pop()
    const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`
    const filePath = `${user.id}/${uniqueFilename}`

    // Upload to Supabase Storage
    const { data: uploadResult, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile with new avatar URL
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: uniqueFilename, // Store just the filename
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      // Clean up uploaded file if profile update fails
      await supabaseAdmin.storage.from('avatars').remove([filePath])
      throw new Error(`Profile update failed: ${profileError.message}`)
    }

    // Log the avatar upload
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'AVATAR_UPLOADED',
      resource_type: 'avatar',
      resource_id: user.id,
      details: {
        filename: uniqueFilename,
        file_size: fileBuffer.length,
        content_type: contentType,
        storage_path: filePath,
        ip_address: clientIP,
        user_agent: userAgent
      },
      success: true,
      ip_address: clientIP,
      user_agent: userAgent
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Avatar uploaded successfully',
        avatar_url: avatarUrl,
        filename: uniqueFilename
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Avatar upload error:', error)
    
    // Log failed upload
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'AVATAR_UPLOAD_FAILED',
      resource_type: 'avatar',
      resource_id: user.id,
      details: {
        attempted_filename: uploadData.filename,
        content_type: uploadData.contentType,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip_address: clientIP,
        user_agent: userAgent
      },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      ip_address: clientIP,
      user_agent: userAgent
    })

    return new Response(
      JSON.stringify({ success: false, message: 'Failed to upload avatar' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
} 