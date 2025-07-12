import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Crown, Gift, Heart, User } from "lucide-react";

export default function NotificationTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, endpoint: string, method: string = 'POST') => {
    setLoading(true);
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      setTestResults(prev => [...prev, {
        name,
        endpoint,
        success: response.ok,
        status: response.status,
        result
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name,
        endpoint,
        success: false,
        status: 'Error',
        result: { error: error instanceof Error ? error.message : 'Unknown error' }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-brand-teal" />
            <h1 className="text-2xl font-bold text-gray-900">Notification System Testing</h1>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Loyalty Notification
                </CardTitle>
                <CardDescription>
                  Test creating a Gold member loyalty notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => testEndpoint('Create Loyalty Notification', '/test-create-notification')}
                  disabled={loading}
                  className="w-full bg-brand-teal hover:bg-brand-teal/90"
                >
                  {loading ? 'Creating...' : 'Create Test Notification'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  Seed Notification
                </CardTitle>
                <CardDescription>
                  Test the existing seed notification endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => testEndpoint('Seed Loyalty Notification', '/seed-loyalty-notification')}
                  disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800"
                >
                  {loading ? 'Seeding...' : 'Seed Notification'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  User Notifications
                </CardTitle>
                <CardDescription>
                  Fetch current user notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => testEndpoint('Get User Notifications', '/notifications', 'GET')}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Fetching...' : 'Get Notifications'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Clear Results
                </CardTitle>
                <CardDescription>
                  Clear all test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={clearResults}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  Clear All Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index} className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{result.name}</CardTitle>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.status}
                      </Badge>
                    </div>
                    <CardDescription className="font-mono text-sm">
                      {result.endpoint}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-md p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-800">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}