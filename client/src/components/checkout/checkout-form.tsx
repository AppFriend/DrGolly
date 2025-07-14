import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import { FacebookPixel } from "@/lib/facebook-pixel";

interface CheckoutFormProps {
  course: Course;
  customerDetails: any;
  total: number;
}

// Add regional pricing hook
function useRegionalPricing() {
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });
  
  const currency = regionalPricing?.currency || 'USD';
  const currencyCode = currency === 'AUD' ? 'aud' : currency === 'USD' ? 'usd' : 'eur';
  
  return { currency, currencyCode };
}

export function CheckoutForm({ course, customerDetails, total }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("link");
  const { currency, currencyCode } = useRegionalPricing();

  // Device detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Payment Request setup
  useEffect(() => {
    if (!stripe || !total || !currencyCode || !course?.title) return;

    const pr = stripe.paymentRequest({
      country: currencyCode === 'aud' ? 'AU' : currencyCode === 'usd' ? 'US' : 'DE',
      currency: currencyCode,
      total: {
        label: course.title || 'Course Purchase',
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      
      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success?courseId=${course?.id || ''}`,
          },
          redirect: 'if_required',
        });

        if (error) {
          console.error('Express payment error:', error);
          ev.complete('fail');
          toast({
            title: "Payment Failed",
            description: error.message || "Payment could not be processed.",
            variant: "destructive",
          });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          console.log('Express payment succeeded:', paymentIntent.id);
          ev.complete('success');
          toast({
            title: "Payment Successful",
            description: "Your course purchase is complete!",
          });
          // Redirect to success page
          window.location.href = `/payment-success?courseId=${course?.id}`;
        }
      } catch (err) {
        console.error('Express payment exception:', err);
        ev.complete('fail');
        toast({
          title: "Payment Error",
          description: `An unexpected error occurred: ${err instanceof Error ? err.message : 'Please try again.'}`,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, total, course?.id, course?.title, elements, toast, currencyCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Track initiate checkout
      FacebookPixel.trackInitiatePurchase(course.id, course.title, total / 100, currency);
      
      // First, create the payment intent with current coupon data
      const paymentResponse = await fetch('/api/create-course-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          customerDetails,
          couponId: appliedCoupon?.id
        }),
      });

      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || 'Failed to create payment');
      }

      // Update the payment intent with the new client secret
      const { error: updateError } = await stripe.retrievePaymentIntent(paymentData.clientSecret);
      if (updateError) {
        throw new Error('Failed to retrieve payment intent');
      }

      // Submit the payment form to validate all fields
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
        clientSecret: paymentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?courseId=${course?.id}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Track Facebook Pixel Purchase conversion
        const finalAmount = paymentData.finalAmount ? paymentData.finalAmount / 100 : total / 100;
        FacebookPixel.trackPurchase(course.id, course.title, finalAmount, currency);
        
        toast({
          title: "Payment Successful",
          description: "Your course purchase is complete!",
        });
        // Redirect to success page
        window.location.href = `/payment-success?courseId=${course?.id}`;
      }
    } catch (err) {
      console.error('Payment exception:', err);
      toast({
        title: "Payment Error",
        description: `An unexpected error occurred: ${err instanceof Error ? err.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 relative">
      <h2 className="text-lg font-semibold mb-4">Payment</h2>
      
      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <img
              src={paymentLoaderGif}
              alt="Processing payment..."
              className="w-24 h-24 mx-auto mb-4 object-contain"
            />
            <p className="text-lg font-semibold text-gray-700">Processing Payment...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we process your payment</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Express Payment (Mobile Only) */}
        {isMobile && canMakePayment && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Express checkout</span>
              </div>
            </div>
            
            <div className="rounded-lg border p-3">
              <PaymentRequestButtonElement 
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type: 'default',
                      theme: 'light',
                      height: '48px',
                    },
                  },
                }}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or pay with</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="card">Card</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="border rounded-lg p-3">
              <PaymentElement 
                options={{
                  layout: {
                    type: 'tabs',
                    defaultCollapsed: false,
                  },
                  paymentMethodOrder: ['link', 'card'],
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="card" className="space-y-4">
            <div className="border rounded-lg p-3">
              <PaymentElement 
                options={{
                  layout: {
                    type: 'tabs',
                    defaultCollapsed: false,
                  },
                  paymentMethodOrder: ['card'],
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Terms and Privacy */}
        <p className="text-xs text-gray-500">
          Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{" "}
          <a href="/privacy-policy" className="text-dr-teal underline">Privacy Policy</a>.
        </p>

        {/* Place Order Button */}
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white py-3 rounded-lg font-semibold"
        >
          {isProcessing ? "Processing..." : "Place order"}
        </Button>
      </form>
    </div>
  );
}