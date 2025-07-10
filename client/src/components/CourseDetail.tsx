import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Users, ShoppingCart, Crown, Clock, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FacebookPixel } from '@/lib/facebook-pixel';

interface CourseDetailProps {
  courseId: number;
  onClose: () => void;
}

export default function CourseDetail({ courseId, onClose }: CourseDetailProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Check if user has purchased this course
  const { data: coursePurchases } = useQuery({
    queryKey: ['/api/user/course-purchases'],
    retry: false,
  });

  // Track course view with Facebook Pixel
  useEffect(() => {
    if (course) {
      FacebookPixel.trackViewContent(course.id, course.title);
    }
  }, [course]);

  // Check user's access to this course
  const hasAccess = () => {
    const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === course?.id);
    const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
    return hasPurchased || hasGoldAccess;
  };

  const handlePurchase = () => {
    if (!course) return;
    
    // Navigate to checkout with course ID
    window.location.href = `/checkout?courseId=${course.id}`;
  };

  const handleGoldUpgrade = () => {
    window.location.href = '/manage';
  };

  const handleAccessCourse = () => {
    if (!hasAccess()) {
      toast({
        title: "Access Required",
        description: "Purchase this course or upgrade to Gold for unlimited access.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate directly to course overview page
    window.location.href = `/courses/${course.id}/overview`;
  };

  // Redirect users who have access directly to course overview
  useEffect(() => {
    if (course && hasAccess()) {
      // Redirect immediately if user has access
      const timer = setTimeout(() => {
        window.location.href = `/courses/${course.id}/overview`;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [course, coursePurchases, user]);

  // Get course description based on course title
  const getCourseDescription = () => {
    if (!course) return "";
    
    const title = course.title.toLowerCase();
    
    if (title.includes("little baby") || title.includes("4-16")) {
      return {
        description: "Perfect for babies aged 4-16 weeks. Learn how to establish healthy sleep foundations, understand your baby's sleep patterns, and create routines that work for your family.",
        keyFeatures: [
          "Establish healthy sleep foundations",
          "Understanding baby's sleep patterns", 
          "My active winding/burping technique",
          "Reading baby's cues - wind, hunger, tired signs",
          "Multiple routines to suit your family",
          "Aim to be sleeping 12 hours by 16 weeks"
        ],
        whatsCovered: [
          "Sleep foundations and patterns",
          "Active winding/burping technique", 
          "Reading baby cues and signals",
          "Flexible routines for your family",
          "Troubleshooting common issues",
          "Building towards 12-hour nights"
        ]
      };
    }
    
    if (title.includes("big baby") || title.includes("4-8 months")) {
      return {
        description: "For babies aged 4-8 months. Learn how to avoid the 4-month sleep regression, introduce solids properly, and help your baby sleep 7pm-7am by 6 months.",
        keyFeatures: [
          "How to avoid 4mth sleep regression",
          "Empowering you as a parent with all the basics",
          "Introducing solids",
          "Dropping night feeds",
          "Aim to be sleeping 7pm to 7am by 6 mths"
        ],
        whatsCovered: [
          "Avoiding a 4 month sleep regressions",
          "Introducing solids & managing allergens",
          "Early morning waking, linking sleep cycles",
          "Dropping night feeds",
          "Multiple routines and settling techniques to suit your family",
          "Aim is to be sleeping 7pm-7am by 6 months"
        ]
      };
    }
    
    if (title.includes("newborn") || title.includes("0-4 weeks")) {
      return {
        description: "Perfect preparation course for families expecting or with newborns 0-4 weeks. Build solid sleep foundations and learn all the basics to thrive, not just survive.",
        keyFeatures: [
          "Perfect for preparing families",
          "All the building blocks for solid sleep foundations",
          "How to settle and calm a baby",
          "To be empowered as a parent with all the basics",
          "Read your babies cues - wind, hunger, tired signs",
          "Settle into a gentle rhythm",
          "Thrive not just survive the first few weeks"
        ],
        whatsCovered: [
          "How to settle and calm a newborn",
          "Feeding and breastfeeding tips",
          "My active winding/burping technique",
          "All the basics of newborn: rashes, poos and more",
          "All the building blocks to create solid sleep foundations",
          "Tips for parental alignment and wellbeing"
        ]
      };
    }
    
    if (title.includes("toddler") || title.includes("1-2 years")) {
      return {
        description: "For toddlers aged 1-2 years. Protect overnight sleep, drop from 2 to 1 nap, and get practical tips for starting daycare while maintaining great sleep habits.",
        keyFeatures: [
          "Protecting 12 hours overnight sleep",
          "Settling techniques & couple alignment",
          "Dropping from 2 to 1 nap",
          "Age-appropriate routines",
          "Tips for starting daycare"
        ],
        whatsCovered: [
          "Protecting 12 hours overnight sleep 7pm to 7am",
          "Multiple routines and settling options to suit your family",
          "Dropping from 2 to 1 daytime nap",
          "Parental well being and alignment",
          "Nutrition including transition to cows or alternate milk",
          "Troubleshoot common problems like: early morning waking, nap/bedtime refusal"
        ]
      };
    }
    
    // Default description for other courses
    return {
      description: course.description || "Comprehensive course designed by Dr. Golly to help your family achieve better sleep.",
      keyFeatures: [
        "Expert guidance from Dr. Golly",
        "Evidence-based techniques",
        "Flexible routines for your family",
        "Self-paced online learning"
      ],
      whatsCovered: [
        "Sleep foundations and techniques",
        "Age-appropriate strategies",
        "Troubleshooting common issues",
        "Building healthy sleep habits"
      ]
    };
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-4 bg-gray-200 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-md mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <Button onClick={onClose} className="bg-[#095D66] hover:bg-[#095D66]/90 text-white">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const courseInfo = getCourseDescription();
  const userHasAccess = hasAccess();

  // Show loading state if user has access (being redirected)
  if (userHasAccess) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-pulse mb-4">
            <div className="h-8 bg-gray-200 rounded-md mb-4 mx-auto w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-md mb-2 mx-auto w-3/4"></div>
          </div>
          <p className="text-gray-600">Redirecting to course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Mobile-First Header with back button - Enhanced touch target */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <Button 
          onClick={onClose} 
          variant="ghost" 
          className="flex items-center gap-2 text-[#095D66] p-3 -ml-3 min-h-[44px] rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Courses</span>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Mobile-Optimized Course Header */}
        <div className="mb-8">
          {/* Rating and Reviews - Mobile Compact with better spacing */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              {/* Display 5 star rating icons */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = course.rating || 4.8;
                  const isFilled = star <= Math.floor(rating);
                  const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;
                  
                  return (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        isFilled 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : isHalfFilled 
                            ? 'fill-yellow-400/50 text-yellow-400' 
                            : 'fill-gray-200 text-gray-200'
                      }`} 
                    />
                  );
                })}
              </div>
              <span className="text-sm font-semibold text-gray-900">{course.rating || "4.8"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">({course.reviewCount || "572"} reviews)</span>
            </div>
          </div>
          
          {/* Course Title - Mobile Responsive */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 capitalize leading-tight">
            {course.title}
          </h1>
          
          {/* Description - Mobile Optimized */}
          <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
            {courseInfo.description}
          </p>
          
          {/* Badges - Mobile Stack Friendly */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="bg-[#095D66]/10 text-[#095D66] border-[#095D66]/20 text-xs md:text-sm">
              {course.ageRange}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs md:text-sm">
              {course.category}
            </Badge>
            {course.duration && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs md:text-sm">
                <Clock className="w-3 h-3 mr-1" />
                {course.duration} min
              </Badge>
            )}
          </div>

          {/* Mobile-First Price and Purchase Section - Enhanced */}
          <div className="bg-gray-50 rounded-2xl p-5 md:p-6 mb-8 border border-gray-100">
            <div className="mb-5">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                ${course.price || "120"}
              </div>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Self-paced online learning with videos, modules & PDFs
              </p>
            </div>
            
            {userHasAccess ? (
              <Button 
                onClick={handleAccessCourse}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-4 px-6 text-base md:text-lg font-medium rounded-xl min-h-[52px] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Play className="w-5 h-5 mr-2" />
                Access Course
              </Button>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={handlePurchase}
                  className="w-full bg-[#095D66] hover:bg-[#095D66]/90 active:bg-[#095D66]/80 text-white py-4 px-6 text-base md:text-lg font-medium rounded-xl min-h-[52px] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now - ${course.price || "120"}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">or</p>
                  <Button 
                    onClick={handleGoldUpgrade}
                    variant="outline"
                    className="w-full border-2 border-amber-300 text-amber-700 hover:bg-amber-50 active:bg-amber-100 py-3 px-6 rounded-xl min-h-[48px] transition-all duration-200"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Unlimited Courses with Gold
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile-Optimized Course Features */}
        <Card className="mb-6 rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4 px-5 md:px-6 pt-6">
            <CardTitle className="text-lg md:text-xl text-gray-900 font-semibold">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6">
            <ul className="space-y-4">
              {courseInfo.keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Mobile-Optimized What's Covered */}
        <Card className="mb-6 rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4 px-5 md:px-6 pt-6">
            <CardTitle className="text-lg md:text-xl text-gray-900 font-semibold">
              What's covered in "{course.title}"
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6">
            <ul className="space-y-4">
              {courseInfo.whatsCovered.map((item, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-[#095D66] rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-700 font-medium text-sm md:text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Dr. Golly Introduction */}
        <Card className="mb-6 rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="pt-6 px-5 md:px-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-16 h-16 bg-[#095D66] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 mx-auto sm:mx-0 shadow-md">
                DG
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Meet Dr Golly</h3>
                <p className="text-gray-700 mb-4 text-sm md:text-base leading-relaxed">
                  Hi, I'm Dr Golly. Paediatrician and father of 3. I'm here to tell you there's no better parent for your little one than you.
                </p>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                  I've created these online learning courses to empower you with the skills and knowledge to ensure your whole family gets a good night's sleep.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Bundle Promotion */}
        <Card className="bg-gradient-to-r from-[#095D66] to-[#0A6B75] text-white rounded-2xl shadow-lg">
          <CardContent className="pt-6 px-5 md:px-6">
            <h3 className="text-lg md:text-xl font-bold mb-4">Bundle & Save</h3>
            <p className="mb-5 opacity-90 text-sm md:text-base leading-relaxed">
              Save $450 when you get the sleep bundle deal! Get all 6 age-based programs plus 2 supplements.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                <span className="text-xl md:text-2xl font-bold">$250</span>
                <span className="text-sm opacity-75 line-through ml-3">$820</span>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-[#095D66] hover:bg-gray-50 active:bg-gray-100 w-full sm:w-auto rounded-xl py-3 px-6 font-medium min-h-[48px] transition-all duration-200 shadow-sm"
                onClick={() => window.location.href = '/manage'}
              >
                View Bundle Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}