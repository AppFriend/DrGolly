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
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import appleLogo from "@assets/apple_1752294500140.png";
import linkLogo from "@assets/Link_1752294500139.png";
import afterpayLogo from "@assets/Afterpay_Badge_BlackonMint_1752294624500.png";
import moneyBackGuarantee from "@assets/money-back-guarantee.png";
import book1Image from "@assets/IMG_5430_1752370946458.jpeg";
import book2Image from "@assets/IMG_5431_1752370946459.jpeg";
import type { Course, CartItem, ShoppingProduct } from "@shared/schema";

// Product images mapping
const productImages: Record<number, string> = {
  1: book1Image,
  2: book2Image,
};

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Simple card-only payment component
function SimpleCardPayment({ 
  coursePrice, 
  currencySymbol, 
  currency, 
  customerDetails, 
  course,
  onSuccess
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    firstName: customerDetails.firstName || '',
    lastName: customerDetails.lastName || '',
    phone: customerDetails.phone || '',
    address: customerDetails.address || '',
    country: 'Australia',
    city: customerDetails.city || '',
    postcode: customerDetails.zipCode || ''
  });

  const handleBillingChange = (field: string, value: string) => {
    setBillingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!customerDetails.email || !customerDetails.firstName) {
      toast({
        title: "Missing Information",
        description: "Please fill in your email and first name.",
        variant: "destructive",
      });
      return;
    }

    if (!billingDetails.firstName || !billingDetails.lastName) {
      toast({
        title: "Missing Billing Details",
        description: "Please fill in your billing first and last name.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create payment intent
      const response = await apiRequest('POST', '/api/create-course-payment', {
        courseId: course?.id,
        email: customerDetails.email,
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName || customerDetails.firstName,
        currency,
        amount: coursePrice
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
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

      if (error) {
        throw error;
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Your course has been purchased successfully.",
        });
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

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Payment Method</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>
        
        <div className="p-4 border rounded-lg">
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
          
          <div className="border rounded-lg p-4 bg-white">
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
                hidePostalCode: false,
              }}
            />
          </div>
        </div>
      </div>

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
            placeholder="Address"
          />
        </div>
      </div>

      {/* Place Order Button */}
      <form onSubmit={handlePayment}>
        <Button
          type="submit"
          disabled={isProcessing || !billingDetails.firstName || !billingDetails.lastName}
          className="w-full bg-[#095D66] hover:bg-[#074952] text-white py-4 text-lg font-semibold rounded-lg"
        >
          {isProcessing ? 'Processing...' : 'Place order'}
        </Button>
      </form>
    </div>
  );
}

