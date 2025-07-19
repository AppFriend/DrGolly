import { useState, useEffect } from 'react';
import { useStripe, useElements, CardNumberElement } from '@stripe/react-stripe-js';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Trash2 } from 'lucide-react';

import { UserDetails } from './UserDetails';
import { PaymentSection } from './PaymentSection';
import { BillingDetails } from './BillingDetails';
import { CouponField } from './CouponField';

import { CustomerDetails, CouponData } from '@/types/checkout';
import { Product } from '@/types/product';
import { detectUserRegion, getRegionalPricing, formatCurrency } from '@/utils/regionPricing';

// import drGollyLogo from '@assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const params = useParams();
  
  // Core state
  const [product, setProduct] = useState<Product | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);
  
  // Pricing state
  const [currency, setCurrency] = useState('AUD');
  const [originalAmount, setOriginalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  
  // Form state
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: '',
    dueDate: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  // Get productId from URL params
  const productId = params.productId || '2'; // Default to Big Baby Sleep Program

  // Initialize product and pricing
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Detect user region for pricing
        const detectedCurrency = await detectUserRegion();
        setCurrency(detectedCurrency);
        
        // Fetch product info
        const productResponse = await apiRequest('GET', `/api/products/${productId}`);
        const productData = await productResponse.json();
        setProduct(productData);
        
        // Set regional pricing
        const pricing = getRegionalPricing();
        const amount = pricing[detectedCurrency as keyof typeof pricing];
        setOriginalAmount(amount);
        setFinalAmount(amount);
        
      } catch (error) {
        console.error('Error initializing checkout:', error);
        // Fallback to default values
        setOriginalAmount(12000);
        setFinalAmount(12000);
        setProduct({
          id: productId,
          name: 'Big Baby Sleep Program',
          description: '4-8 Months',
          price: 12000,
          currency: 'AUD',
          stripeProductId: 'prod_default',
          type: 'one-off'
        });
      }
    };

    initializeCheckout();
  }, [productId]);

  // Create payment intent when amount changes
  useEffect(() => {
    if (finalAmount > 0) {
      const createPaymentIntent = async () => {
        try {
          const response = await apiRequest('POST', '/api/create-checkout-new-payment-intent', {
            amount: finalAmount,
            currency: currency.toLowerCase(),
            productId
          });
          
          const data = await response.json();
          setClientSecret(data.clientSecret);
          setPaymentIntentCreated(true);
          console.log('Payment intent created:', data.paymentIntentId);
        } catch (error) {
          console.error('Error creating payment intent:', error);
          toast({
            title: "Payment Setup Error",
            description: "Unable to initialize payment. Please refresh the page.",
            variant: "destructive",
          });
        }
      };

      createPaymentIntent();
    }
  }, [finalAmount, currency, productId, toast]);

  const handleDetailsUpdate = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCouponApplied = (coupon: CouponData | null) => {
    setAppliedCoupon(coupon);
    
    if (coupon) {
      if (coupon.percent_off) {
        setFinalAmount(Math.round(originalAmount * (1 - coupon.percent_off / 100)));
      } else if (coupon.amount_off) {
        setFinalAmount(Math.max(0, originalAmount - coupon.amount_off));
      }
    } else {
      setFinalAmount(originalAmount);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast({
        title: "Payment Not Ready",
        description: "Payment system is still loading. Please wait.",
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

    setIsLoading(true);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Card information not available');
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            email: customerDetails.email,
            phone: customerDetails.phone || undefined,
            address: {
              line1: customerDetails.address || undefined,
            },
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed.",
          variant: "destructive",
        });
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Complete purchase on backend
        await apiRequest('POST', '/api/complete-checkout-new-purchase', {
          paymentIntentId: paymentIntent.id,
          customerDetails,
          productId,
          couponCode: appliedCoupon?.code
        });
        
        toast({
          title: "Payment Successful!",
          description: `Your ${product?.name || 'course'} purchase is complete.`,
        });
        
        // Check if user needs to complete profile
        const userCheck = await apiRequest('GET', '/api/user').catch(() => null);
        if (userCheck) {
          window.location.href = '/home';
        } else {
          window.location.href = '/complete';
        }
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading checkout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src={drGollyLogo} alt="Dr. Golly" className="h-8" />
            <div className="text-gray-600 text-sm">
              You're one step closer to better sleep for your baby!
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <UserDetails 
                customerDetails={customerDetails}
                onUpdateDetails={handleDetailsUpdate}
              />
              
              <PaymentSection 
                paymentIntentCreated={paymentIntentCreated}
                finalAmount={finalAmount}
                currency={currency}
              />
              
              <BillingDetails 
                customerDetails={customerDetails}
                onUpdateDetails={handleDetailsUpdate}
              />
              
            </form>
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                YOUR ORDER
              </h2>
              
              {/* Product */}
              <div className="flex items-start space-x-4 mb-6">
                <img 
                  src="/attached_assets/IMG_5167_1752574749114.jpeg" 
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">{formatCurrency(originalAmount, currency)}</span>
                    <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              <CouponField 
                appliedCoupon={appliedCoupon}
                onCouponApplied={handleCouponApplied}
                productId={productId}
              />

              {/* Total */}
              <div className="border-t pt-4">
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Subtotal</span>
                    <span>{formatCurrency(originalAmount, currency)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>
                      Discount ({appliedCoupon.percent_off ? `${appliedCoupon.percent_off}%` : formatCurrency(appliedCoupon.amount_off!, currency)} off)
                    </span>
                    <span>-{formatCurrency(originalAmount - finalAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total (incl. GST)</span>
                  <span>{formatCurrency(finalAmount, currency)}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!stripe || !paymentIntentCreated || isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 mt-6 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Complete Purchase - ${formatCurrency(finalAmount, currency)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}