import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <img 
                src={drGollyLogo} 
                alt="Dr. Golly" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dr Golly Sleep Program</h2>
            
            <p className="text-gray-700 mb-6">
              We do not collect personally identifiable information about you unless you voluntarily submit such information to us, such as by filling out a survey or registering for certain services. The information we collect is used to improve the content of our website and to customize the content and layout of our pages for each individual visitor.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            
            <p className="text-gray-700 mb-4">
              We may collect the following types of information:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Personal information you provide when creating an account or purchasing courses</li>
              <li>Usage information about how you interact with our services</li>
              <li>Technical information such as your IP address, browser type, and device information</li>
              <li>Information about your child's development and sleep patterns (when you choose to track this)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Provide and improve our services</li>
              <li>Process payments and deliver purchased content</li>
              <li>Send you important updates about your account and our services</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve our platform</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
            
            <p className="text-gray-700 mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>With your explicit consent</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and the safety of our users</li>
              <li>With service providers who help us operate our platform (under strict confidentiality agreements)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            
            <p className="text-gray-700 mb-6">
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. While we help parents track their children's development, all accounts are created and managed by adults.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            
            <p className="text-gray-700 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            
            <p className="text-gray-700">
              Email: privacy@drgolly.com<br />
              Address: [Your Business Address]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}