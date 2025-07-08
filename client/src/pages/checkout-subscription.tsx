import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ planDetails }: { planDetails: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/manage?success=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
        <PaymentElement />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-[#095D66] hover:bg-[#095D66]/90"
        size="lg"
      >
        {isLoading ? (
          "Processing..."
        ) : (
          `Subscribe to ${planDetails?.name} - $${planDetails?.price}/${planDetails?.period === 'yearly' ? 'year' : 'month'}`
        )}
      </Button>
      
      <div className="flex items-center justify-center text-sm text-gray-500">
        <Lock className="h-4 w-4 mr-2" />
        Secured by Stripe
      </div>
    </form>
  );
}

export default function CheckoutSubscription() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const { toast } = useToast();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const plan = urlParams.get('plan');
  const period = urlParams.get('period');
  const price = urlParams.get('price');

  useEffect(() => {
    if (!plan || !period || !price) {
      toast({
        title: "Invalid Parameters",
        description: "Missing subscription details",
        variant: "destructive",
      });
      window.location.href = '/manage';
      return;
    }

    setPlanDetails({
      name: plan === 'gold' ? 'Gold Plan' : 'Platinum Plan',
      tier: plan,
      period,
      price: parseFloat(price)
    });

    // Create subscription checkout session
    apiRequest("POST", "/api/create-subscription-checkout", {
      planTier: plan,
      billingPeriod: period,
      priceAmount: parseFloat(price)
    })
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Setup Failed",
          description: error.message || "Failed to setup payment",
          variant: "destructive",
        });
      });
  }, [plan, period, price, toast]);

  if (!clientSecret || !planDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#095D66] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#095D66] text-white p-4 flex items-center">
        <button onClick={() => window.history.back()} className="mr-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Complete Subscription</h1>
          <p className="text-sm opacity-90">Secure payment with Stripe</p>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {/* Plan Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {planDetails.name}
              <span className="text-2xl font-bold">${planDetails.price}</span>
            </CardTitle>
            <CardDescription>
              Billed {planDetails.period === 'yearly' ? 'annually' : 'monthly'}
              {planDetails.period === 'yearly' && ' (50% savings)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{planDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing:</span>
                <span className="font-medium capitalize">{planDetails.period}</span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${planDetails.price}/{planDetails.period === 'yearly' ? 'year' : 'month'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm planDetails={planDetails} />
        </Elements>
      </div>
    </div>
  );
}