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
  const yearlyPrice = 1188; // Annual price (99 * 12)
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
      <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6B9CA3] to-[#095D66] p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-br from-[#6B9CA3] to-[#095D66] rounded-full"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-center mb-2">
            Unlock Gold Features
          </h2>
          
          <p className="text-white/90 text-center text-sm">
            Get unlimited access to all courses, expert content, and exclusive partner discounts
          </p>
        </div>

        <div className="p-4">
          {/* Pricing Section */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {billingPeriod === "yearly" && (
                <span className="text-sm text-gray-500 line-through">${monthlyPrice}/month</span>
              )}
              <span className="text-3xl font-bold text-gray-900">${currentPrice}</span>
              <span className="text-gray-600">/month</span>
            </div>
            {billingPeriod === "yearly" && (
              <div className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Save 50% with yearly billing
              </div>
            )}
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-4 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 ${
                billingPeriod === "monthly"
                  ? "bg-[#6B9CA3] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 relative ${
                billingPeriod === "yearly"
                  ? "bg-[#6B9CA3] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">50% off</span>
            </button>
          </div>

          {/* Features */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">What&apos;s Included</h3>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 bg-[#6B9CA3] rounded-full flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-[#6B9CA3] to-[#095D66] hover:from-[#095D66] hover:to-[#6B9CA3] text-white font-semibold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Upgrade to Gold - ${billingPeriod === "yearly" ? `$${currentPrice}/year` : `$${currentPrice}/month`}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}