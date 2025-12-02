// Test file to verify shared schema integration
import { getSharedSchemaClient } from '@/integrations/supabase/client';

// Test function to verify shared schema access
export async function testSharedSchema() {
  try {
    const sharedClient = getSharedSchemaClient();
    
    // Test 1: Check if we can access the shared_schema
    console.log('Testing shared schema access...');
    
    // Test 2: Try to query profiles table
    const { data: profiles, error: profilesError } = await sharedClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .limit(5);
    
    if (profilesError) {
      console.error('Error accessing profiles:', profilesError);
      return false;
    }
    
    console.log('✅ Successfully accessed shared_schema.profiles');
    console.log('Profiles found:', profiles?.length || 0);
    
    // Test 3: Try to query app_preferences table
    const { data: preferences, error: preferencesError } = await sharedClient
      .from('app_preferences')
      .select('*')
      .limit(5);
    
    if (preferencesError) {
      console.error('Error accessing app_preferences:', preferencesError);
      return false;
    }
    
    console.log('✅ Successfully accessed shared_schema.app_preferences');
    console.log('Preferences found:', preferences?.length || 0);
    
    // Test 4: Try to query user_roles table
    const { data: roles, error: rolesError } = await sharedClient
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.error('Error accessing user_roles:', rolesError);
      return false;
    }
    
    console.log('✅ Successfully accessed shared_schema.user_roles');
    console.log('Roles found:', roles?.length || 0);
    
    console.log('🎉 All shared schema tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Shared schema test failed:', error);
    return false;
  }
}

// Test function to verify authentication flow
export async function testAuthenticationFlow() {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log('Testing authentication flow...');
    
    // Test 1: Check if auth is accessible
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return false;
    }
    
    console.log('✅ Authentication is accessible');
    console.log('Current session:', session ? 'Active' : 'No session');
    
    // Test 2: Check if we can access auth.users (built-in schema)
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.log('Note: Direct auth.users access not available (expected)');
    } else {
      console.log('✅ Direct auth.users access available');
    }
    
    console.log('🎉 Authentication flow test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('Running shared schema tests in browser...');
  testSharedSchema();
  testAuthenticationFlow();
}
