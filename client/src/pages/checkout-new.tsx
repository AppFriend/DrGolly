import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/utils/stripeHelpers';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export default function CheckoutNew() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}