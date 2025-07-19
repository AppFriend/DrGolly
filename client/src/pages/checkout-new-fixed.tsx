import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/utils/stripeHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckoutNewFixed() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Big Baby Sleep Program
          </h1>
          <p className="text-lg text-gray-600">
            4-8 Months • $120 AUD
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                YOUR DETAILS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="date"
                  placeholder="Due Date/Baby Birthday"
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                PAYMENT
              </h2>
              <div className="space-y-4">
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Card Number</div>
                  <div className="text-gray-400">Credit card fields will load here...</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Expiry</div>
                    <div className="text-gray-400">MM/YY</div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">CVC</div>
                    <div className="text-gray-400">123</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
                ORDER SUMMARY
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Big Baby Sleep Program</span>
                  <span className="font-medium">$120.00</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>$120.00 AUD</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium"
                  size="lg"
                >
                  Complete Purchase
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}