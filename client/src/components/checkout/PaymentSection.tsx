// Payment section component for checkout-new
import { CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { Label } from '@/components/ui/label';

interface PaymentSectionProps {
  isLoading?: boolean;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
      padding: '12px',
    },
    invalid: {
      color: '#EF4444',
    },
  },
};

export function PaymentSection({ isLoading }: PaymentSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Loading payment form...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
          <CardNumberElement
            id="cardNumber"
            options={cardElementOptions}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cardExpiry">Expiry Date</Label>
          <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
            <CardExpiryElement
              id="cardExpiry"
              options={cardElementOptions}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="cardCvc">CVC</Label>
          <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
            <CardCvcElement
              id="cardCvc"
              options={cardElementOptions}
            />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Your payment information is secure and encrypted.
      </div>
    </div>
  );
}