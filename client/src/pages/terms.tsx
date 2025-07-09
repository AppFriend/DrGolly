import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <img src={drGollyLogo} alt="Dr Golly" className="h-12" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing and using the Dr Golly platform, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
                <p className="text-gray-700">
                  Permission is granted to temporarily download one copy of the materials on Dr Golly's website for 
                  personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  <li>modify or copy the materials;</li>
                  <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
                  <li>attempt to decompile or reverse engineer any software contained on Dr Golly's website;</li>
                  <li>remove any copyright or other proprietary notations from the materials.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Disclaimer</h2>
                <p className="text-gray-700">
                  The materials on Dr Golly's website are provided on an 'as is' basis. Dr Golly makes no warranties, 
                  expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
                  implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                  of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Medical Disclaimer</h2>
                <p className="text-gray-700">
                  The information provided on this platform is for educational purposes only and is not intended as a 
                  substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your 
                  physician or other qualified health provider with any questions you may have regarding a medical condition.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Limitations</h2>
                <p className="text-gray-700">
                  In no event shall Dr Golly or its suppliers be liable for any damages (including, without limitation, 
                  damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                  to use the materials on Dr Golly's website, even if Dr Golly or a Dr Golly authorized representative has 
                  been notified orally or in writing of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Accuracy of Materials</h2>
                <p className="text-gray-700">
                  The materials appearing on Dr Golly's website could include technical, typographical, or photographic 
                  errors. Dr Golly does not warrant that any of the materials on its website are accurate, complete, or current.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Links</h2>
                <p className="text-gray-700">
                  Dr Golly has not reviewed all of the sites linked to our website and is not responsible for the contents 
                  of any such linked site. The inclusion of any link does not imply endorsement by Dr Golly of the site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Modifications</h2>
                <p className="text-gray-700">
                  Dr Golly may revise these terms of service for its website at any time without notice. By using this 
                  website, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
                <p className="text-gray-700">
                  These terms and conditions are governed by and construed in accordance with the laws of Australia and 
                  you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Privacy Policy</h2>
                <p className="text-gray-700">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the 
                  website, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Subscription Terms</h2>
                <p className="text-gray-700">
                  Subscription fees are billed in advance on a monthly or yearly basis and are non-refundable. You may 
                  cancel your subscription at any time, but no refunds will be provided for unused portions of your subscription.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
                <p className="text-gray-700">
                  If you have any questions about these Terms of Service, please contact us at support@drgolly.com.
                </p>
              </section>

              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  Last updated: July 2025
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}