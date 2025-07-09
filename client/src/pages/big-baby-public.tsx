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
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Big Baby course details (hardcoded for marketing page)
const BIG_BABY_COURSE = {
  id: 6,
  title: "Big Baby Sleep Program",
  description: "4-8 Months",
  price: 120,
  duration: 60,
  ageRange: "4-8 Months",
  thumbnailUrl: "https://25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818614506x569606633915210600/2.png",
  rating: 4.9,
  reviewCount: 427,
  category: "sleep",
  tier: "platinum"
};

// Enhanced payment form component with Apple Pay support
function BigBabyPaymentForm({ onSuccess }: { onSuccess: () => void }) {
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
    if (!stripe || !elements) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: BIG_BABY_COURSE.title,
        amount: BIG_BABY_COURSE.price * 100, // Convert to cents
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
        // Confirm payment with the payment method from Apple Pay/Google Pay
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
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
          ev.complete('success');
          onSuccess();
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
  }, [stripe, elements, onSuccess, toast]);

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not available');
      return;
    }

    setIsProcessing(true);

    try {
      // First, submit the payment element to collect payment method
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Elements submit error:', submitError);
        toast({
          title: "Payment Failed",
          description: submitError.message || "Please check your payment details.",
          variant: "destructive",
        });
        return;
      }

      // Then confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/big-baby-public`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onSuccess();
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
    <div className="space-y-6">
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

      {/* Payment Form with Link and Card */}
      <form onSubmit={handleCardSubmit} className="space-y-4">
        <PaymentElement 
          options={{
            layout: "tabs",
            paymentMethodOrder: ["link", "card"]
          }}
        />
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-dr-teal hover:bg-dr-teal/90 h-12 text-base font-semibold"
        >
          {isProcessing ? "Processing..." : `Pay $${BIG_BABY_COURSE.price}`}
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

  // Create payment intent for anonymous users
  const createPaymentMutation = useMutation({
    mutationFn: async (data: { courseId: number; customerDetails: any }) => {
      const response = await apiRequest("POST", "/api/create-big-baby-payment", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    },
    onError: (error) => {
      toast({
        title: "Payment Setup Failed",
        description: "Unable to set up payment. Please try again.",
        variant: "destructive",
      });
    },
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
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePaymentSuccess = () => {
    setStep('success');
  };

  const handleCreateAccount = (interests: string[]) => {
    // Account creation is handled automatically by webhook
    // Just redirect to login
    handleAccountSetup();
  };

  const isDetailsComplete = customerDetails.firstName && customerDetails.email && isValidEmail(customerDetails.email);

  useEffect(() => {
    if (isDetailsComplete) {
      // Add a small delay to ensure user has finished typing
      const timer = setTimeout(() => {
        createPaymentMutation.mutate({ 
          courseId: BIG_BABY_COURSE.id, 
          customerDetails 
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isDetailsComplete]);

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
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
                    <span className="text-lg font-semibold">${BIG_BABY_COURSE.price}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">${BIG_BABY_COURSE.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Tax</span>
                    <span className="text-sm">$0</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>${BIG_BABY_COURSE.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            {clientSecret && isDetailsComplete ? (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0891b2', // dr-teal
                        }
                      }
                    }}
                  >
                    <BigBabyPaymentForm onSuccess={handlePaymentSuccess} />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Complete your details above to continue to payment</p>
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
  onComplete: (interests: string[]) => void; 
  customerDetails: any;
}) {
  const [interests, setInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [role, setRole] = useState("");
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
    if (interests.length > 0 && role && agreedToTerms) {
      onComplete(interests);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to access your course</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm text-gray-600 mb-3 block">What are you interested in? *</Label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map((interest) => (
                  <Button
                    key={interest}
                    variant={interests.includes(interest) ? "default" : "outline"}
                    onClick={() => handleInterestToggle(interest)}
                    className="h-auto py-3 px-4 text-sm"
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
                  placeholder="+1"
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
              <div className="grid grid-cols-2 gap-2">
                {["Parent", "Grandparent", "Caregiver", "Professional"].map((roleOption) => (
                  <Button
                    key={roleOption}
                    variant={role === roleOption ? "default" : "outline"}
                    onClick={() => setRole(roleOption)}
                    className="h-auto py-3 px-4 text-sm"
                  >
                    {roleOption}
                  </Button>
                ))}
              </div>
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
                  I agree to the Terms of Service and Privacy Policy *
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
              disabled={interests.length === 0 || !role || !agreedToTerms}
              className="w-full bg-dr-teal hover:bg-dr-teal/90"
            >
              Complete Setup & Access Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}