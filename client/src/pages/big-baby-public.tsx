import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, Star, Users, Clock, Award, CreditCard, Smartphone, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement, CardElement } from "@stripe/react-stripe-js";
import { CouponInput } from "@/components/CouponInput";
import { WelcomeBackPopup } from "@/components/WelcomeBackPopup";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Green Card_1752110693736.gif";


// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Big Baby course details
const BIG_BABY_COURSE = {
  id: 6,
  title: "Big baby sleep program",
  description: "4-8 Months",
  duration: 60,
  ageRange: "4-8 Months",
  thumbnailUrl: "https://25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818614506x569606633915210600/2.png",
  rating: 4.82,
  reviewCount: 92,
  category: "sleep",
  tier: "platinum"
};

// PaymentForm component
function PaymentForm({ 
  onSuccess, 
  coursePrice, 
  currencySymbol, 
  currency, 
  customerDetails, 
  appliedCoupon 
}: { 
  onSuccess: (paymentIntentId: string) => void;
  coursePrice: number;
  currencySymbol: string;
  currency: string;
  customerDetails: any;
  appliedCoupon: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const [billingDetails, setBillingDetails] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    country: 'Australia',
    city: '',
    postcode: ''
  });

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
      country: 'AU',
      currency: currency.toLowerCase(),
      total: {
        label: BIG_BABY_COURSE.title,
        amount: Math.round(coursePrice * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result && isMobile) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      
      try {
        const paymentData = await handleCreatePayment({
          email: ev.payerEmail,
          firstName: ev.payerName?.split(' ')[0] || '',
          lastName: ev.payerName?.split(' ').slice(1).join(' ') || '',
          dueDate: customerDetails.dueDate || ''
        });

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: paymentData.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/big-baby-public`,
          },
          redirect: 'if_required',
        });

        if (error) {
          throw error;
        }

        if (paymentIntent.status === 'succeeded') {
          await handleAccountCreation(paymentIntent.id);
          onSuccess(paymentIntent.id);
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Error",
          description: error.message || "Payment failed. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, elements, coursePrice, currency, isMobile, customerDetails]);

  const handleCreatePayment = async (customerInfo: any) => {
    const response = await fetch('/api/create-big-baby-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerDetails: customerInfo,
        couponId: appliedCoupon?.id
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create payment');
    return data;
  };

  const handleAccountCreation = async (paymentIntentId: string) => {
    const response = await fetch('/api/big-baby-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId,
        customerDetails: {
          ...customerDetails,
          ...billingDetails
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create account');
    }
    return response.json();
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const paymentData = await handleCreatePayment(customerDetails);
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${billingDetails.firstName} ${billingDetails.lastName}`,
            email: customerDetails.email,
            phone: billingDetails.phone,
            address: {
              line1: billingDetails.address,
              city: billingDetails.city,
              postal_code: billingDetails.postcode,
              country: billingDetails.country === 'Australia' ? 'AU' : 'US'
            }
          }
        }
      });

      if (error) throw error;

      if (paymentIntent.status === 'succeeded') {
        await handleAccountCreation(paymentIntent.id);
        onSuccess(paymentIntent.id);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingDetails(prev => ({ ...prev, [field]: value }));
  };

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg text-center">
          <img src={paymentLoaderGif} alt="Processing payment" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-semibold">Processing your payment...</p>
          <p className="text-gray-600">Please don't close this window</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Express Payment Buttons (Mobile Only) */}
      {isMobile && paymentRequest && (
        <div className="space-y-3">
          <div className="bg-black text-white rounded-lg p-4 flex items-center justify-center">
            <Smartphone className="h-5 w-5 mr-2" />
            <span className="font-medium">Pay with Apple Pay</span>
          </div>
          <PaymentRequestButtonElement
            options={{ paymentRequest }}
            className="StripeElement"
          />
        </div>
      )}

      {/* Payment Method Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link">🔗 Link</TabsTrigger>
          <TabsTrigger value="card">💳 Card</TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 text-white rounded-full p-2">
                <Check className="h-4 w-4" />
              </div>
              <span className="font-medium">Link - Pay with saved details</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Use your saved payment information for a faster checkout
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="card" className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Credit / Debit Card</span>
              <div className="flex space-x-1 text-xs text-gray-500">
                <span>Visa</span>
                <span>•</span>
                <span>Mastercard</span>
                <span>•</span>
                <span>Amex</span>
              </div>
            </div>
            
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
                },
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Billing Details */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Billing Details</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={billingDetails.firstName}
              onChange={(e) => handleBillingChange('firstName', e.target.value)}
              placeholder="First Name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={billingDetails.lastName}
              onChange={(e) => handleBillingChange('lastName', e.target.value)}
              placeholder="Last Name"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={billingDetails.phone}
            onChange={(e) => handleBillingChange('phone', e.target.value)}
            placeholder="Phone number"
          />
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={billingDetails.address}
            onChange={(e) => handleBillingChange('address', e.target.value)}
            placeholder="Start typing your address"
          />
        </div>
      </div>

      {/* Privacy Policy Statement */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
          <a href="/privacy" className="text-[#095D66] underline">privacy policy</a>.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          You will automatically be subscribed to emails so we can get you started with your course. You can unsubscribe any time once you're set up.
        </p>
      </div>

      {/* Place Order Button */}
      <Button
        onClick={handleCardPayment}
        disabled={isProcessing || !billingDetails.firstName || !billingDetails.lastName}
        className="w-full bg-[#095D66] hover:bg-[#074952] text-white py-4 text-lg font-semibold rounded-lg"
      >
        {isProcessing ? 'Processing...' : 'Place order'}
      </Button>
    </div>
  );
}

