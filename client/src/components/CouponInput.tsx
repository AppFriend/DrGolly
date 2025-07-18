import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CouponInputProps {
  onCouponApplied: (coupon: any) => void;
  onCouponRemoved: () => void;
  appliedCoupon: any;
  disabled?: boolean;
}

export function CouponInput({ 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon, 
  disabled = false 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/validate-coupon', { couponCode: code });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        onCouponApplied(data.coupon);
        setCouponCode('');
        toast({
          title: "Coupon Applied!",
          description: `${data.coupon.name} - ${data.coupon.percent_off ? `${data.coupon.percent_off}% off` : `$${(data.coupon.amount_off / 100).toFixed(2)} off`}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Coupon",
        description: error.message || "Please check the coupon code and try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim() && !appliedCoupon) {
      validateCouponMutation.mutate(couponCode.trim().toUpperCase());
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
    });
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {appliedCoupon.name || 'Discount Applied'}
              </p>
              <p className="text-xs text-green-600">
                {appliedCoupon.percent_off 
                  ? `${appliedCoupon.percent_off}% off` 
                  : `$${(appliedCoupon.amount_off / 100).toFixed(2)} off`
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            disabled={disabled}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleApplyCoupon} className="flex space-x-2">
        <Input
          placeholder="Enter coupon code (e.g., CODE-123)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={disabled || validateCouponMutation.isPending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!couponCode.trim() || disabled || validateCouponMutation.isPending}
          className="bg-[#095D66] hover:bg-[#074A52] text-white"
        >
          {validateCouponMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </form>
      <p className="text-xs text-gray-500">
        Have a coupon code? Enter it above to get your discount.
      </p>
    </div>
  );
}