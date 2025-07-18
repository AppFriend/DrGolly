import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthTestPage() {
  const [testUser, setTestUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createTestUser = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest('POST', '/api/admin/create-test-migrated-user');
      const data = await response.json();
      setTestUser(data);
      toast({
        title: "Test User Created",
        description: "Ready to test the password setup banner flow",
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      toast({
        title: "Error",
        description: "Failed to create test user",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const testLogin = () => {
    if (testUser) {
      // Navigate to login page with test credentials
      window.location.href = '/login?email=' + encodeURIComponent(testUser.email) + '&password=' + encodeURIComponent(testUser.tempPassword);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Authentication Test</h1>
        <p className="text-gray-600 mt-2">Test migrated user authentication with password setup banner</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Migrated User Password Setup Test</CardTitle>
          <CardDescription>
            This test creates a migrated user with a temporary password to demonstrate the password setup banner functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createTestUser} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Test User...' : 'Create Test Migrated User'}
          </Button>

          {testUser && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Test User Created Successfully!</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {testUser.email}</div>
                  <div><span className="font-medium">Temporary Password:</span> {testUser.tempPassword}</div>
                  <div><span className="font-medium">User ID:</span> {testUser.userId}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Click "Test Login" to navigate to the login page</li>
                  <li>Login with the temporary password</li>
                  <li>You should see the password setup banner appear</li>
                  <li>Follow the banner instructions to set a new password</li>
                  <li>The banner should disappear after password is set</li>
                </ol>
              </div>

              <Button 
                onClick={testLogin} 
                className="w-full"
                variant="outline"
              >
                Test Login with Temporary Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">1. Login with Temporary Password:</h4>
            <p className="text-gray-600">User can login successfully with temporary password, no authentication errors occur.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Password Setup Banner:</h4>
            <p className="text-gray-600">Welcome banner appears saying "Welcome, you'll need to set your new password"</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Password Creation:</h4>
            <p className="text-gray-600">User can set a new password through the banner form.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Migration Complete:</h4>
            <p className="text-gray-600">User record updated with password_set = "yes" and banner disappears.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}