import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { CouponData } from '@/types/checkout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CouponFieldProps {
  appliedCoupon: CouponData | null;
  onCouponApplied: (coupon: CouponData | null) => void;
  productId: string;
}

export function CouponField({ appliedCoupon, onCouponApplied, productId }: CouponFieldProps) {
  const [showField, setShowField] = useState(true); // Expanded by default as per prompt
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/validate-coupon', {
        code: couponCode,
        productId
      });
      
      const couponData = await response.json();
      
      if (couponData.valid) {
        onCouponApplied(couponData);
        toast({
          title: "Coupon Applied!",
          description: `${couponData.percent_off ? `${couponData.percent_off}% discount` : `$${(couponData.amount_off / 100).toFixed(2)} discount`} has been applied.`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "The coupon code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = () => {
    onCouponApplied(null);
    setCouponCode('');
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setShowField(!showField)}
        className="flex items-center space-x-2 text-gray-600 text-sm mb-3"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showField ? 'rotate-180' : ''}`} />
        <span>Have a coupon or gift card?</span>
      </button>
      
      {showField && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter coupon code (try CHECKOUT-99)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={applyCoupon}
              disabled={isLoading || !couponCode.trim()}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          
          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm bg-green-50 p-3 rounded border">
              <span className="text-green-700">
                ✓ Coupon: {appliedCoupon.code} 
                ({appliedCoupon.percent_off ? `${appliedCoupon.percent_off}% off` : `$${(appliedCoupon.amount_off! / 100).toFixed(2)} off`})
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}