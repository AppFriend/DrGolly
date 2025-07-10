import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckoutForm } from "@/components/checkout/checkout-form";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function CheckoutSubscription() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [regionalPricing, setRegionalPricing] = useState<any>(null);

  // Parse URL params
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get('plan') || 'gold';
  const period = urlParams.get('period') || 'monthly';

  // Fetch regional pricing
  const { data: pricingData } = useQuery({
    queryKey: ['/api/regional-pricing'],
    enabled: !!user,
  });

  useEffect(() => {
    if (pricingData) {
      setRegionalPricing(pricingData);
    }
  }, [pricingData]);

  // Calculate price based on regional pricing
  const getPrice = () => {
    if (!regionalPricing) return 199;
    
    if (plan === 'gold') {
      return period === 'yearly' ? regionalPricing.goldYearly : regionalPricing.goldMonthly;
    } else if (plan === 'platinum') {
      return period === 'yearly' ? regionalPricing.platinumYearly : regionalPricing.platinumMonthly;
    }
    return 199;
  };

  const price = getPrice();
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';

  // Plan details
  const planDetails = {
    gold: {
      name: "Gold Plan",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      features: [
        "Unlimited Courses",
        "Exclusive Partner Discounts",
        "Growth Tracking Tools",
        "Family Sharing (up to 4 members)",
        "Free Dr. Golly Book"
      ]
    },
    platinum: {
      name: "Platinum Plan", 
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      features: [
        "Everything in Gold Plan",
        "1:1 Consultation with Dr. Golly",
        "Priority Support",
        "Advanced Analytics"
      ]
    }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  // Create subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ plan, period }: { plan: string; period: string }) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planTier: plan,
        billingPeriod: period
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
      if (data.pricing) {
        setRegionalPricing(data.pricing);
      }
    },
    onError: (error) => {
      toast({
        title: "Subscription Setup Failed",
        description: "Unable to set up subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user && plan && period) {
      createSubscriptionMutation.mutate({ plan, period });
    }
  }, [user, plan, period]);

  const handleBack = () => {
    setLocation("/manage");
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Subscription Activated!",
      description: `Your ${currentPlan.name} subscription is now active.`,
    });
    // Redirect to home or manage page
    setTimeout(() => {
      setLocation("/manage");
    }, 1500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        <button onClick={handleBack} className="mr-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Subscribe to {currentPlan.name}</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Plan Summary */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center mb-4">
            {currentPlan.icon}
            <h2 className="text-lg font-semibold ml-2">{currentPlan.name}</h2>
          </div>
          
          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-bold">{currencySymbol}{price}</span>
            <span className="text-gray-500 ml-1">/{period === 'yearly' ? 'year' : 'month'}</span>
            {period === 'yearly' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">
                Save 50%
              </span>
            )}
            {regionalPricing && (
              <span className="text-xs text-gray-500 ml-2">
                {currency}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                onSuccess={handlePaymentSuccess}
                amount={price}
                description={`${currentPlan.name} - ${period === 'yearly' ? 'Annual' : 'Monthly'}`}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-[#095D66] border-t-transparent rounded-full" />
              <span className="ml-2 text-gray-600">Setting up payment...</span>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            By subscribing, you agree to our <a href="/terms" target="_blank" className="text-[#095D66] hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[#095D66] hover:underline">Privacy Policy</a>.
            You can cancel your subscription at any time from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}