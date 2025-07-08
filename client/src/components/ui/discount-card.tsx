import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PartnerDiscount } from "@shared/schema";

interface DiscountCardProps {
  discount: PartnerDiscount;
  onClaim?: () => void;
  className?: string;
}

export function DiscountCard({ discount, onClaim, className }: DiscountCardProps) {
  const getDiscountText = () => {
    if (discount.discountPercentage) {
      return `${discount.discountPercentage}% Off`;
    }
    if (discount.discountAmount) {
      return `$${discount.discountAmount} Off`;
    }
    return "Special Offer";
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl p-4 border border-gray-100 flex items-center space-x-4 transition-all duration-300 hover:shadow-md",
      className
    )}>
      <div className="w-16 h-16 bg-gradient-to-br from-dr-teal to-dr-teal-dark rounded-xl flex items-center justify-center flex-shrink-0">
        {discount.logoUrl ? (
          <img
            src={discount.logoUrl}
            alt={`${discount.partnerName} logo`}
            className="w-12 h-12 object-contain rounded-lg"
          />
        ) : (
          <span className="text-white font-bold text-sm text-center">
            {discount.partnerName}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {getDiscountText()} - Code: {discount.discountCode}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {discount.description}
        </p>
        <Button
          onClick={onClaim}
          size="sm"
          className="bg-dr-teal hover:bg-dr-teal-dark"
        >
          Claim Offer
        </Button>
      </div>
      
      <div className="w-6 h-6 bg-dr-teal rounded-full flex items-center justify-center flex-shrink-0">
        <Lock className="h-3 w-3 text-white" />
      </div>
    </div>
  );
}
