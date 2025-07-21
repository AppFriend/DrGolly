import { useState, useEffect, useRef } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@/types/product';
import { ExpressPaymentMethods } from './ExpressPaymentMethods';
import { Loader2, ChevronDown, Trash2, Star } from 'lucide-react';

interface MobileCheckoutProps {
  product: Product;
}

export function MobileCheckout({ product }: MobileCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  // Payment state
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Customer details
  const [customerDetails, setCustomerDetails] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    dueDate: '',
    address: ''
  });
  
  // Pricing state
  const [finalAmount, setFinalAmount] = useState(product.price);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponExpanded, setCouponExpanded] = useState(false);
  
  // Testimonial carousel state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonialRef = useRef<HTMLDivElement>(null);
  
  // Testimonial data
  const testimonials = [
    {
      name: "Crystal K",
      product: "Little baby sleep program",
      review: "Using the Dr Golly program with my first baby was an absolute godsend. He became a dream sleeper, and I loved how easy the routines were to follow and adapt. The program never felt strict - just a simple, effective framework that made everything feel manageable...",
      timeAgo: "2 months ago"
    },
    {
      name: "Sarah M",
      product: "Big baby sleep program",
      review: "This program completely transformed our family's sleep. My 18-month-old went from waking 5 times a night to sleeping through consistently. The gentle approach really worked for us and I couldn't be happier with the results!",
      timeAgo: "1 month ago"
    },
    {
      name: "Emma R",
      product: "Preparation for newborns",
      review: "I started this program during pregnancy and felt so prepared when our baby arrived. The techniques worked from day one and gave me confidence as a new parent. Worth every penny for the peace of mind it provided.",
      timeAgo: "3 weeks ago"
    }
  ];
  
  // Create payment intent
  useEffect(() => {
    const createPaymentIntent = async () => {
      const details = {
        email: customerDetails.email || 'placeholder@example.com',
        firstName: customerDetails.firstName || 'Placeholder'
      };
      
      try {
        setIsLoading(true);
        
        const endpoint = product.type === 'subscription' 
          ? '/api/checkout-new/create-subscription'
          : '/api/checkout-new/create-payment-intent';
        
        const response = await apiRequest('POST', endpoint, {
          productId: product.id,
          customerDetails: details,
          couponCode: appliedCoupon
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setFinalAmount(data.amount);
        setDiscountAmount(data.discountAmount || 0);
        
        if (product.type === 'subscription') {
          localStorage.setItem('pendingSubscriptionId', data.subscriptionId);
          localStorage.setItem('pendingCustomerId', data.customerId);
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [appliedCoupon, product.id]);
  
  // Auto-scroll testimonials every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const response = await apiRequest('POST', '/api/checkout-new/validate-coupon', {
        couponCode: couponCode.trim(),
        amount: product.price
      });
      
      const data = await response.json();
      if (data.valid) {
        setAppliedCoupon(couponCode.trim());
        toast({
          title: "Coupon Applied",
          description: `Saved $${data.discountAmount.toFixed(2)}!`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon code.",
        variant: "destructive",
      });
    }
  };
  
  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast({
        title: "Error",
        description: "Payment system not ready. Please wait.",
        variant: "destructive",
      });
      return;
    }
    
    setPaymentProcessing(true);
    
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      toast({
        title: "Error",
        description: "Payment form not ready. Please refresh the page.",
        variant: "destructive",
      });
      setPaymentProcessing(false);
      return;
    }
    
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            email: customerDetails.email,
            phone: customerDetails.phone || undefined,
          },
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: product.type === 'subscription' 
            ? "Your subscription is now active!" 
            : "Thank you for your purchase!",
        });
        
        try {
          if (product.type === 'subscription') {
            const subscriptionId = localStorage.getItem('pendingSubscriptionId');
            await apiRequest('POST', '/api/checkout-new/complete-subscription', {
              subscriptionId,
              customerDetails
            });
            localStorage.removeItem('pendingSubscriptionId');
            localStorage.removeItem('pendingCustomerId');
            window.location.href = '/home';
          } else {
            const purchaseResponse = await apiRequest('POST', '/api/checkout-new/complete-purchase', {
              paymentIntentId: paymentIntent.id,
              customerDetails
            });
            
            const purchaseData = await purchaseResponse.json();
            
            if (purchaseData.redirectTo) {
              window.location.href = purchaseData.redirectTo;
            } else {
              window.location.href = purchaseData.userExists ? '/home' : '/complete';
            }
          }
        } catch (error) {
          console.error('Error completing purchase:', error);
          toast({
            title: "Warning",
            description: "Payment succeeded but there was an issue completing your order. Please contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        lineHeight: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    disabled: false,
    hidePostalCode: true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section 1: Banner and Your Details */}
      <div className="bg-gray-200 px-4 py-6 mb-6">
        <div className="flex items-center mb-4">
          <img 
            src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
            alt="Dr. Golly Sleep Logo" 
            className="h-8 mr-3"
          />
          <p className="text-gray-700 text-lg font-medium">
            You're one step closer to better sleep for your baby!
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Your Details Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-teal-600 mb-6 uppercase tracking-wide">
              YOUR DETAILS
            </h2>
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                  className="w-full h-12 text-base"
                  required
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={customerDetails.dueDate}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                  placeholder="Due Date/Baby Birthday"
                  className="w-full h-12 text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Your Order */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-teal-600 uppercase tracking-wide">
                YOUR ORDER - ${finalAmount.toFixed(0)}
              </h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
            
            {/* Product Item */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                <img 
                  src="/attached_assets/Big Baby Image_1753064944336.png" 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {product.description || product.ageRange}
                </p>
                <p className="font-bold text-lg mt-1">
                  ${product.price.toFixed(0)}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Coupon Section */}
            <Collapsible open={couponExpanded} onOpenChange={setCouponExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 text-gray-700 mb-4">
                <div className="p-1 border border-gray-300 rounded">
                  <div className="w-4 h-4 border border-gray-400 rounded-sm"></div>
                </div>
                <span>Have a coupon or gift card?</span>
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="coupon or gift card"
                    className="flex-1 h-12"
                  />
                  <Button 
                    onClick={applyCoupon}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 h-12"
                    disabled={!couponCode.trim() || isLoading}
                  >
                    Add
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="text-sm text-green-600">
                    ✓ Coupon "{appliedCoupon}" applied
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total <span className="text-sm font-normal text-gray-600">(incl. GST)</span></span>
                <span>${finalAmount.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Payment Details */}
        <Card style={{ position: 'relative', zIndex: 5 }}>
          <CardContent className="p-6" style={{ position: 'relative', zIndex: 6 }}>
            <h2 className="text-xl font-bold text-teal-600 mb-6 uppercase tracking-wide">
              PAYMENT
            </h2>
            
            {/* Payment Method Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full border-2 border-teal-500 bg-teal-500"></div>
              <span className="font-medium">Credit / Debit Card</span>
              <div className="flex gap-1 ml-auto">
                <img src="/attached_assets/Visa_Logo_1753065063735.png" alt="Visa" className="h-6" />
                <img src="/attached_assets/MasterCard_Logo.svg_1753065119402.png" alt="Mastercard" className="h-6" />
                <img src="/attached_assets/American-Express-Color_1753065143686.png" alt="American Express" className="h-6" />
              </div>
            </div>

            {/* Secure Link Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-blue-600 font-medium">Secure, 1-click checkout with Link</span>
                <ChevronDown className="h-4 w-4 text-blue-600 ml-auto" />
              </div>
            </div>

            {/* Payment Form */}
            {!clientSecret ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Loading payment options...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Card number</Label>
                  <div 
                    className="border border-gray-300 rounded-md p-3 h-12 flex items-center relative"
                    style={{ 
                      pointerEvents: 'auto',
                      zIndex: 10,
                      isolation: 'isolate',
                      position: 'relative'
                    }}
                  >
                    <div style={{ width: '100%', pointerEvents: 'auto' }}>
                      <CardNumberElement options={cardElementOptions} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Expiration date</Label>
                    <div 
                      className="border border-gray-300 rounded-md p-3 h-12 flex items-center relative"
                      style={{ 
                        pointerEvents: 'auto',
                        zIndex: 10,
                        isolation: 'isolate',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '100%', pointerEvents: 'auto' }}>
                        <CardExpiryElement options={cardElementOptions} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Security code</Label>
                    <div 
                      className="border border-gray-300 rounded-md p-3 h-12 flex items-center relative"
                      style={{ 
                        pointerEvents: 'auto',
                        zIndex: 10,
                        isolation: 'isolate',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '100%', pointerEvents: 'auto' }}>
                        <CardCvcElement options={cardElementOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Billing Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-teal-600 mb-6 uppercase tracking-wide">
              BILLING DETAILS
            </h2>
            <div className="space-y-4">
              <Input
                type="text"
                value={customerDetails.firstName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First Name"
                className="w-full h-12 text-base"
                required
              />
              <Input
                type="text"
                value={customerDetails.lastName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last Name"
                className="w-full h-12 text-base"
              />
              <Input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full h-12 text-base"
              />
              <Input
                type="text"
                value={customerDetails.address || ''}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Start typing your address"
                className="w-full h-12 text-base"
              />
              <p className="text-sm text-gray-600 underline">Enter your address manually</p>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Your personal data will be used to process your order, support your 
                experience throughout this website, and for other purposes described 
                in our <span className="text-blue-600 underline">privacy policy</span>.
              </p>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                You will automatically be subscribed to emails so we can get you 
                started with your course. You can unsubscribe any time once you're set up.
              </p>
            </div>

            {/* Place Order Button */}
            <Button 
              onClick={handleSubmit}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 text-lg font-medium mt-6 rounded-full"
              disabled={!stripe || !clientSecret || paymentProcessing || !customerDetails.email || !customerDetails.firstName}
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place order - $${finalAmount.toFixed(2)}`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Section 5: Guarantees and Testimonials */}
        <Card>
          <CardContent className="p-6">
            {/* 30-Day Guarantee */}
            <div className="mb-6">
              <img 
                src="/attached_assets/Screen Shot 2025-07-21 at 12.19.43 pm_1753064939819.png" 
                alt="30 Day Money Back Guarantee" 
                className="w-full h-auto"
              />
            </div>

            {/* Reviews Section */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-center mb-4">Let customers speak for us</h3>
              
              {/* Rating Summary */}
              <div className="bg-teal-100 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-teal-700">4.85</div>
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Based on 778 reviews</strong><br />
                      Excellent on <strong>REVIEWS.io</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo Reviews Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1,2,3,4,5,6,7,8].map((photo) => (
                  <div key={photo} className="aspect-square bg-gray-200 rounded-lg"></div>
                ))}
              </div>

              {/* Customer Testimonial Carousel */}
              <div className="bg-gray-50 rounded-lg p-4 relative overflow-hidden" ref={testimonialRef}>
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{testimonial.name}</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">Verified Customer</span>
                      </div>
                      <p className="text-sm text-blue-600 mb-2">{testimonial.product}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {testimonial.review}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <span className="text-xs text-gray-500">{testimonial.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Carousel indicators */}
                <div className="flex justify-center mt-4 gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}