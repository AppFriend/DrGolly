import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Tag, Lock } from "lucide-react";
import { DiscountCard } from "@/components/ui/discount-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { PartnerDiscount } from "@shared/schema";

const discountTabs = [
  { id: "partner", label: "Partner Deals", active: true },
  { id: "shopping", label: "Shopping", active: false },
];

export default function Discounts() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const { toast } = useToast();
  const { hasAccess } = useFeatureAccess();
  const [activeTab, setActiveTab] = useState("partner");
  
  const hasDiscountAccess = hasAccess("discounts");

  const { data: discounts, isLoading, error } = useQuery({
    queryKey: ["/api/discounts", user?.subscriptionTier],
    enabled: !!user && hasDiscountAccess,
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

  const handleClaimDiscount = (discount: PartnerDiscount) => {
    if (user?.subscriptionTier === "free") {
      toast({
        title: "Subscription Required",
        description: "Partner discounts require a Gold or Platinum subscription.",
        variant: "destructive",
      });
      return;
    }

    // Copy discount code to clipboard
    navigator.clipboard.writeText(discount.discountCode);
    toast({
      title: "Discount Code Copied!",
      description: `${discount.discountCode} has been copied to your clipboard.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dr-bg">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold flex items-center">
            Our Partners, Your Perks!
            <Sparkles className="h-5 w-5 ml-2 text-dr-teal" />
          </h1>
          <span className="text-sm text-dr-teal font-medium">Shopping</span>
        </div>
        <p className="text-sm text-gray-600">
          Enjoy exclusive year-long discounts with our most trusted brands
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {discountTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-dr-teal text-white shadow-sm"
                  : "text-gray-600 hover:text-dr-teal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discount Content */}
      <div className="p-4">
        {!hasDiscountAccess ? (
          <div className="space-y-6">
            {/* Upgrade Card */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-dr-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-dr-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Unlock Partner Discounts
              </h3>
              <p className="text-gray-600 mb-6">
                Upgrade to Gold or Platinum to access exclusive partner discounts and save on trusted brands.
              </p>
              <Button
                onClick={() => openUpgradeModal("discounts")}
                className="bg-dr-teal hover:bg-dr-teal/90 text-white px-8 py-2 rounded-full"
              >
                Upgrade Now
              </Button>
            </div>

            {/* Sample Discounts (Locked) */}
            <div className="space-y-4 opacity-50">
              <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/80 z-10"></div>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">20% Off - Code: SYM-AXL</h4>
                    <p className="text-sm text-gray-600">20% Off with Your Code: SYM-AXL</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-dr-teal text-white border-dr-teal rounded-full px-4"
                    disabled
                  >
                    Claim Offer
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/80 z-10"></div>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">$20.00 Off - Code: GOLLY-PLATINUM-NX7K</h4>
                    <p className="text-sm text-gray-600">$20 Off Your First Order. Your Code: GOLLY-PLATINUM-NX7K</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-dr-teal text-white border-dr-teal rounded-full px-4"
                    disabled
                  >
                    Claim Offer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {discounts?.map((discount) => (
              <DiscountCard
                key={discount.id}
                discount={discount}
                onClaim={() => handleClaimDiscount(discount)}
              />
            ))}

            {discounts?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No discounts available at this time.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
