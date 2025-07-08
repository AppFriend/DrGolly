import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, X } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (billingPeriod: "monthly" | "yearly") => void;
}

export function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const monthlyPrice = 199;
  const yearlyPrice = 99; // 50% discount
  const currentPrice = billingPeriod === "yearly" ? yearlyPrice : monthlyPrice;
  const originalPrice = billingPeriod === "yearly" ? monthlyPrice : null;

  const features = [
    "Everything in Free, plus...",
    "Unlimited access to all courses",
    "Free copy of the Dr Golly Book",
    "Growth tracking tools",
    "Loyalty program benefits",
    "Exclusive partner discounts",
    "Family sharing (up to 4 members)"
  ];

  const handleUpgrade = () => {
    onUpgrade(billingPeriod);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-6 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-[#6B9CA3]/10 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#6B9CA3]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Unlock with Gold
          </h2>
          
          <p className="text-gray-600 text-center">
            This feature is available as part of our Gold Subscription. Get unlimited access for{" "}
            <span className="font-semibold">${currentPrice}/month</span>.
          </p>
        </div>

        <div className="px-6 pb-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-6 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-1 ${
                billingPeriod === "monthly"
                  ? "bg-[#6B9CA3] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pay Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-1 relative ${
                billingPeriod === "yearly"
                  ? "bg-[#6B9CA3] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pay Yearly
              <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0 rounded-full">
                50% Off
              </Badge>
            </button>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ${originalPrice}
                  </span>
                )}
                <span className="text-3xl font-bold text-gray-900">
                  ${currentPrice}
                </span>
                <span className="text-gray-500">/Month</span>
              </div>
              {billingPeriod === "yearly" && (
                <Badge className="bg-green-500 text-white">
                  50% Off
                </Badge>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What&apos;s Included</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full bg-[#6B9CA3] hover:bg-[#6B9CA3]/90 text-white rounded-full py-3 font-semibold text-lg"
          >
            Upgrade to Gold
          </Button>
        </div>
      </div>
    </div>
  );
}