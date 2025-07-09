import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Star, Crown, Info, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Manage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentTier = user?.subscriptionTier || "free";
  const nextBillingDate = user?.nextBillingDate ? new Date(user.nextBillingDate) : null;

  const plans = {
    free: {
      name: "Free Plan",
      description: "Pay as you go courses",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Pay as you go Courses",
        "Exclusive Dr Golly Content"
      ],
      expandedFeatures: [
        "Buy individual courses as needed",
        "Access limited community content",
        "Email support when needed"
      ]
    },
    gold: {
      name: "Gold Plan",
      description: "Unlimited Courses + Free Dr Golly Book",
      monthlyPrice: 199,
      yearlyPrice: 99, // 50% discount
      features: [
        "Unlimited Courses",
        "Exclusive Partner Discounts"
      ],
      expandedFeatures: [
        "Everything in Free plan...",
        "Unlimited access to all courses",
        "Free copy of the Dr Golly Book",
        "Growth tracking tools",
        "Loyalty program benefits",
        "Exclusive partner discounts",
        "Family sharing (up to 4 members)"
      ],
      popular: true
    },
    platinum: {
      name: "Platinum Plan",
      description: "The Ultimate Dr Golly Program",
      monthlyPrice: 499,
      yearlyPrice: 249, // 50% discount
      features: [
        "Everything in Gold Plan +",
        "1:1 Consultation"
      ],
      expandedFeatures: [
        "Everything in Free plan...",
        "Unlimited access to all courses",
        "Free copy of the Dr Golly Book",
        "Growth tracking tools",
        "Loyalty program benefits",
        "Exclusive partner discounts",
        "Family sharing (up to 4 members)"
      ],
      comingSoon: true
    }
  };

  const updateSubscription = useMutation({
    mutationFn: async ({ tier, period }: { tier: string; period: string }) => {
      return await apiRequest("POST", "/api/subscription/update", { tier, billingPeriod: period });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Subscription Updated",
        description: "Your plan has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    }
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Subscription Cancelled",
        description: `Your subscription has been cancelled. You'll retain access until ${formatDate(new Date(data.accessUntil))}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  const handlePlanSelect = async (planKey: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (planKey === currentTier) {
        toast({
          title: "Current Plan",
          description: "You're already on this plan.",
        });
        return;
      }

      // If upgrading to a paid plan or changing billing period, redirect to checkout
      if (planKey !== "free") {
        const plan = plans[planKey as keyof typeof plans];
        const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
        
        if (planKey === "platinum") {
          toast({
            title: "Coming Soon",
            description: "Platinum plan will be available soon!",
          });
          return;
        }
        
        setLocation(`/checkout-subscription?plan=${planKey}&period=${billingPeriod}&price=${price}`);
        return;
      }

      // Downgrading to free
      await updateSubscription.mutateAsync({ tier: planKey, period: billingPeriod });
      
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateDowngradeDate = () => {
    if (!nextBillingDate) return null;
    return nextBillingDate;
  };

  const toggleExpanded = (planKey: string) => {
    setExpandedPlan(expandedPlan === planKey ? null : planKey);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-[#095D66] text-white p-4 flex items-center">
        <button 
          onClick={() => setLocation("/home")} 
          className="mr-3 flex items-center gap-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back to Home</span>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Choose Your Plan</h1>
          <p className="text-sm opacity-90">Upgrade to get to full access to all courses and content</p>
        </div>
      </header>

      <div className="p-4">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-6 bg-white rounded-full p-1 shadow-sm max-w-xs mx-auto">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors flex-1 ${
              billingPeriod === "monthly"
                ? "bg-[#6B9CA3] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pay Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors flex-1 relative ${
              billingPeriod === "yearly"
                ? "bg-[#6B9CA3] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pay Yearly
            <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save 50%
            </Badge>
          </button>
        </div>

        {/* Current Subscription Info */}
        {currentTier !== "free" && nextBillingDate && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Current Subscription</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {cancelSubscription.isPending ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </div>
              <p className="text-blue-800 text-sm">
                You're currently on the <span className="font-semibold">{plans[currentTier as keyof typeof plans]?.name}</span>.
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Next billing date: <span className="font-medium">{formatDate(nextBillingDate)}</span>
              </p>
              {currentTier !== "free" && (
                <p className="text-blue-600 text-xs mt-2">
                  If you downgrade, your plan will change to Free on {formatDate(calculateDowngradeDate() || nextBillingDate)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="space-y-4">
          {Object.entries(plans).map(([planKey, plan]) => {
            const isCurrentPlan = planKey === currentTier;
            const isExpanded = expandedPlan === planKey;
            const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const originalPrice = billingPeriod === "yearly" ? plan.monthlyPrice * 12 : plan.monthlyPrice;
            
            return (
              <Card
                key={planKey}
                className={`relative transition-all ${
                  isCurrentPlan 
                    ? "border-[#095D66] ring-2 ring-[#095D66] ring-opacity-20" 
                    : "border-gray-200"
                } ${plan.popular ? "ring-2 ring-green-500 ring-opacity-30" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#6B9CA3] text-white px-3 py-1 rounded-full">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {isCurrentPlan && (
                        <Badge variant="outline" className="text-xs border-[#6B9CA3] text-[#6B9CA3]">
                          Current Plan
                        </Badge>
                      )}
                      {plan.comingSoon && (
                        <Badge className="bg-gray-400 text-white">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="flex items-baseline gap-2">
                    {billingPeriod === "yearly" && planKey !== "free" && (
                      <span className="text-lg text-gray-400 line-through">
                        ${originalPrice}
                      </span>
                    )}
                    <span className="text-3xl font-bold">
                      ${price}
                    </span>
                    <span className="text-gray-500">
                      /{billingPeriod === "yearly" ? "Month" : "Month"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Basic Features */}
                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expanded Features */}
                  {isExpanded && (
                    <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">What's Included:</h4>
                      {plan.expandedFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(planKey)}
                    className="flex items-center justify-between w-full text-sm text-[#6B9CA3] hover:text-[#6B9CA3]/80 mb-4 py-2"
                  >
                    <span className="font-medium">What's Included</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* Action Button */}
                  <Button
                    onClick={() => handlePlanSelect(planKey)}
                    disabled={isLoading || plan.comingSoon}
                    className={`w-full rounded-full py-3 font-medium ${
                      isCurrentPlan
                        ? "bg-gray-400 text-white cursor-default"
                        : planKey === "free"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : plan.popular
                        ? "bg-[#6B9CA3] hover:bg-[#6B9CA3]/90 text-white"
                        : "bg-[#6B9CA3] hover:bg-[#6B9CA3]/90 text-white"
                    }`}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.comingSoon ? (
                      "Coming Soon"
                    ) : planKey === "free" ? (
                      currentTier !== "free" ? "Downgrade" : "Get Started"
                    ) : (
                      "Get Started"
                    )}
                  </Button>

                  {billingPeriod === "yearly" && planKey !== "free" && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Billed ${price * 12}/year
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}