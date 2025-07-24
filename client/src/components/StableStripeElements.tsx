import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface StableStripeElementsProps {
  finalPrice: number;
  discountAmount: number;
  customerDetails: any;
  handlePaymentSuccess: (paymentIntentId: string) => void;
  currencySymbol: string;
}

function PaymentForm({ finalPrice, discountAmount, customerDetails, handlePaymentSuccess, currencySymbol }: StableStripeElementsProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !isReady) {
      toast({
        title: "Payment Loading",
        description: "Please wait for the payment form to load completely.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting payment confirmation with Stripe...');
      
      // Create billing details - ALL fields required when using billingDetails: 'never'
      const billingDetails = {
        name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
        email: customerDetails.email,
        phone: customerDetails.phone || '0000000000', // Provide default phone when missing
        address: {
          line1: customerDetails.address || '123 Main St', // Provide default address when missing
          line2: '',
          city: customerDetails.city || 'City',
          state: customerDetails.state || '',
          postal_code: customerDetails.postcode || '0000',
          country: customerDetails.country || 'AU'
        }
      };

      console.log('Confirming payment with billing details:', billingDetails);

      // Confirm payment using the Elements instance
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/big-baby-public`,
          payment_method_data: {
            billing_details: billingDetails
          }
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Stripe payment error:', error);
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent.id);
        handlePaymentSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not completed successfully');
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4">
        <PaymentElement />
      </div>
      
      <Button
        type="submit"
        disabled={!isReady || isProcessing || !stripe || !elements}
        className="w-full h-12 bg-[#6B9CA3] hover:bg-[#5a8289] text-white font-semibold rounded-lg"
      >
        {isProcessing ? "Processing..." : "Complete Purchase"}
      </Button>
    </form>
  );
}

export default function StableStripeElements({ finalPrice, discountAmount, customerDetails, handlePaymentSuccess, currencySymbol }: StableStripeElementsProps) {
  return (
    <PaymentForm 
      finalPrice={finalPrice}
      discountAmount={discountAmount}
      customerDetails={customerDetails} 
      handlePaymentSuccess={handlePaymentSuccess}
      currencySymbol={currencySymbol}
    />
  );
}