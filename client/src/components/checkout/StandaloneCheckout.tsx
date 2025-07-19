import { useState, useEffect } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@/types/product';
import { ExpressPaymentMethods } from './ExpressPaymentMethods';
import { detectUserRegion, getRegionalPrice } from '@/utils/regionPricing';
import { Loader2 } from 'lucide-react';

interface StandaloneCheckoutProps {
  product: Product;
}

export function StandaloneCheckout({ product }: StandaloneCheckoutProps) {
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
  
  // Create payment intent/subscription - initialize immediately for payment fields to be visible
  useEffect(() => {
    const createPaymentIntent = async () => {
      // Always create payment intent for payment fields to show
      const details = {
        email: customerDetails.email || 'placeholder@example.com',
        firstName: customerDetails.firstName || 'Placeholder'
      };
      
      try {
        setIsLoading(true);
        
        // Determine endpoint based on product type
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
        
        // Store subscription-specific data if applicable
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
  }, [appliedCoupon, product.id]); // Remove dependency on customer details so payment fields always show
  
  // Handle express payment success
  const handleExpressPaymentSuccess = async (paymentResult: any) => {
    try {
      setPaymentProcessing(true);
      
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      
      // Complete purchase flow for express payments
      const purchaseResponse = await apiRequest('POST', '/api/checkout-new/complete-purchase', {
        paymentIntentId: paymentResult.paymentIntent.id,
        customerDetails
      });
      
      const purchaseData = await purchaseResponse.json();
      
      // Use the routing information returned from backend
      if (purchaseData.redirectTo) {
        window.location.href = purchaseData.redirectTo;
      } else {
        // Fallback: redirect based on userExists flag
        window.location.href = purchaseData.userExists ? '/home' : '/complete';
      }
      // - If existing user: redirect to /home
      
      console.log('Express payment completed:', paymentResult);
      toast({
        title: "Payment Successful",
        description: "Express payment completed successfully!",
      });
    } catch (error) {
      console.error('Express payment processing error:', error);
      toast({
        title: "Error",
        description: "Express payment processing failed",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

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
        
        // Complete purchase flow
        try {
          if (product.type === 'subscription') {
            // Handle subscription completion
            const subscriptionId = localStorage.getItem('pendingSubscriptionId');
            const subscriptionResponse = await apiRequest('POST', '/api/checkout-new/complete-subscription', {
              subscriptionId,
              customerDetails
            });
            localStorage.removeItem('pendingSubscriptionId');
            localStorage.removeItem('pendingCustomerId');
            
            // Use subscription response for routing (implement if needed)
            window.location.href = '/home'; // Default for subscriptions
          } else {
            // Handle one-off purchase completion with routing logic
            const purchaseResponse = await apiRequest('POST', '/api/checkout-new/complete-purchase', {
              paymentIntentId: paymentIntent.id,
              customerDetails
            });
            
            const purchaseData = await purchaseResponse.json();
            
            // Use the routing information returned from backend
            if (purchaseData.redirectTo) {
              window.location.href = purchaseData.redirectTo;
            } else {
              // Fallback: redirect based on userExists flag
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
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          <p className="text-lg text-gray-600">
            {product.description} • ${finalAmount.toFixed(2)} {product.currency}
            {discountAmount > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                (Save ${discountAmount.toFixed(2)})
              </span>
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                YOUR DETAILS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date/Baby Birthday</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={customerDetails.dueDate}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={customerDetails.firstName}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={customerDetails.lastName}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={customerDetails.address || ''}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your address manually"
                  />
                </div>
              </div>
            </div>
            
            {/* Coupon Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 uppercase tracking-wide">
                PROMO CODE
              </h2>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={applyCoupon}
                  variant="outline"
                  disabled={!couponCode.trim() || isLoading}
                >
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Coupon "{appliedCoupon}" applied
                </div>
              )}
            </div>
            
            {/* Express Payment Methods */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 uppercase tracking-wide">
                EXPRESS CHECKOUT
              </h2>
              <ExpressPaymentMethods 
                product={product}
                customerDetails={customerDetails}
                onPaymentSuccess={handleExpressPaymentSuccess}
              />
            </div>

            {/* Payment Section - Always visible as per requirements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                PAYMENT DETAILS
              </h2>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Card Number</Label>
                    <div className="border border-gray-300 rounded-md p-3">
                      <CardNumberElement options={cardElementOptions} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expiry Date</Label>
                      <div className="border border-gray-300 rounded-md p-3">
                        <CardExpiryElement options={cardElementOptions} />
                      </div>
                    </div>
                    <div>
                      <Label>CVC</Label>
                      <div className="border border-gray-300 rounded-md p-3">
                        <CardCvcElement options={cardElementOptions} />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-lg font-medium"
                    disabled={!stripe || !clientSecret || paymentProcessing || !customerDetails.email || !customerDetails.firstName}
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${finalAmount.toFixed(2)} ${product.currency}`
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{product.name}</span>
                  <span>${product.price.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <hr className="my-4" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${finalAmount.toFixed(2)} {product.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StandaloneCheckout;