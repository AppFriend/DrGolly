import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function KlaviyoTest() {
  const [testData, setTestData] = useState({
    firstName: "John",
    lastName: "Test",
    email: "john.test@example.com",
    dueDate: "2025-08-15"
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const runTest = async (endpoint: string, testType: string) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', endpoint, testData);
      const result = await response.json();
      
      setResults(prev => [...prev, {
        type: testType,
        timestamp: new Date().toISOString(),
        success: result.success,
        result: result
      }]);

      toast({
        title: result.success ? "Test Passed" : "Test Failed",
        description: `${testType}: ${result.message}`,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: `${testType}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/test/klaviyo/status');
      const result = await response.json();
      
      setResults(prev => [...prev, {
        type: "Status Check",
        timestamp: new Date().toISOString(),
        success: result.klaviyoConfigured,
        result: result
      }]);

      toast({
        title: result.klaviyoConfigured ? "Klaviyo Configured" : "Klaviyo Not Configured",
        description: result.klaviyoConfigured ? "API key found" : "API key missing",
        variant: result.klaviyoConfigured ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Status Check Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Klaviyo Integration Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={testData.firstName}
                  onChange={(e) => setTestData({...testData, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={testData.lastName}
                  onChange={(e) => setTestData({...testData, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData({...testData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date (for public checkout)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={testData.dueDate}
                  onChange={(e) => setTestData({...testData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Button onClick={checkStatus} disabled={loading}>
                Check Status
              </Button>
              <Button 
                onClick={() => runTest('/api/test/klaviyo/signup', 'Regular Signup')}
                disabled={loading}
              >
                Test Signup Flow
              </Button>
              <Button 
                onClick={() => runTest('/api/test/klaviyo/public-checkout', 'Public Checkout')}
                disabled={loading}
              >
                Test Public Checkout
              </Button>
              <Button 
                onClick={() => runTest('/api/test/klaviyo/welcome-email', 'Welcome Email')}
                disabled={loading}
              >
                Test Welcome Email
              </Button>
            </div>

            <Button 
              onClick={() => setResults([])}
              variant="outline"
              disabled={loading}
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.length === 0 ? (
                <p className="text-gray-500">No tests run yet</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{result.type}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.timestamp}</p>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}