// PaymentForm component
export function PaymentForm({ 
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
  course: Course | null;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Removed activeTab state since we removed tabs
  const [billingDetails, setBillingDetails] = useState({
    firstName: customerDetails.firstName || '',
    lastName: customerDetails.lastName || '',
    phone: customerDetails.phone || '',
    address: customerDetails.address || '',
    country: 'Australia',
    city: customerDetails.city || '',
    postcode: customerDetails.zipCode || ''
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update billing details when customer details change
  useEffect(() => {
    setBillingDetails(prev => ({
      ...prev,
      firstName: customerDetails.firstName || prev.firstName,
      lastName: customerDetails.lastName || prev.lastName,
      phone: customerDetails.phone || prev.phone,
      address: customerDetails.address || prev.address,
      city: customerDetails.city || prev.city,
      postcode: customerDetails.zipCode || prev.postcode
    }));
  }, [customerDetails]);

  // Initialize Apple Pay / Payment Request
  useEffect(() => {
    if (!stripe || !elements || coursePrice <= 0) return;

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: currency.toLowerCase(),
      total: {
        label: course?.title || 'Cart Purchase',
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
            return_url: `${window.location.origin}/courses`,
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
    // Handle cart checkout vs direct purchase
    if (course && course.id) {
      // Direct course purchase
      const response = await apiRequest('POST', '/api/create-course-payment', {
        courseId: course.id,
        customerDetails: customerInfo,
        couponId: appliedCoupon?.id
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      return response.json();
    } else {
      // Cart checkout
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: coursePrice,
        currency: currency.toLowerCase(),
        items: [{
          type: 'cart',
          cartItems: [] // Cart items will be fetched on backend
        }],
        customerDetails: customerInfo,
        couponId: appliedCoupon?.id
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      return response.json();
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || isProcessing) return;

    // Validate required fields
    if (!customerDetails.email || !customerDetails.firstName) {
      toast({
        title: "Missing Information",
        description: "Please fill in your email and first name.",
        variant: "destructive",
      });
      return;
    }

    if (!billingDetails.firstName || !billingDetails.lastName) {
      toast({
        title: "Missing Billing Details",
        description: "Please fill in your billing first and last name.",
        variant: "destructive",
      });
      return;
    }

    // Give a moment for the card element to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsProcessing(true);
    
    try {
      const paymentData = await handleCreatePayment(customerDetails);
      
      // Wait for elements to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        console.error('Card element not found. Available elements:', elements);
        console.error('Elements object:', elements);
        console.error('Payment method: Card (no tabs)');
        throw new Error('Card element not found. Please ensure you are on the card payment tab.');
      }

      console.log('Card element found:', cardElement);

      console.log('Payment data:', paymentData);
      console.log('Customer details:', customerDetails);
      console.log('Billing details:', billingDetails);

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

      if (error) {
        console.error('Stripe error:', error);
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

      {/* Payment Method */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Payment Method</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>
        
        <div className="p-4 border rounded-lg">
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
          
          <div className="border rounded-lg p-4 bg-white">
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
                hidePostalCode: false,
              }}
            />
          </div>
        </div>
      </div>

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
          <GoogleMapsAutocomplete
            value={billingDetails.address}
            onChange={(value) => handleBillingChange('address', value)}
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
      <form onSubmit={handleCardPayment}>
        <Button
          type="submit"
          disabled={isProcessing || !billingDetails.firstName || !billingDetails.lastName}
          className="w-full bg-[#095D66] hover:bg-[#074952] text-white py-4 text-lg font-semibold rounded-lg"
        >
          {isProcessing ? 'Processing...' : 'Place order'}
        </Button>
      </form>
    </div>
  );
}

export default function Checkout() {
  const [, params] = useRoute("/checkout/:courseId");
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // SIMPLIFIED: Extract courseId from URL using simple approach
  const courseIdFromQuery = new URLSearchParams(window.location.search).get('courseId');
  const courseId = params?.courseId ? parseInt(params.courseId) : courseIdFromQuery ? parseInt(courseIdFromQuery) : null;
  
  console.log('SIMPLIFIED Checkout Debug:', {
    windowLocationSearch: window.location.search,
    courseIdFromQuery,
    courseId,
    isDirectPurchase: !!courseId
  });
  
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.firstName || "",
    email: user?.email || "",
    dueDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Kristiana E",
      rating: 5,
      text: "Dr Golly's program has helped me get my baby to have much more quality and long lasting sleeps. I'm so happy that I stumbled across this program especially as a new parents."
    },
    {
      name: "Sarah M",
      rating: 5,
      text: "Amazing results! My little one went from waking up every 2 hours to sleeping through the night in just 2 weeks. The gentle approach really worked for us."
    },
    {
      name: "Emma L",
      rating: 5,
      text: "I was skeptical at first, but Dr Golly's methods are evidence-based and really work. My baby is now sleeping 10-12 hours straight!"
    },
    {
      name: "Rachel K",
      rating: 5,
      text: "The step-by-step approach made it so easy to follow. Within days we saw improvements in our baby's sleep patterns. Highly recommend!"
    }
  ];

  // Auto-advance testimonials every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });
  
  // SIMPLIFIED: Determine checkout type
  const isDirectPurchase = !!courseId;
  const isCartCheckout = !courseId;
  
  // For direct purchase, never fetch cart items
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user && isCartCheckout, // Only fetch cart items for cart checkout
  });

  // SIMPLIFIED: Always show empty cart for direct purchase
  const displayCartItems = isDirectPurchase ? [] : cartItems;

  // Fetch shopping products for cart items
  const { data: shoppingProducts = [] } = useQuery<ShoppingProduct[]>({
    queryKey: ['/api/shopping-products'],
    enabled: displayCartItems.length > 0 && isCartCheckout,
  });

  // Fetch courses for cart items
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: displayCartItems.length > 0 && isCartCheckout,
  });
  
  // Fetch course details only for direct purchase
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: isDirectPurchase,
  });
  
  // Use course price if available, otherwise use regional pricing
  const originalPrice = course?.price || regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  // Calculate total for cart items
  const calculateCartTotal = () => {
    return displayCartItems.reduce((total, item) => {
      const itemType = item.itemType || (item as any).item_type;
      const itemId = item.itemId || (item as any).item_id;
      
      if (itemType === 'book') {
        const product = shoppingProducts.find(p => p.id === parseInt(itemId));
        if (product && regionalPricing) {
          const priceField = product.priceField as keyof typeof regionalPricing;
          const price = regionalPricing[priceField] || 0;
          return total + (price * item.quantity);
        }
      } else if (itemType === 'course') {
        return total + (originalPrice * item.quantity);
      }
      return total;
    }, 0);
  };

  // Helper function to get item details
  const getItemDetails = (item: CartItem) => {
    const itemType = item.itemType || (item as any).item_type;
    const itemId = item.itemId || (item as any).item_id;
    
    if (itemType === 'book') {
      const product = shoppingProducts.find(p => p.id === parseInt(itemId));
      if (product && regionalPricing) {
        const priceField = product.priceField as keyof typeof regionalPricing;
        const price = regionalPricing[priceField] || 0;
        return {
          title: product.title,
          image: productImages[product.id] || null,
          price: price,
          author: product.author,
        };
      }
    } else if (itemType === 'course') {
      const course = courses.find(c => c.id === parseInt(itemId));
      return course ? {
        title: course.title,
        image: course.thumbnailUrl ? course.thumbnailUrl.replace('/assets/', '/attached_assets/') : null,
        price: originalPrice,
        author: 'Dr. Golly',
      } : null;
    }
    return null;
  };

  // Use cart total if there are cart items, otherwise use course price
  const basePrice = displayCartItems.length > 0 ? calculateCartTotal() : originalPrice;
  
  // Calculate final price with coupon
  const finalPrice = appliedCoupon ? 
    appliedCoupon.amount_off ? basePrice - (appliedCoupon.amount_off / 100) :
    appliedCoupon.percent_off ? basePrice * (1 - appliedCoupon.percent_off / 100) :
    basePrice : basePrice;

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

  // Handle case where no items to checkout (cart is empty and no direct course purchase)
  if (displayCartItems.length === 0 && !courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nothing to Checkout</h1>
          <p className="text-gray-600 mb-6">Your cart is empty. Add some courses or books to your cart to proceed.</p>
          <Button onClick={() => setLocation("/courses")} className="bg-[#095D66] hover:bg-[#074952]">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state for course checkout or while cart data is loading
  if (courseId && courseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }



  const canProceedToPayment = customerDetails.email && customerDetails.firstName;

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
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">CONFIRM YOUR DETAILS</h2>
              
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
                </div>
                
                <div>
                  <Input
                    id="firstName"
                    type="text"
                    value={customerDetails.firstName}
                    onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12"
                  />
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
                {/* Debug information */}
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  Debug: {isDirectPurchase ? 'Direct Purchase' : 'Cart Checkout'} - Cart items: {displayCartItems.length}, Course ID: {courseId}, Course: {course ? 'loaded' : 'not loaded'}, Course loading: {courseLoading ? 'true' : 'false'}
                </div>
                
                {/* Direct Purchase Flow */}
                {isDirectPurchase && (
                  course ? (
                    <div className="flex items-start space-x-3">
                      <img 
                        src={course.thumbnailUrl ? course.thumbnailUrl.replace('/assets/', '/attached_assets/') : "https://via.placeholder.com/64x64"} 
                        alt={course.title}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', course.thumbnailUrl);
                          e.currentTarget.src = "https://via.placeholder.com/64x64";
                        }}
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
                  ) : courseLoading ? (
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-[#83CFCC] rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">COURSE</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Course Purchase</h3>
                        <p className="text-sm text-gray-600">Digital Course</p>
                        <p className="text-sm font-medium">{currencySymbol}{originalPrice}</p>
                      </div>
                    </div>
                  )
                )}
                
                {/* Cart Checkout Flow */}
                {isCartCheckout && (
                  displayCartItems.length > 0 ? (
                    displayCartItems.map((item) => {
                      const itemDetails = getItemDetails(item);
                      if (!itemDetails) return null;
                      
                      return (
                        <div key={item.id} className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                            {itemDetails.image ? (
                              <img 
                                src={itemDetails.image} 
                                alt={itemDetails.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#83CFCC] rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">COURSE</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{itemDetails.title}</h3>
                            <p className="text-sm text-gray-600">by {itemDetails.author}</p>
                            <p className="text-sm font-medium">{currencySymbol}{itemDetails.price.toFixed(2)}</p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items in cart</p>
                    </div>
                  )
                )}
                
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
                          (basePrice * appliedCoupon.percent_off / 100).toFixed(2))}
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

            {/* Payment Section */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">PAYMENT</h2>
              {/* Show loading only for direct purchase when course is loading */}
              {isDirectPurchase && courseLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-[#6B9CA3] rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading course information...</p>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <SimpleCardPayment
                    coursePrice={finalPrice}
                    currencySymbol={currencySymbol}
                    currency={currency}
                    customerDetails={customerDetails}
                    course={course}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
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

          {/* Testimonial Carousel */}
          <div className="relative min-h-[150px]">
            <div className="border-b pb-4">
              <div className="flex items-center space-x-1 mb-2">
                <span className="font-medium">{testimonials[currentTestimonial].name}</span>
                <div className="flex text-yellow-400">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-1 mb-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Verified Customer</span>
              </div>
              <p className="text-sm">
                {testimonials[currentTestimonial].text}
              </p>
            </div>
          </div>
          
          {/* Testimonial Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTestimonial ? 'bg-[#6B9CA3]' : 'bg-gray-300'
                }`}
              />
            ))}
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