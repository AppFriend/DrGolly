import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Card element options for standalone credit card fields
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '12px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'AU'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent when component loads
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-checkout-new-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 12000, // $120.00 in cents
            currency: 'aud',
          }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [toast]);

  const handleDetailsChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast({
        title: "Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Error",
        description: "Payment form not found. Please refresh the page.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: {
              line1: customerDetails.address,
              city: customerDetails.city,
              postal_code: customerDetails.postcode,
              country: customerDetails.country,
            },
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Your purchase has been completed successfully!",
        });
        
        // Complete the purchase on the backend
        await fetch('/api/complete-checkout-new-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerDetails,
          }),
        });
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-8">Checkout</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={customerDetails.email}
                  onChange={(e) => handleDetailsChange('email', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Phone number"
                  value={customerDetails.phone}
                  onChange={(e) => handleDetailsChange('phone', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="First name"
                  value={customerDetails.firstName}
                  onChange={(e) => handleDetailsChange('firstName', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={customerDetails.lastName}
                  onChange={(e) => handleDetailsChange('lastName', e.target.value)}
                />
              </div>

              <Input
                type="text"
                placeholder="Address"
                value={customerDetails.address}
                onChange={(e) => handleDetailsChange('address', e.target.value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  placeholder="City"
                  value={customerDetails.city}
                  onChange={(e) => handleDetailsChange('city', e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Postcode"
                  value={customerDetails.postcode}
                  onChange={(e) => handleDetailsChange('postcode', e.target.value)}
                />
                <select
                  value={customerDetails.country}
                  onChange={(e) => handleDetailsChange('country', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="AU">Australia</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="NZ">New Zealand</option>
                </select>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Information</h2>
              
              {/* Standalone Stripe Card Element */}
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !clientSecret || isProcessing}
              className="w-full h-12 bg-[#6B9CA3] hover:bg-[#5a8289] text-white font-semibold"
            >
              {isProcessing ? 'Processing...' : 'Complete Purchase - $120.00'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutNew() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}