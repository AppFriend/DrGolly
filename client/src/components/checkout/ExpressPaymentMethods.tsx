import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import { Product } from '@/types/product';

interface ExpressPaymentMethodsProps {
  product: Product;
  customerDetails: any;
  onPaymentSuccess: (paymentMethod: any) => void;
}

export function ExpressPaymentMethods({ product, customerDetails, onPaymentSuccess }: ExpressPaymentMethodsProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: product.currency.toLowerCase(),
      total: {
        label: product.name,
        amount: Math.round(product.price * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if Payment Request is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        // Create payment intent on the server
        const response = await fetch('/api/checkout-new/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            customerDetails: {
              email: ev.payerEmail,
              firstName: ev.payerName?.split(' ')[0] || '',
              lastName: ev.payerName?.split(' ').slice(1).join(' ') || '',
              phone: ev.payerPhone || '',
            },
            paymentMethodId: ev.paymentMethod.id,
          }),
        });

        const { clientSecret } = await response.json();

        // Confirm the payment intent
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        if (error) {
          ev.complete('fail');
        } else {
          ev.complete('success');
          onPaymentSuccess(paymentIntent);
        }
      } catch (error) {
        console.error('Express payment error:', error);
        ev.complete('fail');
      }
    });
  }, [stripe, product, onPaymentSuccess]);

  if (!paymentRequest) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="text-center mb-4">
        <PaymentRequestButtonElement 
          options={{ paymentRequest }}
          className="express-checkout-element"
        />
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or pay with card</span>
        </div>
      </div>
    </div>
  );
}