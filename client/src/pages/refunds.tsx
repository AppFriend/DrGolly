import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Refunds() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        <button onClick={handleBack} className="mr-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">30-Day Money-Back Guarantee</h2>
              <p className="text-gray-700 text-base mb-4">
                We're so confident in our sleep programs that we offer a 30-day money-back guarantee. If you don't see results after completing the program, we'll provide a full refund within 30 days of purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
              <div className="text-gray-700 text-base space-y-2">
                <p>To request a refund, please contact our support team with the following information:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your full name and email address used for purchase</li>
                  <li>Order number or transaction ID</li>
                  <li>Reason for refund request</li>
                  <li>Evidence of program completion (if applicable)</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing Time</h2>
              <p className="text-gray-700 text-base mb-4">
                Once your refund request is approved, it will be processed within 5-7 business days. The refund will be issued to the original payment method used for the purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Product Policy</h2>
              <p className="text-gray-700 text-base mb-4">
                As our courses are digital products, refunds are granted at our discretion. We encourage you to reach out to our support team if you're experiencing any difficulties with the program before requesting a refund.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Cancellations</h2>
              <p className="text-gray-700 text-base mb-4">
                For subscription-based services, you can cancel your subscription at any time through your account settings. No refunds will be provided for partial subscription periods, but you will continue to have access until the end of your current billing period.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 text-base mb-4">
                If you have any questions about our refund policy or need to request a refund, please contact our support team:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@drgolly.com<br />
                  <strong>Response Time:</strong> Within 24 hours
                </p>
              </div>
            </div>

            <div className="bg-[#6B9CA3] p-4 rounded-lg">
              <p className="text-white text-sm">
                This refund policy was last updated on July 12, 2025. We reserve the right to modify this policy at any time. Any changes will be posted on this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}