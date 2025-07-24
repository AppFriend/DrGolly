import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElementTester } from '@/components/PaymentElementTester';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface TestResult {
  mounted: boolean;
  stable: boolean;
  error: string | null;
  timings: {
    mountTime: number;
    stabilityTime: number;
  };
}

export default function TestCheckout() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Create a test payment intent
  const { data: paymentIntent, isLoading, refetch } = useQuery({
    queryKey: ['/api/create-big-baby-payment'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/create-big-baby-payment', {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        amount: 120,
        currency: 'USD'
      });
      return response.json();
    },
    enabled: false // Only run when we trigger it
  });

  const runStabilityTest = async (iterations: number = 5) => {
    setIsRunningTest(true);
    setTestResults([]);
    
    for (let i = 0; i < iterations; i++) {
      console.log(`Running test iteration ${i + 1}/${iterations}`);
      
      // Create new payment intent for each test
      const result = await refetch();
      
      if (result.data?.clientSecret) {
        // We'll collect results from PaymentElementTester
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between tests
      }
    }
    
    setIsRunningTest(false);
  };

  const handleTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const calculateStats = () => {
    if (testResults.length === 0) return null;
    
    const successful = testResults.filter(r => r.mounted && r.stable && !r.error);
    const failed = testResults.filter(r => !r.mounted || !r.stable || r.error);
    
    const avgMountTime = successful.reduce((sum, r) => sum + r.timings.mountTime, 0) / successful.length;
    const avgStabilityTime = successful.reduce((sum, r) => sum + r.timings.stabilityTime, 0) / successful.length;
    
    return {
      total: testResults.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / testResults.length) * 100,
      avgMountTime: Math.round(avgMountTime),
      avgStabilityTime: Math.round(avgStabilityTime),
      errors: failed.map(r => r.error).filter(Boolean)
    };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">PaymentElement Stability Test</h1>
        <p className="text-gray-600">
          Comprehensive testing of PaymentElement mounting behavior in development and production environments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => runStabilityTest(1)}
                disabled={isRunningTest}
                className="w-full"
              >
                {isRunningTest ? 'Running Test...' : 'Run Single Test'}
              </Button>
              <Button
                onClick={() => runStabilityTest(5)}
                disabled={isRunningTest}
                variant="outline"
                className="w-full"
              >
                Run 5 Tests
              </Button>
              <Button
                onClick={() => runStabilityTest(10)}
                disabled={isRunningTest}
                variant="outline"
                className="w-full"
              >
                Run 10 Tests
              </Button>
              <Button
                onClick={() => setTestResults([])}
                variant="secondary"
                className="w-full"
              >
                Clear Results
              </Button>
            </div>

            {/* Environment Info */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Environment</h4>
              <div className="flex justify-between">
                <span>Stripe Key:</span>
                <Badge variant="outline">
                  {import.meta.env.VITE_STRIPE_PUBLIC_KEY ? '✓ Set' : '✗ Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Google Maps:</span>
                <Badge variant="outline">
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✓ Set' : '✗ Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge variant="outline">
                  {import.meta.env.DEV ? 'Development' : 'Production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Tests:</span>
                  <Badge variant="outline">{stats.total}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Successful:</span>
                  <Badge variant="default">{stats.successful}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <Badge variant={stats.failed > 0 ? "destructive" : "secondary"}>
                    {stats.failed}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <Badge variant={stats.successRate === 100 ? "default" : "destructive"}>
                    {stats.successRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg Mount Time:</span>
                  <Badge variant="outline">{stats.avgMountTime}ms</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg Stability Time:</span>
                  <Badge variant="outline">{stats.avgStabilityTime}ms</Badge>
                </div>
                
                {stats.errors.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                    <div className="space-y-1">
                      {stats.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No test results yet. Run a test to see statistics.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Test */}
      {paymentIntent?.clientSecret && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Live Test Instance</h2>
          <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
            <PaymentElementTester
              clientSecret={paymentIntent.clientSecret}
              onTestResult={handleTestResult}
            />
          </Elements>
        </div>
      )}

      {/* Test Results History */}
      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results History</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.mounted && result.stable && !result.error
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Test #{index + 1}</span>
                  <Badge variant={result.mounted && result.stable && !result.error ? "default" : "destructive"}>
                    {result.mounted && result.stable && !result.error ? "✓ PASS" : "✗ FAIL"}
                  </Badge>
                </div>
                {result.error && (
                  <div className="text-sm text-red-600 mt-1">{result.error}</div>
                )}
                <div className="text-sm text-gray-600 mt-1">
                  Mount: {result.timings.mountTime}ms, Stability: {result.timings.stabilityTime}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}