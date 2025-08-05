import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Trash2, Star, Check, Info } from 'lucide-react';
import { PaymentForm } from '@/pages/checkout';
import { CouponInput } from '@/components/CouponInput';
import { CartItem, ShoppingProduct, Course } from '@/types';

import drGollyLogo from '@assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png';
import moneyBackGuarantee from '@assets/Green Card_1752110693736.gif';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CartCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.firstName || "",
    email: user?.email || "",
    dueDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [orderExpanded, setOrderExpanded] = useState(true);

  const testimonials = [
    {
      name: "Kristiana E",
      rating: 5,
      text: "Dr Golly's program has helped me get my baby to have much more quality and long lasting sleeps. I'm so happy that I stumbled across this program especially as a new parents."
    },
    {
      name: "Sarah M",
      rating: 5,
      text: "Amazing results! My little one went from waking up every 2 hours to sleeping through the night in just 2 weeks. The gentle approach really worked for us."
    },
    {
      name: "Emma L",
      rating: 5,
      text: "I was skeptical at first, but Dr Golly's methods are evidence-based and really work. My baby is now sleeping 10-12 hours straight!"
    },
    {
      name: "Rachel K",
      rating: 5,
      text: "The step-by-step approach made it so easy to follow. Within days we saw improvements in our baby's sleep patterns. Highly recommend!"
    }
  ];

  // Auto-advance testimonials every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery({
    queryKey: ["/api/regional-pricing"],
    retry: false,
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  // Fetch shopping products for cart items
  const { data: shoppingProducts = [] } = useQuery<ShoppingProduct[]>({
    queryKey: ['/api/shopping-products'],
    enabled: cartItems.length > 0,
  });

  // Fetch courses for cart items
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: cartItems.length > 0,
  });

  const currency = regionalPricing?.currency || 'USD';
  const currencySymbol = currency === 'AUD' ? '$' : currency === 'USD' ? '$' : '€';

  // Calculate total for cart items
  const getItemDetails = (item: CartItem) => {
    if (item.itemType === 'course') {
      const course = courses.find(c => c.id === item.itemId);
      return course ? {
        title: course.title,
        description: course.description,
        price: course.price || regionalPricing?.coursePrice || 120,
        author: "Dr. Daniel Golshevsky",
        image: course.thumbnailUrl ? course.thumbnailUrl.replace('/assets/', '/attached_assets/') : null
      } : null;
    } else if (item.itemType === 'product') {
      const product = shoppingProducts.find(p => p.id === item.itemId);
      return product ? {
        title: product.title,
        description: product.description,
        price: product.price,
        author: "Dr. Golly",
        image: product.imageUrl
      } : null;
    }
    return null;
  };

  const basePrice = cartItems.reduce((total, item) => {
    const itemDetails = getItemDetails(item);
    return total + (itemDetails ? itemDetails.price * item.quantity : 0);
  }, 0);

  const discountAmount = appliedCoupon ? 
    (appliedCoupon.amount_off ? 
      appliedCoupon.amount_off / 100 : 
      basePrice * appliedCoupon.percent_off / 100) : 0;

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: "Your cart items have been purchased successfully.",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to checkout</h2>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart to proceed with checkout.</p>
          <Button onClick={() => window.location.href = '/courses'}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={drGollyLogo} alt="Dr Golly Sleep" className="h-8 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Cart Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Customer Details */}
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">CONFIRM YOUR DETAILS</h2>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9CA3]"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={customerDetails.firstName}
                    onChange={(e) => setCustomerDetails({...customerDetails, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9CA3]"
                  />
                  <div className="relative">
                    <input
                      type="date"
                      value={customerDetails.dueDate}
                      onChange={(e) => setCustomerDetails({...customerDetails, dueDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9CA3] text-transparent"
                      style={{ 
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
                      onFocus={(e) => {
                        e.target.style.color = 'rgb(17, 24, 39)';
                      }}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          e.target.style.color = 'transparent';
                        }
                      }}
                    />
                    {!customerDetails.dueDate && (
                      <div className="absolute inset-0 flex items-center px-4 pointer-events-none text-gray-500 bg-white">
                        Date of Birth / Due Date
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary and Payment */}
            <div className="space-y-6">
              {/* Your Order Section */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#6B9CA3]">YOUR ORDER - {currencySymbol}{finalPrice.toFixed(2)}</h2>
                  <ChevronUp className="h-5 w-5" />
                </div>
                
                <div className="space-y-4">
                  {/* Cart Items */}
                  {cartItems.map((item) => {
                    const itemDetails = getItemDetails(item);
                    if (!itemDetails) return null;
                    
                    return (
                      <div key={item.id} className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                          {itemDetails.image ? (
                            <img 
                              src={itemDetails.image} 
                              alt={itemDetails.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#83CFCC] rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">COURSE</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{itemDetails.title}</h3>
                          <p className="text-sm text-gray-600">by {itemDetails.author}</p>
                          <p className="text-sm font-medium">{currencySymbol}{itemDetails.price.toFixed(2)}</p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  
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
                          -{currencySymbol}{discountAmount.toFixed(2)}
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

              {/* Payment Section */}
              <div className="bg-white rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4 text-[#6B9CA3]">PAYMENT</h2>
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    coursePrice={finalPrice}
                    currencySymbol={currencySymbol}
                    currency={currency}
                    customerDetails={customerDetails}
                    appliedCoupon={appliedCoupon}
                    course={null} // No single course for cart checkout
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </div>
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

            {/* Testimonial Carousel */}
            <div className="relative min-h-[150px]">
              <div className="border-b pb-4">
                <div className="flex items-center space-x-1 mb-2">
                  <span className="font-medium">{testimonials[currentTestimonial].name}</span>
                  <div className="flex text-yellow-400">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Verified Customer</span>
                </div>
                <p className="text-sm">
                  {testimonials[currentTestimonial].text}
                </p>
              </div>
            </div>
            
            {/* Testimonial Dots */}
            <div className="flex justify-center space-x-2 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-[#6B9CA3]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}