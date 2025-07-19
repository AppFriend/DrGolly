import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

// Initialize Stripe outside component to prevent recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Card element styling to match existing design
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
      padding: '12px',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: false,
};

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
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
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);
  
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'AU',
  });

  // Create payment intent immediately on component mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/create-checkout-new-payment-intent', {
          amount: 12000, // $120.00 AUD in cents
          currency: 'aud'
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentCreated(true);
        console.log('Payment intent created for new checkout:', data.paymentIntentId);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Payment Setup Error",
          description: "Unable to initialize payment. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [toast]);

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast({
        title: "Payment Not Ready",
        description: "Payment system is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!customerDetails.firstName || !customerDetails.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first name and email address.",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Payment Error",
        description: "Card information is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            email: customerDetails.email,
            phone: customerDetails.phone || undefined,
            address: {
              line1: customerDetails.address || undefined,
              city: customerDetails.city || undefined,
              postal_code: customerDetails.postcode || undefined,
              country: customerDetails.country || 'AU',
            },
          },
        },
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed.",
          variant: "destructive",
        });
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Complete the purchase on the backend
        const completionResponse = await apiRequest('POST', '/api/complete-checkout-new-purchase', {
          paymentIntentId: paymentIntent.id,
          customerDetails
        });
        
        const completionData = await completionResponse.json();
        
        toast({
          title: "Payment Successful!",
          description: "Your Big Baby Sleep Program purchase is complete.",
        });
        
        // Redirect to success page or course access
        window.location.href = '/courses';
        
      } else {
        toast({
          title: "Payment Processing",
          description: "Payment is being processed. Please wait.",
        });
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Big Baby Sleep Program
          </h1>
          <p className="text-gray-600">
            Complete your purchase to get instant access
          </p>
        </div>

        {/* Main checkout form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Checkout Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={customerDetails.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={customerDetails.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                
                <div>
                  <Label>Card Details *</Label>
                  <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
                    {paymentIntentCreated ? (
                      <CardElement options={cardElementOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-12 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading payment form...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Big Baby Sleep Program</span>
                    <span className="font-medium">$120.00 AUD</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>$120.00 AUD</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!stripe || !paymentIntentCreated || isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-lg font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  'Complete Purchase - $120.00 AUD'
                )}
              </Button>

              {!paymentIntentCreated && (
                <p className="text-center text-sm text-gray-500">
                  Setting up secure payment processing...
                </p>
              )}
            </form>
          </CardContent>
        </Card>
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