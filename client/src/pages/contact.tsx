import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Contact() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact & Support</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-gray-700 text-base mb-4">
                We're here to help! Whether you have questions about our sleep programs, need technical support, or want to share feedback, our team is ready to assist you.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Email Support</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> support@drgolly.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Response Time:</strong> Within 24 hours
                </p>
                <p className="text-gray-700">
                  <strong>Hours:</strong> Monday - Friday, 9 AM - 5 PM (AEDT)
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-[#6B9CA3] pl-4">
                  <h3 className="font-semibold text-gray-900">How do I access my purchased course?</h3>
                  <p className="text-gray-700">Once purchased, your course will appear in your "Courses" section. You can access it anytime from your dashboard.</p>
                </div>
                <div className="border-l-4 border-[#6B9CA3] pl-4">
                  <h3 className="font-semibold text-gray-900">Can I get a refund?</h3>
                  <p className="text-gray-700">Yes! We offer a 30-day money-back guarantee. See our <a href="/refunds" className="text-[#095D66] underline">refund policy</a> for details.</p>
                </div>
                <div className="border-l-4 border-[#6B9CA3] pl-4">
                  <h3 className="font-semibold text-gray-900">How do I reset my password?</h3>
                  <p className="text-gray-700">Click "Forgot Password" on the login page, and we'll send you a reset link via email.</p>
                </div>
                <div className="border-l-4 border-[#6B9CA3] pl-4">
                  <h3 className="font-semibold text-gray-900">Can I share my account with family members?</h3>
                  <p className="text-gray-700">Yes! Use our family sharing feature to add multiple family members to your account.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technical Support</h2>
              <p className="text-gray-700 text-base mb-4">
                If you're experiencing technical issues with the app, please include the following information when contacting us:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Device type and operating system</li>
                <li>Browser version (if using web app)</li>
                <li>Description of the issue</li>
                <li>Screenshot or error message (if applicable)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback & Suggestions</h2>
              <p className="text-gray-700 text-base mb-4">
                We value your feedback! Help us improve by sharing your thoughts, suggestions, or feature requests. Your input helps us make the Dr Golly app better for all families.
              </p>
            </div>

            <div className="bg-[#6B9CA3] p-4 rounded-lg">
              <p className="text-white text-sm">
                <strong>Dr. Daniel Golshevsky</strong> - Pediatric Sleep Specialist<br />
                Our team is committed to helping families achieve better sleep through evidence-based approaches and compassionate support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}