// Main component
export default function BigBabyPublic() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customerDetails, setCustomerDetails] = useState({
    email: "",
    firstName: "",
    dueDate: "",
  });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [orderExpanded, setOrderExpanded] = useState(false);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });

  const originalPrice = regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  const finalPrice = appliedCoupon ? 
    appliedCoupon.amountOff ? originalPrice - appliedCoupon.amountOff :
    appliedCoupon.percentOff ? originalPrice * (1 - appliedCoupon.percentOff / 100) :
    originalPrice : originalPrice;

  const handleDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Track Facebook Pixel purchase event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          value: finalPrice,
          currency: currency,
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
    } catch (error) {
      console.error('Post-payment error:', error);
    }
  };

  const canProceedToPayment = customerDetails.email && customerDetails.firstName;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-center">
        <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
      </div>

      {/* Success Banner */}
      <div className="bg-[#6B9CA3] text-white px-4 py-3 text-center">
        <p className="font-medium">You're one step closer to better sleep for your baby!</p>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Your Details Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Your Details</h2>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleDetailsChange("email", e.target.value)}
                placeholder="Enter your email"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={customerDetails.firstName}
                onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                placeholder="Enter your first name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date/Baby Birthday</Label>
              <Input
                id="dueDate"
                type="date"
                value={customerDetails.dueDate}
                onChange={(e) => handleDetailsChange("dueDate", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Your Order Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setOrderExpanded(!orderExpanded)}
          >
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Your Order - {currencySymbol}{finalPrice}</h2>
            </div>
            {orderExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
          
          {orderExpanded && (
            <div className="mt-4 space-y-4">
              <div className="flex items-start space-x-3">
                <img 
                  src={BIG_BABY_COURSE.thumbnailUrl} 
                  alt={BIG_BABY_COURSE.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{BIG_BABY_COURSE.title}</h3>
                  <p className="text-sm text-gray-600">{BIG_BABY_COURSE.description}</p>
                  <p className="text-sm font-medium">{currencySymbol}{originalPrice}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Coupon Input */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Have a coupon or gift card?</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <CouponInput
                  onCouponApplied={setAppliedCoupon}
                  originalPrice={originalPrice}
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total (incl. GST)</span>
                  <span className="text-lg font-semibold">{currencySymbol}{finalPrice}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Section */}
        {canProceedToPayment ? (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <Elements stripe={stripePromise}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                coursePrice={finalPrice}
                currencySymbol={currencySymbol}
                currency={currency}
                customerDetails={customerDetails}
                appliedCoupon={appliedCoupon}
              />
            </Elements>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-gray-600 text-center">
              Please enter your email and first name to continue to payment
            </p>
          </div>
        )}

        {/* Money Back Guarantee */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#6B9CA3] text-white rounded-full p-2">
              <span className="text-sm font-bold">30 DAYS</span>
            </div>
            <div>
              <p className="font-semibold">No results after completing the program?</p>
              <p className="text-sm text-gray-600">Get a full refund within 30 days! <Info className="h-4 w-4 inline ml-1" /></p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-xl font-semibold mb-4 text-center">Let customers speak for us</h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-[#6B9CA3] text-white p-6 rounded-lg">
              <div className="text-4xl font-bold">4.85</div>
              <div className="flex text-yellow-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Based on 775 reviews</p>
              <p className="text-sm text-gray-600">Excellent on Reviews</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center space-x-1 mb-2">
                <span className="font-medium">Sigourney S</span>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-1 mb-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Verified Customer</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Toddler sleep program</p>
              <p className="text-sm">
                Toddler sleep felt impossible, bedtime battles, night wakes, early starts... we were all exhausted. The Dr Golly Toddler Program gave us the tools (and confidence) to create calm, consistent routines that actually work. No crying it out, no power struggles, just simple, evidence...
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <a href="/contact" className="text-[#6B9CA3] hover:underline block">Contact & Support</a>
              <a href="/shipping" className="text-[#6B9CA3] hover:underline block">Shipping Policy</a>
              <a href="/terms" className="text-[#6B9CA3] hover:underline block">Terms of Service</a>
            </div>
            <div className="space-y-2">
              <a href="/privacy" className="text-[#6B9CA3] hover:underline block">Privacy Policy</a>
              <a href="/refunds" className="text-[#6B9CA3] hover:underline block">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>

      {showWelcomePopup && (
        <WelcomeBackPopup onClose={() => setShowWelcomePopup(false)} />
      )}
    </div>
  );
}