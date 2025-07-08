import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  title: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isComingSoon?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function PlanCard({
  title,
  description,
  price,
  period,
  features,
  isPopular,
  isCurrentPlan,
  isComingSoon,
  onSelect,
  className
}: PlanCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      isPopular ? "border-2 border-dr-teal relative" : "border border-gray-200",
      isComingSoon && "opacity-60",
      className
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-dr-teal text-white px-3 py-1 rounded-full text-xs font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {isCurrentPlan && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Current Plan
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className="flex items-baseline mb-4">
        <span className="text-3xl font-bold text-gray-900">${price}</span>
        <span className="text-sm text-gray-500 ml-1">/{period}</span>
      </div>
      
      <Button
        onClick={onSelect}
        disabled={isComingSoon}
        className={cn(
          "w-full mb-4",
          isPopular ? "bg-dr-teal hover:bg-dr-teal-dark" : "",
          isComingSoon ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""
        )}
        variant={isPopular ? "default" : "outline"}
      >
        {isComingSoon ? "Coming Soon" : "Get Started"}
      </Button>
      
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-gray-600">
            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
