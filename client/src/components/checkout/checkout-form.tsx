import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    if (!stripe || !total || !currencyCode) return;

    const pr = stripe.paymentRequest({
      country: currencyCode === 'aud' ? 'AU' : currencyCode === 'usd' ? 'US' : 'DE',
      currency: currencyCode,
      total: {
        label: course.title,
        amount: total * 100,
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?courseId=${course.id}`,
        },
      });

      if (error) {
        ev.complete('fail');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        ev.complete('success');
      }
    });
  }, [stripe, total, course.id, course.title, elements, toast, currencyCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?courseId=${course.id}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
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
    <div className="bg-white rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Payment</h2>
      
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