import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSharedSchema } from '@/hooks/useSharedSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const TestPhase1 = () => {
  const { user, signIn, signOut } = useAuth();
  const { getProfile, updateAppPreferences } = useSharedSchema();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check if user is authenticated
      if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
        
        // Test 2: Get profile from shared schema
        const profile = await getProfile();
        if (profile) {
          addResult(`✅ Profile loaded from shared_schema: ${profile.first_name} ${profile.last_name}`);
        } else {
          addResult(`❌ Profile not found in shared_schema`);
        }
        
        // Test 3: Update app preferences
        try {
          await updateAppPreferences({
            test_preference: 'Phase 1.2 working!',
            timestamp: new Date().toISOString()
          });
          addResult(`✅ App preferences updated in shared_schema`);
        } catch (error) {
          addResult(`❌ Failed to update app preferences: ${error}`);
        }
      } else {
        addResult(`ℹ️ No user logged in - please log in to test full functionality`);
      }
      
      addResult(`🎉 Phase 1.2 tests completed!`);
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      addResult(`❌ Please enter email and password`);
      return;
    }
    
    setLoginLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        addResult(`❌ Login failed: ${error.message}`);
      } else {
        addResult(`✅ Login successful!`);
        setShowLogin(false);
      }
    } catch (error) {
      addResult(`❌ Login error: ${error}`);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Phase 1.2 Test - Shared Schema Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Tests'}
          </Button>
          {user ? (
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setShowLogin(!showLogin)}>
              {showLogin ? 'Cancel Login' : 'Sign In'}
            </Button>
          )}
        </div>
        
        {showLogin && !user && (
          <div className="border rounded p-4 space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <Button onClick={handleLogin} disabled={loginLoading}>
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        )}
        
        <div className="text-sm">
          <strong>Current Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}
        </div>
        
        {testResults.length > 0 && (
          <div className="border rounded p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <strong>Test Results:</strong>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm mt-1">
                {result}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-600">
          <strong>What this tests:</strong>
          <ul className="mt-1 list-disc list-inside">
            <li>Authentication with built-in auth schema</li>
            <li>Profile access from shared_schema</li>
            <li>App preferences in shared_schema</li>
            <li>Cross-schema data flow</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
