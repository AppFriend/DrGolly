import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Shield, Star, Users, Clock, Award, CreditCard, Smartphone, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CouponInput } from "@/components/CouponInput";
import { WelcomeBackPopup } from "@/components/WelcomeBackPopup";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import paymentLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";
import appleLogo from "@assets/apple_1752294500140.png";
import linkLogo from "@assets/Link_1752294500139.png";
import afterpayLogo from "@assets/Afterpay_Badge_BlackonMint_1752294624500.png";
import moneyBackGuarantee from "@assets/money-back-guarantee.png";

// Clean checkout system - no Stripe Elements mounted on this page

// Testimonial data
const testimonials = [
  {
    name: "Kristiana E",
    review: "Dr Golly's program has helped me get my baby to have much more quality and long lasting sleeps. I'm so happy that I stumbled across this program especially as a new parent.",
    program: "Big baby sleep program"
  },
  {
    name: "Sigourney S", 
    review: "Toddler sleep felt impossible, bedtime battles, night wakes, early starts... we were all exhausted. The Dr Golly Toddler Program gave us the tools (and confidence) to create calm, consistent routines that actually work.",
    program: "Toddler sleep program"
  },
  {
    name: "Sarah M",
    review: "Within 3 days of implementing the techniques, our 6-month-old was sleeping through the night. The program is clear, evidence-based, and actually works!",
    program: "Big baby sleep program"
  },
  {
    name: "Jennifer L",
    review: "I was skeptical at first, but Dr Golly's approach is so gentle and effective. My toddler now goes to bed without fights and sleeps 11 hours straight!",
    program: "Toddler sleep program"
  }
];

// TestimonialCarousel Component
function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-full flex-shrink-0 border-b pb-4">
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-2 text-sm leading-relaxed">"{testimonial.review}"</p>
              <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
              <p className="text-xs text-gray-500">{testimonial.program}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#6B9CA3]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Big Baby course details
const BIG_BABY_COURSE = {
  id: 6,
  title: "Big baby sleep program",
  description: "A comprehensive sleep program designed specifically for babies over 6 months old",
  thumbnailUrl: "/attached_assets/IMG_5167_1752574749114.jpeg"
};

// Main component
export default function BigBabyPublic() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customerDetails, setCustomerDetails] = useState({
    email: "",
    firstName: "",
    dueDate: "",
  });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });

  const originalPrice = regionalPricing?.coursePrice || 120;
  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';
  
  const finalPrice = appliedCoupon ? 
    appliedCoupon.amount_off ? parseFloat((originalPrice - (appliedCoupon.amount_off / 100)).toFixed(2)) :
    appliedCoupon.percent_off ? parseFloat((originalPrice * (1 - appliedCoupon.percent_off / 100)).toFixed(2)) :
    originalPrice : originalPrice;

  const handleDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const canProceedToPayment = customerDetails.email && customerDetails.firstName;
  
  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const shouldShowEmailWarning = customerDetails.email && !isValidEmail(customerDetails.email);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-[#095D66] px-4 py-4" style={{ borderBottomWidth: '0.5px' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
          <p className="text-black font-medium text-lg ml-1" style={{ paddingLeft: '5px' }}>You're one step closer to better sleep for your baby!</p>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left Column - Your Details & Payment */}
          <div className="space-y-4">
            {/* Your Details Section */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">YOUR DETAILS</h2>
              
              <div className="space-y-3">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={customerDetails.email}
                    onChange={(e) => handleDetailsChange("email", e.target.value)}
                    className="h-12"
                  />
                  {shouldShowEmailWarning && (
                    <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
                  )}
                </div>
                
                <div>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={customerDetails.firstName}
                    onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div>
                  <Input
                    id="dueDate"
                    type="date"
                    placeholder="Due date or baby's birthday"
                    value={customerDetails.dueDate}
                    onChange={(e) => handleDetailsChange("dueDate", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#6B9CA3]">ORDER SUMMARY</h2>
                <button
                  onClick={() => setOrderExpanded(!orderExpanded)}
                  className="text-[#6B9CA3] hover:text-[#5A8B91]"
                >
                  {orderExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
              
              <div className={`space-y-4 ${orderExpanded ? 'block' : 'hidden'}`}>
                <div className="flex items-start space-x-3">
                  <img 
                    src={BIG_BABY_COURSE.thumbnailUrl} 
                    alt={BIG_BABY_COURSE.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{BIG_BABY_COURSE.title}</h3>
                    <p className="text-sm text-gray-600">{BIG_BABY_COURSE.description}</p>
                    <p className="text-sm font-medium">{currencySymbol}{originalPrice}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Coupon Input */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Have a coupon or gift card?</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <CouponInput
                    onCouponApplied={setAppliedCoupon}
                    onCouponRemoved={() => setAppliedCoupon(null)}
                    appliedCoupon={appliedCoupon}
                  />
                </div>
                
                <div className="border-t pt-4">
                  {appliedCoupon && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Discount ({appliedCoupon.name})</span>
                      <span className="text-sm text-green-600">
                        -{currencySymbol}{(appliedCoupon.amount_off ? 
                          (appliedCoupon.amount_off / 100).toFixed(2) : 
                          (originalPrice * appliedCoupon.percent_off / 100).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total (incl. GST)</span>
                    <span className="text-lg font-semibold">{currencySymbol}{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section - Redirect to clean checkout */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">PAYMENT</h2>
              <Button 
                onClick={() => {
                  if (canProceedToPayment) {
                    // Store customer details in localStorage to pass to checkout
                    localStorage.setItem('big-baby-customer-details', JSON.stringify(customerDetails));
                    localStorage.setItem('big-baby-applied-coupon', JSON.stringify(appliedCoupon));
                    setLocation('/big-baby-checkout');
                  }
                }}
                className="w-full bg-[#095D66] text-white hover:bg-[#0A525A] h-12 text-base font-medium"
                disabled={!canProceedToPayment}
              >
                Continue to Payment
              </Button>
              {!canProceedToPayment && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Please complete your email and first name above to continue
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Empty on desktop or additional content */}
          <div className="space-y-4 hidden lg:block">
            {/* This column can be used for additional content or left empty */}
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 mb-4 border border-teal-100">
          <div className="flex items-center space-x-3">
            <img src={moneyBackGuarantee} alt="30 Days Money Back Guarantee" className="h-12 w-12" />
            <div>
              <p className="font-semibold">No results after completing the program?</p>
              <p className="text-sm text-gray-600">Get a full refund within 30 days! <Info className="h-4 w-4 inline ml-1" /></p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-xl font-semibold mb-4 text-center">Let customers speak for us</h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-[#6B9CA3] text-white p-6 rounded-lg">
              <div className="text-4xl font-bold">4.85</div>
              <div className="flex text-yellow-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Based on 775 reviews</p>
              <p className="text-sm text-gray-600">Excellent on Reviews</p>
            </div>
          </div>

          <TestimonialCarousel />
        </div>

        {/* Footer Links */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <a href="/contact" className="text-[#6B9CA3] hover:underline block">Contact & Support</a>
              <a href="/shipping" className="text-[#6B9CA3] hover:underline block">Shipping Policy</a>
              <a href="/terms" className="text-[#6B9CA3] hover:underline block">Terms of Service</a>
            </div>
            <div className="space-y-2">
              <a href="/privacy" className="text-[#6B9CA3] hover:underline block">Privacy Policy</a>
              <a href="/refunds" className="text-[#6B9CA3] hover:underline block">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>

      {showWelcomePopup && (
        <WelcomeBackPopup onClose={() => setShowWelcomePopup(false)} />
      )}
    </div>
  );
}