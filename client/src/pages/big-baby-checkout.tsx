import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, CreditCard, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import moneyBackGuarantee from "@assets/money-back-guarantee.png";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const BIG_BABY_COURSE = {
  id: 6,
  title: "Big baby sleep program",
  description: "A comprehensive sleep program designed specifically for babies over 6 months old",
  thumbnailUrl: "/attached_assets/IMG_5167_1752574749114.jpeg"
};

// Clean checkout form component
function CheckoutForm({ 
  onSuccess, 
  customerDetails, 
  appliedCoupon, 
  coursePrice, 
  currencySymbol, 
  currency 
}: {
  onSuccess: (paymentIntentId: string) => void;
  customerDetails: any;
  appliedCoupon: any;
  coursePrice: number;
  currencySymbol: string;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing || !isElementReady) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/big-baby-checkout`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "There was an issue processing your payment",
          variant: "destructive",
        });
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Complete the purchase
        const response = await apiRequest('POST', '/api/big-baby-complete-purchase', {
          paymentIntentId: paymentIntent.id,
          customerDetails,
          courseId: BIG_BABY_COURSE.id,
          finalPrice: coursePrice,
          currency,
          appliedCoupon
        });

        if (response.ok) {
          onSuccess(paymentIntent.id);
        } else {
          throw new Error('Failed to complete purchase');
        }
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "There was an issue processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          onReady={() => setIsElementReady(true)}
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: `${customerDetails.firstName} ${customerDetails.lastName}`,
                email: customerDetails.email
              }
            }
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <Button 
          type="submit"
          disabled={!stripe || !elements || isProcessing || !isElementReady}
          className="w-full bg-[#095D66] hover:bg-[#074952] text-white py-4 text-lg font-semibold rounded-lg h-12"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <img src={paymentLoaderGif} alt="Processing" className="h-6 w-6" />
              <span>Processing...</span>
            </div>
          ) : (
            `Pay ${currencySymbol}${coursePrice.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BigBabyCheckout() {
  const [location, setLocation] = useLocation();
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [pricing, setPricing] = useState({ price: 120, currency: 'USD', symbol: '$' });
  const { toast } = useToast();

  // Load customer details from localStorage
  useEffect(() => {
    const savedDetails = localStorage.getItem('big-baby-customer-details');
    const savedCoupon = localStorage.getItem('big-baby-applied-coupon');
    
    if (savedDetails) {
      setCustomerDetails(JSON.parse(savedDetails));
    }
    
    if (savedCoupon && savedCoupon !== 'null') {
      setAppliedCoupon(JSON.parse(savedCoupon));
    }
  }, []);

  // Create payment intent when customer details are loaded
  useEffect(() => {
    if (customerDetails && customerDetails.email && customerDetails.firstName) {
      createPaymentIntent();
    }
  }, [customerDetails, appliedCoupon]);

  const createPaymentIntent = async () => {
    try {
      const response = await apiRequest('POST', '/api/create-big-baby-payment-intent', {
        customerDetails,
        couponId: appliedCoupon?.id || appliedCoupon?.code,
        courseId: BIG_BABY_COURSE.id
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPricing({
          price: data.amount,
          currency: data.currency,
          symbol: data.currency === 'AUD' ? '$' : data.currency === 'USD' ? '$' : '€'
        });
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      toast({
        title: "Payment Setup Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Clear localStorage
    localStorage.removeItem('big-baby-customer-details');
    localStorage.removeItem('big-baby-applied-coupon');

    // Track Facebook Pixel purchase event
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: pricing.price,
        currency: pricing.currency,
        content_ids: [BIG_BABY_COURSE.id],
        content_type: 'product',
      });
    }

    toast({
      title: "Payment Successful!",
      description: "Your account has been created and you're now logged in.",
    });

    // Redirect to home page
    setLocation("/");
  };

  // Redirect if no customer details
  if (!customerDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to course information...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#095D66] mx-auto"></div>
        </div>
      </div>
    );
  }

  const finalPrice = appliedCoupon ? 
    appliedCoupon.amount_off ? pricing.price - (appliedCoupon.amount_off / 100) :
    appliedCoupon.percent_off ? pricing.price * (1 - appliedCoupon.percent_off / 100) :
    pricing.price : pricing.price;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-[#095D66] px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/big-baby-public')}
              className="text-[#095D66] hover:bg-[#095D66]/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
          </div>
          <h1 className="text-lg font-semibold text-[#095D66]">Secure Checkout</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#095D66]">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <img 
                    src={BIG_BABY_COURSE.thumbnailUrl} 
                    alt={BIG_BABY_COURSE.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{BIG_BABY_COURSE.title}</h3>
                    <p className="text-sm text-gray-600">{BIG_BABY_COURSE.description}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm">{pricing.symbol}{pricing.price.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Discount ({appliedCoupon.name})</span>
                      <span className="text-sm text-green-600">
                        -{pricing.symbol}{(pricing.price - finalPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">{pricing.symbol}{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#095D66]">Payment Information</h2>
              
              {clientSecret ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#095D66',
                        colorBackground: '#ffffff',
                        colorText: '#374151',
                        colorDanger: '#dc2626',
                        fontFamily: 'system-ui, sans-serif',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    onSuccess={handlePaymentSuccess}
                    customerDetails={customerDetails}
                    appliedCoupon={appliedCoupon}
                    coursePrice={finalPrice}
                    currencySymbol={pricing.symbol}
                    currency={pricing.currency}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#095D66] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading payment options...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Money Back Guarantee */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <img src={moneyBackGuarantee} alt="30 Days Money Back Guarantee" className="h-12 w-12" />
                <div>
                  <p className="font-semibold text-[#095D66]">30-Day Money Back Guarantee</p>
                  <p className="text-sm text-gray-600">No results after completing the program? Get a full refund!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}