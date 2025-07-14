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
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import appleLogo from "@assets/apple_1752294500140.png";
import linkLogo from "@assets/Link_1752294500139.png";
import afterpayLogo from "@assets/Afterpay_Badge_BlackonMint_1752294624500.png";
import moneyBackGuarantee from "@assets/money-back-guarantee.png";


// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

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
                <span className="font-medium">{testimonial.name}</span>
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
              <p className="text-sm text-gray-600 mb-1">{testimonial.program}</p>
              <p className="text-sm">{testimonial.review}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#6B9CA3]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
          <img src={paymentLoaderGif} alt="Processing payment" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <p className="text-lg font-semibold">Processing your payment...</p>
          <p className="text-gray-600">Please don't close this window</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Combined Credit/Debit Card and Link Container */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {/* Credit/Debit Card Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="font-medium text-sm">Credit / Debit Card</span>
          <div className="flex space-x-1 ml-auto">
            <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-5" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a0aae7eba.svg" alt="Amex" className="h-5" />
          </div>
        </div>

        {/* Link Payment Section - White container within gray */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <img src={linkLogo} alt="Link" className="h-6 w-auto" />
            <div className="flex items-center text-gray-600 text-sm">
              <span>frazeradnam@gmail.com</span>
              <span className="ml-1">▼</span>
              <span className="ml-2">✕</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1 text-sm">
              <span className="mr-2">💳</span>
              Use •••• 0796
            </Button>
            <Button variant="outline" className="flex-1 text-sm">
              Pay another way
            </Button>
          </div>
        </div>
      </div>

      {/* PayPal Option */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="font-medium">Express Checkout</span>
          <div className="ml-auto">
            <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6" />
          </div>
        </div>
      </div>

      {/* Afterpay Option */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="font-medium">Afterpay</span>
          <div className="ml-auto">
            <img src={afterpayLogo} alt="Afterpay" className="h-6" />
          </div>
        </div>
      </div>

      {/* Express Payment Buttons */}
      <div className="space-y-3">
        {/* Apple Pay Button */}
        <Button className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-medium">Buy with </span>
          <img src={appleLogo} alt="Apple" className="ml-2 h-6 w-6" />
          <span className="text-white text-lg font-medium">Pay</span>
        </Button>

        {/* Google Pay Button */}
        <Button className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-lg flex items-center">
          <div className="flex items-center justify-center flex-1">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-white text-lg font-medium ml-2">Pay</span>
          </div>
          <div className="flex items-center text-sm border-l border-gray-500 pl-3 pr-4">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium mr-1">VISA</span>
            <span>•••• 0796</span>
          </div>
        </Button>

        {/* Link Button */}
        <Button className="w-full h-12 bg-green-500 text-white hover:bg-green-600 rounded-lg flex items-center">
          <div className="flex items-center justify-center flex-1">
            <img src={linkLogo} alt="Link" className="h-8 w-auto" />
          </div>
          <div className="flex items-center text-sm border-l border-green-700 pl-3 pr-4">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium mr-1">VISA</span>
            <span>0796</span>
          </div>
        </Button>
      </div>

      {/* OR Divider */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-gray-500 text-sm">— OR —</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Billing Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#6B9CA3]">BILLING DETAILS</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              id="firstName"
              value={billingDetails.firstName}
              onChange={(e) => handleBillingChange('firstName', e.target.value)}
              placeholder="First Name"
              className="h-12"
            />
          </div>
          <div>
            <Input
              id="lastName"
              value={billingDetails.lastName}
              onChange={(e) => handleBillingChange('lastName', e.target.value)}
              placeholder="Last Name"
              className="h-12"
            />
          </div>
        </div>
        
        <div>
          <Input
            id="phone"
            value={billingDetails.phone}
            onChange={(e) => handleBillingChange('phone', e.target.value)}
            placeholder="Phone number"
            className="h-12"
          />
        </div>
        
        <div>
          <GoogleMapsAutocomplete
            value={billingDetails.address}
            onChange={(value) => handleBillingChange('address', value)}
            placeholder="Start typing your address"
            className="h-12"
          />
        </div>
      </div>

      {/* Place Order Button */}
      <Button
        onClick={handleCardPayment}
        disabled={isProcessing || !billingDetails.firstName || !billingDetails.lastName}
        className="w-full bg-[#095D66] hover:bg-[#074952] text-white py-4 text-lg font-semibold rounded-lg h-12"
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
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });

  const originalPrice = regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  const finalPrice = appliedCoupon ? 
    appliedCoupon.amount_off ? parseFloat((originalPrice - (appliedCoupon.amount_off / 100)).toFixed(2)) :
    appliedCoupon.percent_off ? parseFloat((originalPrice * (1 - appliedCoupon.percent_off / 100)).toFixed(2)) :
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
  
  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const shouldShowEmailWarning = customerDetails.email && !isValidEmail(customerDetails.email);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-[#095D66] px-4 py-4" style={{ borderBottomWidth: '0.5px' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
          <p className="text-black font-medium text-lg ml-1" style={{ paddingLeft: '5px' }}>You're one step closer to better sleep for your baby!</p>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left Column - Your Details & Payment */}
          <div className="space-y-4">
            {/* Your Details Section */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">YOUR DETAILS</h2>
              
              <div className="space-y-3">
                <div>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleDetailsChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="h-12"
                  />
                  {shouldShowEmailWarning && (
                    <p className="text-red-500 text-sm mt-1">Is this correct?</p>
                  )}
                </div>
                
                <div>
                  <Input
                    id="dueDate"
                    type="date"
                    value={customerDetails.dueDate}
                    onChange={(e) => handleDetailsChange("dueDate", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Your Order Section */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#6B9CA3]">YOUR ORDER - {currencySymbol}{finalPrice.toFixed(2)}</h2>
                <ChevronUp className="h-5 w-5" />
              </div>
              
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
                  {appliedCoupon && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Discount ({appliedCoupon.name})</span>
                      <span className="text-sm text-green-600">
                        -{currencySymbol}{(appliedCoupon.amount_off ? 
                          (appliedCoupon.amount_off / 100).toFixed(2) : 
                          (originalPrice * appliedCoupon.percent_off / 100).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total (incl. GST)</span>
                    <span className="text-lg font-semibold">{currencySymbol}{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section - Always show */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">PAYMENT</h2>
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
          </div>

          {/* Right Column - Empty on desktop or additional content */}
          <div className="space-y-4 hidden lg:block">
            {/* This column can be used for additional content or left empty */}
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 mb-4 border border-teal-100">
          <div className="flex items-center space-x-3">
            <img src={moneyBackGuarantee} alt="30 Days Money Back Guarantee" className="h-12 w-12" />
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

          <TestimonialCarousel />
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