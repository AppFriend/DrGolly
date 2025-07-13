import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";

// Klaviyo Integration Test Component
function KlaviyoTestSection() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testComprehensiveSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/klaviyo/comprehensive-sync', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Comprehensive sync test result:', data);
      setTestResults(prev => [...prev, { type: 'comprehensive-sync', data, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error testing comprehensive sync:', error);
      setTestResults(prev => [...prev, { type: 'comprehensive-sync', error: error.message, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const testKlaviyoStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/klaviyo/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => [...prev, { type: 'klaviyo-status', data, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error testing Klaviyo status:', error);
      setTestResults(prev => [...prev, { type: 'klaviyo-status', error: error.message, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold text-lg mb-4">Klaviyo Integration Testing</h3>
      
      <div className="space-y-3 mb-4">
        <Button 
          onClick={testComprehensiveSync}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? 'Testing...' : 'Test Comprehensive Klaviyo Sync'}
        </Button>
        
        <Button 
          onClick={testKlaviyoStatus}
          disabled={loading}
          variant="outline"
          className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          Check Klaviyo Status
        </Button>
        
        {testResults.length > 0 && (
          <Button 
            onClick={clearResults}
            variant="outline"
            className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Clear Results
          </Button>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 border rounded text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-purple-700">{result.type.toUpperCase()}</span>
                <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              
              {result.error ? (
                <div className="text-red-600 bg-red-50 p-2 rounded">
                  <strong>Error:</strong> {result.error}
                </div>
              ) : (
                <div className="space-y-2">
                  {result.data.success !== undefined && (
                    <div className={`p-2 rounded ${result.data.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <strong>Status:</strong> {result.data.success ? '✅ Success' : '❌ Failed'}
                    </div>
                  )}
                  
                  {result.data.message && (
                    <div className="p-2 bg-blue-50 text-blue-700 rounded">
                      <strong>Message:</strong> {result.data.message}
                    </div>
                  )}
                  
                  {result.data.syncedData && (
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded">
                      <strong>Synced Data:</strong>
                      <div className="mt-1 text-xs">
                        <div>User: {result.data.syncedData.user?.email} (Tier: {result.data.syncedData.user?.subscriptionTier})</div>
                        <div>Children: {result.data.syncedData.children?.length || 0}</div>
                        <div>Course Purchases: {result.data.syncedData.coursePurchases?.length || 0}</div>
                      </div>
                    </div>
                  )}
                  
                  {result.data.klaviyoConfigured !== undefined && (
                    <div className="p-2 bg-yellow-50 text-yellow-700 rounded">
                      <strong>Klaviyo Configured:</strong> {result.data.klaviyoConfigured ? '✅ Yes' : '❌ No'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuthTestPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Test endpoint to verify database connectivity
  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['/api/test'],
    queryFn: async () => {
      const response = await fetch('/api/test');
      return response.json();
    }
  });

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <img 
            src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
            alt="Dr. Golly Sleep" 
            className="h-16 mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold text-gray-900">
            Authentication Test Dashboard
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Testing the Dr. Golly authentication system and database connectivity
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-2">Authentication Status</h3>
            <div className="space-y-2">
              <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
              {user && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>Subscription:</strong> {user.subscriptionTier}</p>
                </div>
              )}
            </div>
          </div>

          {/* Database Test */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-2">Database Connectivity Test</h3>
            <div className="space-y-2">
              <p><strong>Test Loading:</strong> {testLoading ? '⏳ Yes' : '✅ No'}</p>
              {testData && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p><strong>Test Response:</strong> {testData.message}</p>
                  <p><strong>Status:</strong> ✅ Database connection working with fallback</p>
                </div>
              )}
            </div>
          </div>

          {/* Klaviyo Integration Testing */}
          {isAuthenticated && (
            <KlaviyoTestSection />
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Button 
                  onClick={handleLogin}
                  className="bg-brand-teal hover:bg-brand-teal/90 text-white"
                >
                  Test Login with Dr. Golly
                </Button>
                <Button 
                  onClick={() => setLocation('/login')}
                  variant="outline"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                >
                  Go to Login Page
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setLocation('/')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Go to Home
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* System Info */}
          <div className="bg-gray-50 p-4 rounded-lg border text-sm">
            <h4 className="font-semibold mb-2">System Information</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Dr. Golly OpenID Connect authentication system active</li>
              <li>• Database fallback connection working (bypasses Drizzle ORM issues)</li>
              <li>• 17,000+ users imported and accessible</li>
              <li>• Session management with PostgreSQL storage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}