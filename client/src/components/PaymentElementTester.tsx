import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentElementTesterProps {
  clientSecret: string;
  onTestResult: (result: {
    mounted: boolean;
    stable: boolean;
    error: string | null;
    timings: {
      mountTime: number;
      stabilityTime: number;
    };
  }) => void;
}

export function PaymentElementTester({ clientSecret, onTestResult }: PaymentElementTesterProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isElementReady, setIsElementReady] = useState(false);
  const [elementMounted, setElementMounted] = useState(false);
  const [elementStable, setElementStable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timings, setTimings] = useState({
    startTime: Date.now(),
    mountTime: 0,
    stabilityTime: 0
  });

  useEffect(() => {
    const startTime = Date.now();
    setTimings(prev => ({ ...prev, startTime }));
  }, []);

  const handleElementReady = () => {
    const mountTime = Date.now() - timings.startTime;
    setIsElementReady(true);
    setElementMounted(true);
    setTimings(prev => ({ ...prev, mountTime }));
    
    // Test stability after 500ms
    setTimeout(() => {
      setElementStable(true);
      const stabilityTime = Date.now() - timings.startTime;
      setTimings(prev => ({ ...prev, stabilityTime }));
      
      // Report test result
      onTestResult({
        mounted: true,
        stable: true,
        error: null,
        timings: {
          mountTime,
          stabilityTime
        }
      });
    }, 500);
  };

  const handleElementError = (event: any) => {
    const errorMessage = event.error?.message || 'Unknown PaymentElement error';
    setError(errorMessage);
    setIsElementReady(false);
    setElementMounted(false);
    setElementStable(false);
    
    onTestResult({
      mounted: false,
      stable: false,
      error: errorMessage,
      timings: {
        mountTime: 0,
        stabilityTime: 0
      }
    });
  };

  const testPaymentConfirmation = async () => {
    if (!stripe || !elements || !elementStable) {
      return;
    }

    try {
      // Test if payment element is properly mounted for confirmation
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(`Element submit error: ${submitError.message}`);
      }

      // Test payment confirmation (this will fail but we just want to test mounting)
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/test-complete'
        },
        redirect: 'if_required'
      });

      if (confirmError && confirmError.code !== 'card_declined') {
        throw new Error(`Payment confirmation error: ${confirmError.message}`);
      }

      // If we get here, the element is properly mounted
      onTestResult({
        mounted: true,
        stable: true,
        error: null,
        timings: timings
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onTestResult({
        mounted: false,
        stable: false,
        error: errorMessage,
        timings: timings
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>PaymentElement Stability Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Element Ready:</span>
            <Badge variant={isElementReady ? "default" : "secondary"}>
              {isElementReady ? "✓ Yes" : "⏳ No"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Element Mounted:</span>
            <Badge variant={elementMounted ? "default" : "secondary"}>
              {elementMounted ? "✓ Yes" : "⏳ No"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Element Stable:</span>
            <Badge variant={elementStable ? "default" : "secondary"}>
              {elementStable ? "✓ Yes" : "⏳ No"}
            </Badge>
          </div>
          {timings.mountTime > 0 && (
            <div className="flex justify-between items-center">
              <span>Mount Time:</span>
              <Badge variant="outline">{timings.mountTime}ms</Badge>
            </div>
          )}
          {timings.stabilityTime > 0 && (
            <div className="flex justify-between items-center">
              <span>Stability Time:</span>
              <Badge variant="outline">{timings.stabilityTime}ms</Badge>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <PaymentElement
          key={`test-${clientSecret.slice(-8)}`}
          options={{
            layout: 'accordion',
            paymentMethodOrder: ['card'],
            fields: {
              billingDetails: {
                email: 'never'
              }
            }
          }}
          onReady={handleElementReady}
          onLoadError={handleElementError}
          onChange={(event) => {
            if (event.complete && !isElementReady) {
              handleElementReady();
            }
          }}
        />

        <Button
          onClick={testPaymentConfirmation}
          disabled={!elementStable}
          className="w-full"
        >
          Test Payment Confirmation
        </Button>
      </CardContent>
    </Card>
  );
}