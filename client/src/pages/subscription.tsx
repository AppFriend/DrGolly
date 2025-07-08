import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp, Download } from "lucide-react";
import { PlanCard } from "@/components/ui/plan-card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const { data: billingHistory, error } = useQuery({
    queryKey: ["/api/billing/history"],
    enabled: !!user,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { tier: string; billingPeriod: string }) => {
      return await apiRequest("POST", "/api/subscription/update", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/history"] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (tier: string) => {
    if (tier === "platinum") {
      toast({
        title: "Coming Soon",
        description: "Platinum plan will be available soon.",
      });
      return;
    }
    
    updateSubscriptionMutation.mutate({ tier, billingPeriod });
  };

  const plans = [
    {
      id: "free",
      title: "Free Plan",
      description: "Pay as you go courses",
      price: 0,
      features: [
        "Pay-as-you-go Courses",
        "Exclusive Dr Golly Content",
        "Email support only",
        "Access limited community content",
      ],
      isCurrentPlan: user?.subscriptionTier === "free",
    },
    {
      id: "gold",
      title: "Gold Plan",
      description: "Unlimited Courses + Free Dr Golly Book",
      price: billingPeriod === "yearly" ? 99 : 199,
      features: [
        "Everything in Free, plus...",
        "Unlimited access to all courses",
        "Free copy of the Dr Golly Book",
        "Growth tracking tools",
        "Loyalty program benefits",
        "Exclusive partner discounts",
        "Family sharing (up to 4 members)",
      ],
      isPopular: true,
      isCurrentPlan: user?.subscriptionTier === "gold",
    },
    {
      id: "platinum",
      title: "Platinum Plan",
      description: "The Ultimate Dr Golly Program",
      price: 499,
      features: [
        "Everything in Gold, plus...",
        "1:1 access to the Dr Golly team",
        "Customized parenting programs",
        "Early access to new course content",
        "Platinum-only community",
        "Quarterly check-ins & diagnostics",
      ],
      isComingSoon: true,
      isCurrentPlan: user?.subscriptionTier === "platinum",
    },
  ];

  return (
    <div className="min-h-screen bg-dr-bg pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Choose Your Plan</h1>
        </div>
        <p className="text-sm text-gray-600">
          Upgrade to gold for full access to all courses and content.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-dr-teal text-white"
                  : "text-gray-600 hover:text-dr-teal"
              }`}
            >
              Pay Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-dr-teal text-white"
                  : "text-gray-600 hover:text-dr-teal"
              }`}
            >
              Pay Yearly
              <span className="ml-1 text-xs">20% OFF</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              <PlanCard
                title={plan.title}
                description={plan.description}
                price={plan.price}
                period={billingPeriod === "yearly" ? "Year" : "Month"}
                features={plan.features}
                isPopular={plan.isPopular}
                isCurrentPlan={plan.isCurrentPlan}
                isComingSoon={plan.isComingSoon}
                onSelect={() => handlePlanSelect(plan.id)}
              />
              
              {/* Expandable What's Included */}
              <Collapsible
                open={expandedPlan === plan.id}
                onOpenChange={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <CollapsibleTrigger className="w-full mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">What's Included</span>
                  {expandedPlan === plan.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-dr-teal rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        {/* Billing Information */}
        {user?.subscriptionTier !== "free" && (
          <div className="mt-8 bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Your Billing Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription Plan</span>
                <span className="font-medium capitalize">{user?.subscriptionTier} Plan Subscription</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Period</span>
                <span className="font-medium capitalize">
                  {user?.billingPeriod} (Renews on {user?.nextBillingDate ? new Date(user.nextBillingDate).toLocaleDateString() : "N/A"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">Visa ****1234</span>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        {billingHistory && billingHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Billing History</h3>
              <Download className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {billingHistory.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">Invoice #{bill.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(bill.billingDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${bill.amount}</p>
                    <p className="text-xs text-green-600 capitalize">{bill.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
