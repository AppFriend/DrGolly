import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, CreditCard, Smartphone, Info, Star, Users, Clock, Award, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CouponInput } from "@/components/CouponInput";
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

// Testimonial data
const testimonials = [
  {
    name: "Kristiana E",
    review: "Dr Golly's program has helped me get my baby to have much more quality and long lasting sleeps. I'm so happy that I stumbled across this program especially as a new parent.",
    program: "Big baby sleep program"
  },
  {
    name: "Sigourney S", 
    review: "Toddler sleep felt impossible, bedtime battles, night wakes, early starts... we were all exhausted. The Dr Golly Toddler Program gave us the tools (and confidence) to create calm, consistent routines that actually work.",
    program: "Toddler sleep program"
  },
  {
    name: "Sarah M",
    review: "Within 3 days of implementing the techniques, our 6-month-old was sleeping through the night. The program is clear, evidence-based, and actually works!",
    program: "Big baby sleep program"
  },
  {
    name: "Jennifer L",
    review: "I was skeptical at first, but Dr Golly's approach is so gentle and effective. My toddler now goes to bed without fights and sleeps 11 hours straight!",
    program: "Toddler sleep program"
  }
];

// TestimonialCarousel Component
function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-full flex-shrink-0 border-b pb-4">
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-2 text-sm leading-relaxed">"{testimonial.review}"</p>
              <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
              <p className="text-xs text-gray-500">{testimonial.program}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#095D66]' : 'bg-gray-300'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ 
  customerDetails, 
  appliedCoupon, 
  pricing, 
  onSuccess 
}: {
  customerDetails: any;
  appliedCoupon: any;
  pricing: { price: number; currency: string; symbol: string };
  onSuccess: (paymentIntentId: string) => void;
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
          finalPrice: pricing.price,
          currency: pricing.currency,
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
            `Pay ${pricing.symbol}${pricing.price.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BigBabyCheckout() {
  const [location, setLocation] = useLocation();
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dueDate: ''
  });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [pricing, setPricing] = useState({ price: 120, currency: 'USD', symbol: '$' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  // Validate form to show payment section
  const isFormValid = customerDetails.firstName && customerDetails.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email);

  // Create payment intent when form is valid
  useEffect(() => {
    if (isFormValid) {
      createPaymentIntent();
    }
  }, [customerDetails, appliedCoupon, isFormValid]);

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
        setShowPaymentForm(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={drGollyLogo} 
              alt="Dr Golly Sleep" 
              className="h-8"
            />
            <div className="w-9" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <img 
              src={BIG_BABY_COURSE.thumbnailUrl} 
              alt={BIG_BABY_COURSE.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">{BIG_BABY_COURSE.title}</h1>
              <p className="text-sm text-gray-600">{BIG_BABY_COURSE.description}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={customerDetails.firstName}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={customerDetails.lastName}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={customerDetails.dueDate}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Coupon Input */}
        <Card>
          <CardContent className="pt-6">
            <CouponInput
              onCouponApplied={(coupon) => setAppliedCoupon(coupon)}
              onCouponRemoved={() => setAppliedCoupon(null)}
            />
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Course Price</span>
                <span className="font-medium">{pricing.symbol}120.00</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount ({appliedCoupon.name})</span>
                  <span>-{pricing.symbol}{(120 - pricing.price).toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{pricing.symbol}{pricing.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        {showPaymentForm && clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#095D66',
                    }
                  }
                }}
              >
                <PaymentForm 
                  customerDetails={customerDetails}
                  appliedCoupon={appliedCoupon}
                  pricing={pricing}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Money Back Guarantee */}
        <div className="text-center py-4">
          <img 
            src={moneyBackGuarantee} 
            alt="30-day money-back guarantee" 
            className="h-16 mx-auto mb-2"
          />
          <p className="text-sm text-gray-600">30-day money-back guarantee</p>
        </div>

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">What Parents Say</CardTitle>
          </CardHeader>
          <CardContent>
            <TestimonialCarousel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}