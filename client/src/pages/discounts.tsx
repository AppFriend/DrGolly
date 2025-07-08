import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Tag } from "lucide-react";
import { DiscountCard } from "@/components/ui/discount-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { PartnerDiscount } from "@shared/schema";

const discountTabs = [
  { id: "partner", label: "Partner Deals", active: true },
  { id: "shopping", label: "Shopping", active: false },
];

export default function Discounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("partner");

  const { data: discounts, isLoading, error } = useQuery({
    queryKey: ["/api/discounts", user?.subscriptionTier],
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
        {user?.subscriptionTier === "free" && (
          <div className="bg-dr-teal/10 border border-dr-teal/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Tag className="h-5 w-5 text-dr-teal" />
              <h3 className="font-semibold text-dr-teal">Unlock Partner Discounts</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade to Gold or Platinum to access exclusive partner discounts and save on trusted brands.
            </p>
            <Button
              onClick={() => window.location.href = "/subscription"}
              className="bg-dr-teal hover:bg-dr-teal-dark text-white"
            >
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Partner Deals */}
        <div className="space-y-4">
          {discounts?.map((discount: PartnerDiscount) => (
            <DiscountCard
              key={discount.id}
              discount={discount}
              onClaim={() => handleClaimDiscount(discount)}
            />
          ))}
        </div>

        {discounts?.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discounts Available</h3>
            <p className="text-gray-500">
              {user?.subscriptionTier === "free" 
                ? "Upgrade your subscription to access partner discounts."
                : "Check back later for new partner deals."}
            </p>
          </div>
        )}

        {/* Coming Soon Section */}
        {activeTab === "shopping" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">More Shopping Deals Coming Soon</h3>
            <p className="text-gray-500">
              We're working on bringing you even more amazing deals from our partners.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
