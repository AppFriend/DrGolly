import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEventTracking } from "@/hooks/useTracking";

export default function PaymentSuccess() {
  const [, params] = useRoute("/payment-success");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { trackPurchase } = useEventTracking();
  
  const courseId = new URLSearchParams(window.location.search).get('courseId');

  const { data: course } = useQuery({
    queryKey: ["/api/courses", parseInt(courseId || "0")],
    enabled: !!courseId,
  });

  const handleContinue = () => {
    setLocation("/courses");
  };

  const handleStartCourse = () => {
    if (courseId) {
      setLocation(`/courses/${courseId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. You now have access to {course?.title || "your course"}.
        </p>

        {/* Course Details */}
        {course && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={course.thumbnailUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                alt={course.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="text-left">
                <h3 className="font-semibold">{course.title}</h3>
                <p className="text-sm text-gray-600">Now available in your courses</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleStartCourse}
            className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white"
          >
            Start Course
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button
            onClick={handleContinue}
            variant="outline"
            className="w-full"
          >
            Back to Courses
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}