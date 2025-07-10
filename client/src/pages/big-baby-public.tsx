import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, Star, Users, Clock, Award, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement, CardElement } from "@stripe/react-stripe-js";
import { CouponInput } from "@/components/CouponInput";
import { WelcomeBackPopup } from "@/components/WelcomeBackPopup";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Green Card_1752110693736.gif";
import { FacebookPixel } from "@/lib/facebook-pixel";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Big Baby course details (hardcoded for marketing page)
const BIG_BABY_COURSE = {
  id: 6,
  title: "Big Baby Sleep Program",
  description: "4-8 Months",
  duration: 60,
  ageRange: "4-8 Months",
  thumbnailUrl: "https://25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818614506x569606633915210600/2.png",
  rating: 4.9,
  reviewCount: 427,
  category: "sleep",
  tier: "platinum"
};

// Enhanced payment form component with Apple Pay support
function BigBabyPaymentForm({ onSuccess, coursePrice, currencySymbol, currency, customerDetails, appliedCoupon }: { 
  onSuccess: () => void,
  coursePrice: number,
  currencySymbol: string,
  currency: string,
  customerDetails: any,
  appliedCoupon: any
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Apple Pay / Payment Request
  useEffect(() => {
    if (!stripe || !elements || coursePrice <= 0) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: {
        label: BIG_BABY_COURSE.title,
        amount: Math.round(coursePrice * 100), // Convert to cents with proper rounding
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Payment Request is available (Apple Pay, Google Pay, etc.)
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      
      try {
        // Get customer details from payment request
        const customerDetails = {
          email: ev.payerEmail,
          firstName: ev.payerName?.split(' ')[0] || '',
          lastName: ev.payerName?.split(' ').slice(1).join(' ') || '',
          dueDate: ''
        };

        // Create payment intent only when user is ready to pay (Apple Pay/Google Pay button clicked)
        const paymentResponse = await fetch('/api/create-big-baby-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerDetails,
            couponId: appliedCoupon?.id
          }),
        });

        const paymentData = await paymentResponse.json();
        
        if (!paymentResponse.ok) {
          throw new Error(paymentData.message || 'Failed to create payment');
        }

        // Confirm payment with the payment method from Apple Pay/Google Pay
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: paymentData.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/big-baby-public`,
          },
          redirect: 'if_required',
        });

        if (error) {
          console.error('Payment Request API error:', error);
          ev.complete('fail');
          toast({
            title: "Payment Failed",
            description: error.message || "Please try again.",
            variant: "destructive",
          });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Track Facebook Pixel Purchase conversion
          const finalAmount = paymentData.finalAmount ? paymentData.finalAmount / 100 : coursePrice;
          FacebookPixel.trackPurchase(6, BIG_BABY_COURSE.title, finalAmount, currency);
          
          ev.complete('success');
          onSuccess(paymentIntent.id);
        }
      } catch (err) {
        console.error('Payment Request API exception:', err);
        ev.complete('fail');
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, elements, onSuccess, toast, coursePrice, currency, appliedCoupon]);

  // Update payment request when price changes
  useEffect(() => {
    if (paymentRequest && coursePrice > 0) {
      paymentRequest.update({
        total: {
          label: BIG_BABY_COURSE.title,
          amount: Math.round(coursePrice * 100), // Convert to cents with proper rounding
        },
      });
    }
  }, [paymentRequest, coursePrice]);

  const handleCardSubmit = async (event: React.FormEvent, customerDetails: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not available');
      return;
    }

    setIsProcessing(true);

    try {
      // Track initiate checkout
      FacebookPixel.trackInitiatePurchase(6, BIG_BABY_COURSE.title, coursePrice, currency);
      
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment intent when user clicks submit
      const paymentResponse = await fetch('/api/create-big-baby-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerDetails,
          couponId: appliedCoupon?.id
        }),
      });

      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || 'Failed to create payment');
      }

      // Confirm payment with card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${customerDetails.firstName} ${customerDetails.lastName}`,
              email: customerDetails.email,
            },
          },
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Track Facebook Pixel Purchase conversion
        const finalAmount = paymentData.finalAmount ? paymentData.finalAmount / 100 : coursePrice;
        FacebookPixel.trackPurchase(6, BIG_BABY_COURSE.title, finalAmount, currency);
        
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment exception:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <img
              src={paymentLoaderGif}
              alt="Processing payment..."
              className="w-24 h-24 mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-gray-700">Processing Payment...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we process your payment</p>
          </div>
        </div>
      )}
      
      {/* Express Payment Methods Row - Only show if mobile for Apple Pay */}
      {isMobile && paymentRequest && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Complete your payment fast with</p>
          </div>
          
          <div className="w-full">
            {/* Apple Pay - only show on mobile */}
            <div className="bg-black rounded-lg p-3 hover:bg-gray-800 transition-colors">
              <PaymentRequestButtonElement 
                options={{ paymentRequest }}
                className="w-full h-8"
              />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form with Card */}
      <form onSubmit={(e) => handleCardSubmit(e, customerDetails)} className="space-y-4">
        <div className="p-4 border rounded-lg bg-white">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-dr-teal hover:bg-dr-teal/90 h-12 text-base font-semibold"
        >
          {isProcessing ? "Processing..." : `Pay ${currencySymbol}${coursePrice}`}
        </Button>
      </form>
    </div>
  );
}

