import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";

interface CheckoutFormProps {
  course: Course;
  customerDetails: any;
  total: number;
}

export function CheckoutForm({ course, customerDetails, total }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?courseId=${course.id}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Payment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="credit-card"
              name="payment-method"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-dr-teal"
            />
            <label htmlFor="credit-card" className="flex items-center space-x-2">
              <span>💳</span>
              <span>Credit Card</span>
              <span className="text-xs text-gray-500">****1234</span>
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="afterpay"
              name="payment-method"
              value="afterpay"
              checked={paymentMethod === "afterpay"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-dr-teal"
            />
            <label htmlFor="afterpay" className="flex items-center space-x-2">
              <span>◯</span>
              <span>Afterpay</span>
              <img src="https://static.afterpay.com/button/afterpay-logo-colour.svg" alt="Afterpay" className="h-4" />
            </label>
          </div>
        </div>

        {/* Stripe Payment Element */}
        <div className="border rounded-lg p-3">
          <PaymentElement />
        </div>

        {/* Terms and Privacy */}
        <p className="text-xs text-gray-500">
          Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{" "}
          <a href="/privacy-policy" className="text-dr-teal underline">Privacy Policy</a>.
        </p>

        {/* Place Order Button */}
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white py-3 rounded-lg font-semibold"
        >
          {isProcessing ? "Processing..." : "Place order"}
        </Button>
      </form>
    </div>
  );
}