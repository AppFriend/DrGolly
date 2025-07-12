import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Shipping() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Products</h2>
              <p className="text-gray-700 text-base mb-4">
                All Dr Golly sleep programs and courses are digital products delivered instantly upon purchase. No physical shipping is required.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instant Access</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Delivery Method:</strong> Digital download and online access
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Delivery Time:</strong> Immediate (within minutes of purchase)
                </p>
                <p className="text-gray-700">
                  <strong>Access:</strong> Available 24/7 from your account dashboard
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Access Your Purchase</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#6B9CA3] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Complete Your Purchase</h3>
                    <p className="text-gray-700">After successful payment, you'll receive a confirmation email.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-[#6B9CA3] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Log into Your Account</h3>
                    <p className="text-gray-700">Use your email and password to access your Dr Golly account.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-[#6B9CA3] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Access Your Course</h3>
                    <p className="text-gray-700">Navigate to "Courses" to find your purchased programs.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Downloadable Resources</h2>
              <p className="text-gray-700 text-base mb-4">
                Many of our courses include downloadable PDFs, worksheets, and resources that you can save to your device for offline access.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Issues</h2>
              <p className="text-gray-700 text-base mb-4">
                If you're having trouble accessing your purchased content:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Check your email for the purchase confirmation</li>
                <li>Ensure you're logging in with the correct email address</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try accessing from a different browser or device</li>
                <li>Contact our support team at support@drgolly.com</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lifetime Access</h2>
              <p className="text-gray-700 text-base mb-4">
                Once purchased, you have lifetime access to your Dr Golly courses. You can return to the content anytime, on any device, as your family's needs change.
              </p>
            </div>

            <div className="bg-[#6B9CA3] p-4 rounded-lg">
              <p className="text-white text-sm">
                <strong>Need Help?</strong> If you have any questions about accessing your digital products, please contact our support team at support@drgolly.com. We're here to help ensure you get the most out of your Dr Golly experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}