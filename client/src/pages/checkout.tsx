import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, Star, Users, Clock, Award, CreditCard, Smartphone, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useStripe, useElements, PaymentRequestButtonElement, CardElement } from "@stripe/react-stripe-js";
import { CouponInput } from "@/components/CouponInput";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Green Card_1752110693736.gif";
import appleLogo from "@assets/apple_1752294500140.png";
import linkLogo from "@assets/Link_1752294500139.png";
import afterpayLogo from "@assets/Afterpay_Badge_BlackonMint_1752294624500.png";
import type { Course } from "@shared/schema";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// PaymentForm component
function PaymentForm({ 
  coursePrice, 
  currencySymbol, 
  currency, 
  customerDetails, 
  appliedCoupon,
  course,
  onSuccess
}: { 
  coursePrice: number;
  currencySymbol: string;
  currency: string;
  customerDetails: any;
  appliedCoupon: any;
  course: Course;
  onSuccess: () => void;
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
    if (!stripe || !elements || coursePrice <= 0 || !course?.title) return;

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: currency.toLowerCase(),
      total: {
        label: course.title,
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
            return_url: `${window.location.origin}/checkout/${course.id}`,
          },
          redirect: 'if_required',
        });

        if (error) {
          throw error;
        }

        if (paymentIntent.status === 'succeeded') {
          onSuccess();
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
  }, [stripe, elements, coursePrice, currency, isMobile, customerDetails, course]);

  const handleCreatePayment = async (customerInfo: any) => {
    const response = await apiRequest('/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        courseId: course.id,
        customerDetails: customerInfo,
        couponId: appliedCoupon?.id
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }
    return response;
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
        onSuccess();
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
            <span className="font-medium">Buy with </span>
            <img src={appleLogo} alt="Apple" className="mx-2 h-6 w-6" />
            <span className="font-medium">Pay</span>
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
          <TabsTrigger value="link" className="flex items-center justify-center">
            <img src={linkLogo} alt="Link" className="h-5 w-auto" />
          </TabsTrigger>
          <TabsTrigger value="card">💳 Card</TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <img src={linkLogo} alt="Link" className="h-16 w-auto" />
            </div>
            <p className="text-sm text-gray-600 text-center">
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

export default function Checkout() {
  const [, params] = useRoute("/checkout/:courseId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.firstName || "",
    email: user?.email || "",
    dueDate: "",
  });
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });

  const courseId = params?.courseId ? parseInt(params.courseId) : null;
  const originalPrice = regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  // Calculate final price with coupon
  const finalPrice = appliedCoupon ? 
    appliedCoupon.amountOff ? originalPrice - (appliedCoupon.amountOff / 100) :
    appliedCoupon.percentOff ? originalPrice * (1 - appliedCoupon.percentOff / 100) :
    originalPrice : originalPrice;

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const handleBack = () => {
    setLocation("/courses");
  };

  const handleDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Your course has been added to your account.",
    });
    setLocation("/courses");
  };

  // Handle case where no courseId is provided
  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Course</h1>
          <p className="text-gray-600 mb-6">No course specified for checkout.</p>
          <Button onClick={() => setLocation("/courses")} className="bg-[#095D66] hover:bg-[#074952]">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const canProceedToPayment = customerDetails.email && customerDetails.firstName;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
        </div>
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
                  src={course.thumbnailUrl || "https://via.placeholder.com/64x64"} 
                  alt={course.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.description}</p>
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
                  onCouponRemoved={() => setAppliedCoupon(null)}
                  appliedCoupon={appliedCoupon}
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
        {canProceedToPayment && course ? (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <Elements stripe={stripePromise}>
              <PaymentForm
                coursePrice={finalPrice}
                currencySymbol={currencySymbol}
                currency={currency}
                customerDetails={customerDetails}
                appliedCoupon={appliedCoupon}
                course={course}
                onSuccess={handlePaymentSuccess}
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
                <span className="font-medium">Kristiana E</span>
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
              <p className="text-sm">
                Dr Golly's program has helped me get my baby to have much more quality and long lasting sleeps. I'm so happy that I stumbled across this program especially as a new parents.
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
    </div>
  );
}