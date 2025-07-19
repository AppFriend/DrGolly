// Dedicated coupon field component for checkout-new
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CouponFieldProps {
  onCouponApplied: (couponCode: string, discount: number) => void;
  productPrice: number;
  disabled?: boolean;
}

export function CouponField({ onCouponApplied, productPrice, disabled }: CouponFieldProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const { toast } = useToast();

  const applyCoupon = async () => {
    if (!couponCode.trim() || disabled) return;
    
    setIsValidating(true);
    
    try {
      const response = await apiRequest('POST', '/api/checkout-new/validate-coupon', {
        couponCode: couponCode.trim(),
        amount: productPrice
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setAppliedCoupon(couponCode.trim());
        onCouponApplied(couponCode.trim(), data.discountAmount);
        
        toast({
          title: "Coupon Applied",
          description: `Saved $${data.discountAmount.toFixed(2)}!`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate coupon code.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    onCouponApplied('', 0);
    
    toast({
      title: "Coupon Removed",
      description: "Coupon code has been removed.",
    });
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="couponCode">Promo Code</Label>
      <div className="flex gap-2">
        <Input
          id="couponCode"
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Enter coupon code"
          className="flex-1"
          disabled={disabled || isValidating}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyCoupon();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={appliedCoupon ? removeCoupon : applyCoupon}
          variant={appliedCoupon ? "destructive" : "outline"}
          disabled={(!couponCode.trim() && !appliedCoupon) || disabled || isValidating}
        >
          {isValidating ? 'Checking...' : appliedCoupon ? 'Remove' : 'Apply'}
        </Button>
      </div>
      
      {appliedCoupon && (
        <div className="text-sm text-green-600 font-medium">
          ✓ Coupon "{appliedCoupon}" applied successfully
        </div>
      )}
    </div>
  );
}