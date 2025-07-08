import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { Course } from "@shared/schema";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function Checkout() {
  const [, params] = useRoute("/checkout/:courseId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.firstName || "",
    email: user?.email || "",
    dueDate: "",
  });

  const courseId = params?.courseId ? parseInt(params.courseId) : null;

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  // Create payment intent
  const createPaymentMutation = useMutation({
    mutationFn: async (data: { courseId: number; customerDetails: any }) => {
      const response = await apiRequest("POST", "/api/create-course-payment", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Payment Setup Failed",
        description: "Unable to set up payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (courseId && user && customerDetails.firstName && customerDetails.email) {
      createPaymentMutation.mutate({ courseId, customerDetails });
    }
  }, [courseId, user, customerDetails.firstName, customerDetails.email]);

  const handleBack = () => {
    setLocation("/courses");
  };

  const handleDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        <button onClick={handleBack} className="mr-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Checkout</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Your Details Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Your Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-600">First Name</Label>
              <Input
                id="firstName"
                value={customerDetails.firstName}
                onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                className="mt-1"
                placeholder="First Name"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleDetailsChange("email", e.target.value)}
                className="mt-1"
                placeholder="frazer@gmail.com"
              />
            </div>
            
            <div>
              <Label htmlFor="dueDate" className="text-sm text-gray-600">Due Date / Baby Birthday</Label>
              <Input
                id="dueDate"
                type="date"
                value={customerDetails.dueDate}
                onChange={(e) => handleDetailsChange("dueDate", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Your Order Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold mr-2">Your Order</h2>
            <div className="w-6 h-6 bg-dr-teal rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={course.thumbnailUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{course.title}</h3>
              <p className="text-sm text-gray-600">Course</p>
              <p className="text-sm text-gray-600">${course.price || 120}.00</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">4.5 ⭐</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <button className="text-dr-teal text-sm flex items-center mb-3">
              🏷️ Have a coupon or gift card?
            </button>
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>${course.price || 120}.00</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              course={course} 
              customerDetails={customerDetails}
              total={course.price || 120}
            />
          </Elements>
        ) : (
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}

        {/* Guarantee Section */}
        <div className="bg-white rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">No results after completing the program? Get a full refund within 30 days!</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-4 mt-4">
          <h3 className="font-semibold mb-3">Let our customers speak for us</h3>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-dr-teal">4.83</div>
            <div className="text-yellow-400 text-lg">⭐⭐⭐⭐⭐</div>
            <p className="text-sm text-gray-600">Based on 653 reviews</p>
            <p className="text-xs text-gray-500">Reviews from Google</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <img
                key={i}
                src={`https://images.unsplash.com/photo-${1500000000000 + i}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                alt="Customer"
                className="w-full h-16 rounded-lg object-cover"
              />
            ))}
          </div>

          <div className="border-t pt-3">
            <div className="flex items-start space-x-3">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50"
                alt="Allison T"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Allison T</span>
                  <span className="text-sm text-gray-500">4.5 ⭐</span>
                </div>
                <p className="text-xs text-gray-600">
                  First came across Dr Golly at a talk for new parents and was blown away with his passion and knowledge with the passion and knowledge...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}