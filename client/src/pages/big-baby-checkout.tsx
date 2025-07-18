import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Shield, Star, Users, Clock, Award, CreditCard, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import moneyBackGuarantee from "@assets/money-back-guarantee.png";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Course data
const COURSE_DATA = {
  id: 6,
  title: "Big baby sleep program",
  description: "Complete sleep solution for babies 4-8 months",
  basePrice: 120,
  features: [
    "Evidence-based sleep strategies",
    "Step-by-step implementation guide", 
    "Troubleshooting common issues",
    "Gentle, responsive methods",
    "Lifetime access to materials"
  ]
};

// Customer details interface
interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dueDate: string;
}

// Coupon interface
interface Coupon {
  id: string;
  name: string;
  percent_off?: number;
  amount_off?: number;
  currency?: string;
}

// Main checkout component
export default function BigBabyCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    dueDate: ""
  });
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ['/api/regional-pricing'],
    staleTime: 300000 // 5 minutes
  });

  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'EUR' ? '€' : '$';
  const originalPrice = regionalPricing?.coursePrice || COURSE_DATA.basePrice;

  // Calculate final price with coupon
  const finalPrice = appliedCoupon 
    ? appliedCoupon.amount_off 
      ? Math.max(0, originalPrice - (appliedCoupon.amount_off / 100))
      : appliedCoupon.percent_off
      ? Math.max(0, originalPrice * (1 - appliedCoupon.percent_off / 100))
      : originalPrice
    : originalPrice;

  const discountAmount = originalPrice - finalPrice;

  // Create payment intent
  const createPaymentIntent = async () => {
    if (!customerDetails.email || !customerDetails.firstName) return;

    try {
      const response = await apiRequest('POST', '/api/create-big-baby-payment-intent', {
        customerDetails,
        couponId: appliedCoupon?.id || null,
        courseId: COURSE_DATA.id
      });

      if (response.clientSecret) {
        setClientSecret(response.clientSecret);
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      toast({
        title: "Payment Setup Failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Validate coupon
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const response = await apiRequest('POST', '/api/validate-coupon', {
        couponCode: couponCode.trim()
      });

      if (response.valid) {
        setAppliedCoupon(response.coupon);
        toast({
          title: "Coupon Applied!",
          description: `${response.coupon.name} has been applied to your order.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid or has expired.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Coupon Validation Failed",
        description: "Unable to validate coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order.",
      variant: "default"
    });
  };

  // Create payment intent when customer details are ready
  useEffect(() => {
    if (customerDetails.email && customerDetails.firstName) {
      createPaymentIntent();
    }
  }, [customerDetails.email, customerDetails.firstName, appliedCoupon]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={drGollyLogo} alt="Dr. Golly" className="h-8 w-auto" />
          <div className="w-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#095D66]" />
              {COURSE_DATA.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{COURSE_DATA.description}</p>
            <div className="space-y-2">
              {COURSE_DATA.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
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
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Baby's Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={customerDetails.dueDate}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Coupon Code */}
        <Card>
          <CardHeader>
            <CardTitle>Coupon Code</CardTitle>
          </CardHeader>
          <CardContent>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                />
                <Button
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || isValidatingCoupon}
                  className="bg-[#095D66] hover:bg-[#074B54]"
                >
                  {isValidatingCoupon ? "Validating..." : "Apply"}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">{appliedCoupon.name}</p>
                    <p className="text-sm text-green-600">
                      {appliedCoupon.percent_off 
                        ? `${appliedCoupon.percent_off}% off` 
                        : `${currencySymbol}${(appliedCoupon.amount_off! / 100).toFixed(2)} off`
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Course Price</span>
                <span>{currencySymbol}{originalPrice.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.name})</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{currencySymbol}{finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        {clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  customerDetails={customerDetails}
                  courseId={COURSE_DATA.id}
                  finalPrice={finalPrice}
                  currency={currency}
                  appliedCoupon={appliedCoupon}
                  onSuccess={() => setShowSuccess(true)}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Trust Indicators */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Secure SSL encrypted payment</span>
          </div>
          <img src={moneyBackGuarantee} alt="Money back guarantee" className="h-16 mx-auto" />
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your course has been added to your account. You'll receive a confirmation email shortly.
              </p>
              <Button 
                onClick={() => setLocation('/home')}
                className="w-full bg-[#095D66] hover:bg-[#074B54]"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Payment form component
function PaymentForm({ 
  customerDetails, 
  courseId, 
  finalPrice, 
  currency, 
  appliedCoupon, 
  onSuccess 
}: {
  customerDetails: CustomerDetails;
  courseId: number;
  finalPrice: number;
  currency: string;
  appliedCoupon: Coupon | null;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);

    try {
      // Submit payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/big-baby-checkout`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create account and add course
        await fetch('/api/big-baby-complete-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerDetails,
            courseId,
            finalPrice,
            currency,
            appliedCoupon
          })
        });

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-[#095D66] hover:bg-[#074B54]"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <img src={paymentLoaderGif} alt="Processing" className="h-4 w-4" />
            Processing...
          </div>
        ) : (
          `Pay $${finalPrice.toFixed(2)} ${currency}`
        )}
      </Button>
    </form>
  );
}