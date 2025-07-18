import React, { useState, useEffect, useRef } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe outside component to prevent recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface StablePaymentFormProps {
  clientSecret: string;
  onSuccess: (result: any) => void;
  coursePrice: number;
  currencySymbol: string;
  currency: string;
  customerDetails: any;
  appliedCoupon: any;
  billingDetails: any;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
}

// Inner payment form component that uses the stable Elements context
function StablePaymentForm({ 
  clientSecret, 
  onSuccess, 
  coursePrice, 
  currencySymbol, 
  currency, 
  customerDetails, 
  appliedCoupon, 
  billingDetails,
  isProcessing,
  onProcessingChange
}: StablePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isElementReady, setIsElementReady] = useState(false);
  const [elementMounted, setElementMounted] = useState(false);
  const paymentElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elements) {
      const paymentElement = elements.getElement('payment');
      if (paymentElement) {
        setElementMounted(true);
        // Listen for element readiness
        paymentElement.on('ready', () => {
          console.log('PaymentElement is ready and mounted');
          setIsElementReady(true);
        });
        
        paymentElement.on('change', (event) => {
          console.log('PaymentElement changed:', event.complete);
        });
      }
    }
  }, [elements]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing || !clientSecret || !customerDetails.email) {
      console.error('Missing required components for payment');
      return;
    }

    if (!isElementReady || !elementMounted) {
      toast({
        title: "Payment Loading",
        description: "Please wait for the payment form to finish loading.",
        variant: "destructive",
      });
      return;
    }

    onProcessingChange(true);
    
    try {
      // Ensure all required billing details are present
      const requiredFields = ['firstName', 'lastName'];
      const missingFields = requiredFields.filter(field => !billingDetails[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      console.log('Starting payment confirmation process...');
      
      // Validate elements are still mounted
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        throw new Error('PaymentElement is not available. Please refresh the page and try again.');
      }

      // Submit the form to validate all fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Form submission error:', submitError);
        throw submitError;
      }

      console.log('Form submitted successfully, confirming payment...');

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/big-baby-public`,
          payment_method_data: {
            billing_details: {
              name: `${billingDetails.firstName} ${billingDetails.lastName}`,
              email: customerDetails.email,
              phone: billingDetails.phone || undefined,
              address: {
                line1: billingDetails.address || undefined,
                city: billingDetails.city || undefined,
                postal_code: billingDetails.postcode || undefined,
                country: billingDetails.country || 'AU'
              }
            }
          }
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        throw error;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onSuccess(paymentIntent);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      onProcessingChange(false);
    }
  };

  const finalPrice = coursePrice * (appliedCoupon ? (1 - appliedCoupon.discount / 100) : 1);
  const discount = appliedCoupon ? coursePrice - finalPrice : 0;

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="space-y-4">
        <div ref={paymentElementRef}>
          <PaymentElement 
            options={{
              layout: 'accordion',
              paymentMethodOrder: ['apple_pay', 'google_pay', 'link', 'card'],
              fields: {
                billingDetails: 'never'
              }
            }}
          />
        </div>
      </div>

      {appliedCoupon && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">Coupon Applied: {appliedCoupon.code}</span>
            <span className="text-green-700 font-medium">-{currencySymbol}{discount.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-[#6B9CA3]">{currencySymbol}{finalPrice.toFixed(2)}</span>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-[#6B9CA3] hover:bg-[#5A8A91] text-white font-semibold py-3 rounded-lg transition-colors"
          disabled={!isElementReady || !elementMounted || isProcessing || !customerDetails.email || !billingDetails.firstName || !billingDetails.lastName}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing payment...
            </div>
          ) : (
            `Place order • ${currencySymbol}${finalPrice.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

// Main component that creates a stable Elements wrapper
export default function StableStripeElements({ 
  clientSecret, 
  onSuccess, 
  coursePrice, 
  currencySymbol, 
  currency, 
  customerDetails, 
  appliedCoupon, 
  billingDetails,
  isProcessing,
  onProcessingChange
}: StablePaymentFormProps) {
  const [initialClientSecret] = useState(clientSecret);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (initialClientSecret && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialClientSecret, isInitialized]);

  if (!initialClientSecret || !isInitialized) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-[#095D66] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading secure payment form...</p>
      </div>
    );
  }

  const elementsOptions = {
    clientSecret: initialClientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#095D66',
        colorBackground: '#ffffff',
        colorText: '#262626',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '6px'
      }
    },
    loader: 'auto' as const
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <StablePaymentForm
        clientSecret={initialClientSecret}
        onSuccess={onSuccess}
        coursePrice={coursePrice}
        currencySymbol={currencySymbol}
        currency={currency}
        customerDetails={customerDetails}
        appliedCoupon={appliedCoupon}
        billingDetails={billingDetails}
        isProcessing={isProcessing}
        onProcessingChange={onProcessingChange}
      />
    </Elements>
  );
}