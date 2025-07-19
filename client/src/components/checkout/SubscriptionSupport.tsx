// Subscription support for checkout-new system
import { useState, useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionSupportProps {
  product: Product;
  customerDetails: any;
  onSubscriptionSuccess: (subscription: any) => void;
}

export function SubscriptionSupport({ product, customerDetails, onSubscriptionSuccess }: SubscriptionSupportProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionPricing, setSubscriptionPricing] = useState<any>(null);

  useEffect(() => {
    // Load subscription pricing if product is subscription type
    if (product.type === 'subscription') {
      loadSubscriptionPricing();
    }
  }, [product]);

  const loadSubscriptionPricing = async () => {
    try {
      const response = await apiRequest('GET', `/api/checkout-new/subscription-pricing/${product.id}`);
      const data = await response.json();
      setSubscriptionPricing(data);
    } catch (error) {
      console.error('Failed to load subscription pricing:', error);
    }
  };

  const handleSubscription = async () => {
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system not ready",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create subscription
      const response = await apiRequest('POST', '/api/checkout-new/create-subscription', {
        productId: product.id,
        customerDetails,
        priceId: subscriptionPricing?.priceId,
      });

      const { subscriptionId, clientSecret } = await response.json();

      // Confirm payment for subscription
      const { error, subscription } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        toast({
          title: "Subscription Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Created",
          description: "Welcome to your new subscription!",
        });
        onSubscriptionSuccess(subscription);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (product.type !== 'subscription') {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
      <h3 className="text-lg font-medium text-blue-900 mb-4">
        Subscription Plan
      </h3>
      {subscriptionPricing && (
        <div className="space-y-3">
          <div className="text-sm text-blue-700">
            <p>Monthly: {subscriptionPricing.monthly?.formatted}</p>
            <p>Yearly: {subscriptionPricing.yearly?.formatted} (Save 20%)</p>
          </div>
          <Button 
            onClick={handleSubscription}
            disabled={isProcessing || !customerDetails.email}
            className="w-full"
          >
            {isProcessing ? 'Creating Subscription...' : 'Start Subscription'}
          </Button>
        </div>
      )}
    </div>
  );
}