export default function BigBabyPublic() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'checkout' | 'success' | 'signup'>('checkout');
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dueDate: "",
  });
  const [regionalPricing, setRegionalPricing] = useState<any>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [showWelcomeBackPopup, setShowWelcomeBackPopup] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState("");

  // Fetch regional pricing
  const { data: pricingData } = useQuery({
    queryKey: ['/api/regional-pricing'],
  });

  useEffect(() => {
    if (pricingData) {
      setRegionalPricing(pricingData);
    }
  }, [pricingData]);

  // Get pricing details
  const originalPrice = regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  // Calculate final price with coupon discount
  useEffect(() => {
    let calculatedPrice = originalPrice;
    
    if (appliedCoupon) {
      if (appliedCoupon.percent_off) {
        calculatedPrice = originalPrice * (1 - appliedCoupon.percent_off / 100);
      } else if (appliedCoupon.amount_off) {
        calculatedPrice = Math.max(0, originalPrice - (appliedCoupon.amount_off / 100));
      }
    }
    
    // Round to 2 decimal places to avoid floating point precision issues
    setFinalPrice(Math.round(calculatedPrice * 100) / 100);
  }, [originalPrice, appliedCoupon]);

  // Removed automatic payment intent creation to prevent incomplete transactions in Stripe

  const completeSignupMutation = useMutation({
    mutationFn: async ({ customerDetails, interests, password, paymentIntentId }: { 
      customerDetails: any, 
      interests: string[], 
      password: string,
      paymentIntentId: string 
    }) => {
      console.log('Starting account creation with payment intent:', paymentIntentId);
      console.log('Customer details:', customerDetails);
      console.log('Selected interests:', interests);
      
      const response = await apiRequest('POST', '/api/create-account-with-purchase', {
        customerDetails,
        interests,
        password,
        paymentIntentId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Account creation failed:', errorData);
        throw new Error(errorData.message || 'Account creation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Account created successfully:', data);
      toast({
        title: "Account Created Successfully!",
        description: "You can now log in with your email and password.",
      });
      // Redirect to login page after short delay
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error) => {
      console.error('Account creation error:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    }
  });

  // Handle post-payment account setup
  const handleAccountSetup = () => {
    toast({
      title: "Payment Successful!",
      description: "Check your email for login instructions. Your course is ready!",
    });
    // Redirect to login page after short delay
    setTimeout(() => {
      setLocation("/login");
    }, 3000);
  };

  const handleDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check if email exists when user types email
    if (field === 'email' && value.includes('@')) {
      checkEmailExists(value);
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/check-existing-account', { email });
      const data = await response.json();
      
      if (data.exists) {
        setExistingUserEmail(email);
        setShowWelcomeBackPopup(true);
      }
    } catch (error) {
      // Email doesn't exist, continue with signup
    }
  };

  const handleWelcomeBackLogin = () => {
    setShowWelcomeBackPopup(false);
    setLocation("/checkout");
  };

  const handleWelcomeBackReset = () => {
    setShowWelcomeBackPopup(false);
    setLocation("/reset-password?from=checkout");
  };

  const handleWelcomeBackClose = () => {
    setShowWelcomeBackPopup(false);
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePaymentSuccess = (successfulPaymentIntentId?: string) => {
    // Update payment intent ID with the successful one
    if (successfulPaymentIntentId) {
      setPaymentIntentId(successfulPaymentIntentId);
    }
    setStep('success');
  };

  const handleCreateAccount = (interests: string[], password: string, phoneNumber: string, role: string) => {
    // Complete signup by creating account with phone number and role
    const updatedCustomerDetails = {
      ...customerDetails,
      phone: phoneNumber,
      role: role
    };
    
    completeSignupMutation.mutate({ 
      customerDetails: updatedCustomerDetails, 
      interests,
      password,
      paymentIntentId: paymentIntentId 
    });
  };

  const isDetailsComplete = customerDetails.firstName && customerDetails.email && isValidEmail(customerDetails.email);
  
  // Check individual validation states for better user feedback
  const hasValidFirstName = customerDetails.firstName.trim().length > 0;
  const hasValidEmail = customerDetails.email.trim().length > 0 && isValidEmail(customerDetails.email);

  // Only create payment intent when user is ready to pay, not when details are complete
  const createPaymentIntentForPayment = async () => {
    if (!isDetailsComplete) return null;
    
    try {
      const response = await apiRequest("POST", "/api/create-big-baby-payment", {
        courseId: BIG_BABY_COURSE.id,
        customerDetails,
        couponId: appliedCoupon?.id
      });
      const data = await response.json();
      
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      
      if (data.finalAmount) {
        setFinalPrice(data.finalAmount / 100);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return null;
    }
  };

  if (step === 'success') {
    return <SuccessPage onContinue={() => setStep('signup')} />;
  }

  if (step === 'signup') {
    return <SignupFlow onComplete={handleCreateAccount} customerDetails={customerDetails} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={drGollyLogo} 
                alt="Dr. Golly" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              30-Day Money Back Guarantee
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Course Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {BIG_BABY_COURSE.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {BIG_BABY_COURSE.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{BIG_BABY_COURSE.rating}</span>
                  <span>({BIG_BABY_COURSE.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{BIG_BABY_COURSE.duration} minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{BIG_BABY_COURSE.ageRange}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout */}
          <div className="space-y-6">
            {/* 1. Complete Your Purchase */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm text-gray-600">First Name *</Label>
                      <Input
                        id="firstName"
                        value={customerDetails.firstName}
                        onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                        className="mt-1"
                        placeholder="First Name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName" className="text-sm text-gray-600">Last Name</Label>
                      <Input
                        id="lastName"
                        value={customerDetails.lastName}
                        onChange={(e) => handleDetailsChange("lastName", e.target.value)}
                        className="mt-1"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-600">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleDetailsChange("email", e.target.value)}
                      className="mt-1"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate" className="text-sm text-gray-600">Baby's Birthday / Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={customerDetails.dueDate}
                      onChange={(e) => handleDetailsChange("dueDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={BIG_BABY_COURSE.thumbnailUrl}
                    alt={BIG_BABY_COURSE.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{BIG_BABY_COURSE.title}</h3>
                    <p className="text-sm text-gray-600">Digital Course</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">{BIG_BABY_COURSE.rating} ({BIG_BABY_COURSE.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {appliedCoupon && (
                      <div className="text-sm text-gray-500 line-through">
                        {currencySymbol}{originalPrice}
                      </div>
                    )}
                    <span className="text-lg font-semibold">{currencySymbol}{finalPrice || originalPrice}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">{currencySymbol}{originalPrice}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-green-600">
                        Discount ({appliedCoupon.name})
                      </span>
                      <span className="text-sm text-green-600">
                        -{currencySymbol}{(originalPrice - (finalPrice || originalPrice)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Tax</span>
                    <span className="text-sm">$0</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>{currencySymbol}{finalPrice || originalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Coupon Code */}
            <Card>
              <CardHeader>
                <CardTitle>Coupon Code</CardTitle>
              </CardHeader>
              <CardContent>
                <CouponInput
                  onCouponApplied={setAppliedCoupon}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                  appliedCoupon={appliedCoupon}
                  disabled={false}
                />
              </CardContent>
            </Card>

            {/* Payment Section */}
            {isDetailsComplete ? (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0891b2', // dr-teal
                        }
                      }
                    }}
                  >
                    <BigBabyPaymentForm 
                      onSuccess={handlePaymentSuccess} 
                      coursePrice={finalPrice || originalPrice}
                      currencySymbol={currencySymbol}
                      currency={currency}
                      customerDetails={customerDetails}
                      appliedCoupon={appliedCoupon}
                    />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="text-sm font-medium mb-2">Complete your details above to continue to payment</p>
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center justify-center gap-1 ${hasValidFirstName ? 'text-green-600' : 'text-gray-400'}`}>
                        {hasValidFirstName ? '✓' : '○'} First name required
                      </div>
                      <div className={`flex items-center justify-center gap-1 ${hasValidEmail ? 'text-green-600' : 'text-gray-400'}`}>
                        {hasValidEmail ? '✓' : '○'} Valid email address required
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. 30-Day Money Back Guarantee */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-center">
                  <Shield className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">30-Day Money Back Guarantee</p>
                    <p className="text-xs text-gray-500">If you're not satisfied, get a full refund within 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 4. Customer Reviews */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50"
                    alt="Sarah M"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">Sarah M</span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      "This program transformed our nights! My 5-month-old went from waking every 2 hours to sleeping through the night in just one week."
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b9c42d68?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50"
                    alt="Emma R"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">Emma R</span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      "Dr. Golly's approach is so gentle yet effective. Finally, a sleep program that actually works!"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5. What You'll Learn */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-dr-teal" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Sleep training techniques for 4-8 month olds</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Establishing healthy sleep patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Managing sleep regressions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Creating the perfect sleep environment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Gentle sleep training methods</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Welcome Back Popup */}
      <WelcomeBackPopup
        isOpen={showWelcomeBackPopup}
        onClose={handleWelcomeBackClose}
        userEmail={existingUserEmail}
        firstName={customerDetails.firstName}
        onLoginSuccess={handleWelcomeBackLogin}
        onPasswordReset={handleWelcomeBackReset}
      />
    </div>
  );
}

// Success Page Component
function SuccessPage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to Dr. Golly! Your Big Baby Sleep Program is ready for you.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Complete your profile setup to access your course and start your sleep journey!
          </p>
        </div>
        
        <Button 
          onClick={onContinue}
          className="w-full bg-dr-teal hover:bg-dr-teal/90"
        >
          Complete Your Profile
        </Button>
      </div>
    </div>
  );
}

// Signup Flow Component
function SignupFlow({ onComplete, customerDetails }: { 
  onComplete: (interests: string[], password: string, phoneNumber: string, role: string) => void; 
  customerDetails: any;
}) {
  const [interests, setInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+61");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const interestOptions = [
    "Baby Sleep",
    "Toddler Sleep", 
    "Toddler Behaviour",
    "Partner Discounts"
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = () => {
    if (interests.length > 0 && role && agreedToTerms && password && password === confirmPassword) {
      // Pass phone number in proper format
      const phoneNumber = countryCode + phone;
      onComplete(interests, password, phoneNumber, role);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={drGollyLogo} 
                alt="Dr. Golly" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              30-Day Money Back Guarantee
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to access your course</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm text-gray-600 mb-3 block">What are you interested in? *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <Button
                    key={interest}
                    variant={interests.includes(interest) ? "default" : "outline"}
                    onClick={() => handleInterestToggle(interest)}
                    className={`h-auto py-3 px-4 text-sm ${
                      interests.includes(interest) 
                        ? "bg-[#095D66] hover:bg-[#095D66]/90 text-white" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {interest}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20"
                  placeholder="+61"
                />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600 mb-2 block">I am a *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Parent", "Grandparent", "Caregiver", "Professional"].map((roleOption) => (
                  <Button
                    key={roleOption}
                    variant={role === roleOption ? "default" : "outline"}
                    onClick={() => setRole(roleOption)}
                    className={`h-auto py-3 px-4 text-sm ${
                      role === roleOption 
                        ? "bg-[#095D66] hover:bg-[#095D66]/90 text-white" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {roleOption}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Create Password *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  I agree to the <a href="/terms" target="_blank" className="text-[#095D66] hover:underline">Terms of Service</a> and Privacy Policy *
                </span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  I'd like to receive marketing emails and updates
                </span>
              </label>
            </div>

            <Button 
              onClick={handleComplete}
              disabled={interests.length === 0 || !role || !agreedToTerms || !password || password !== confirmPassword}
              className="w-full bg-[#095D66] hover:bg-[#095D66]/90 text-white"
            >
              Complete Setup & Access Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}