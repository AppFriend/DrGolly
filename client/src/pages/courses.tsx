import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bookmark, Grid, Moon, Baby, Lock, ArrowLeft } from "lucide-react";
import { VideoCard } from "@/components/ui/video-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";
import CourseDetail from "@/components/CourseDetail";
import { Link } from "wouter";

const courseTabs = [
  { id: "my", label: "Purchases", icon: Bookmark },
  { id: "all", label: "All", icon: Grid },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "toddler", label: "Toddler", icon: Baby },
];

export default function Courses() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["/api/courses", searchQuery ? "all" : (activeTab === "all" ? undefined : activeTab)],
    enabled: !!user,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  const { data: coursePurchases, refetch: refetchPurchases, error: purchasesError } = useQuery({
    queryKey: ["/api/user/course-purchases"],
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    refetchInterval: activeTab === "my" ? 5000 : false, // Refresh every 5 seconds when on Purchases tab
    onSuccess: (data) => {
      // Show success notification when new purchases are detected
      if (data && data.length > 0) {
        const latestPurchase = data[0];
        const timeSinceLatest = Date.now() - new Date(latestPurchase.purchasedAt).getTime();
        
        // If purchase is less than 30 seconds old, show success notification
        if (timeSinceLatest < 30000 && activeTab === "my") {
          toast({
            title: "Course Purchase Complete!",
            description: `${latestPurchase.course?.title || 'Your course'} has been added to your library.`,
            variant: "default",
          });
        }
      }
    }
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Handle purchases error separately
  useEffect(() => {
    if (purchasesError && isUnauthorizedError(purchasesError as Error)) {
      toast({
        title: "Session Expired",
        description: "Please log in again to view your purchases.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [purchasesError, toast]);

  const filteredCourses = courses?.filter((course: Course) => {
    // For "Purchases" tab, show purchased courses only
    if (activeTab === "my") {
      const hasPurchased = coursePurchases?.some((purchase: any) => 
        purchase.courseId === course.id && purchase.status === 'completed'
      );
      return hasPurchased; // Only show completed purchases in "Purchases"
    }
    
    // Apply search filter - search across all courses when search query is present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = course.title.toLowerCase();
      const description = course.description?.toLowerCase() || "";
      
      // Create keyword-based search with relevant tags
      const searchTerms = [
        title,
        description,
        // Add relevant keywords for better matching
        course.category?.toLowerCase() || "",
        // Extract key terms from title for better matching
        ...title.split(/[\s-]+/),
        // Add specific keywords for common searches
        title.includes("baby") || title.includes("newborn") ? "baby newborn infant" : "",
        title.includes("toddler") || title.includes("child") ? "toddler child preschooler" : "",
        title.includes("sleep") ? "sleep bedtime night rest" : "",
        title.includes("feeding") || title.includes("nutrition") ? "feeding nutrition eating food" : "",
        title.includes("development") || title.includes("milestone") ? "development milestone growth" : "",
        title.includes("behavior") || title.includes("behaviour") ? "behavior behaviour discipline" : "",
      ].join(" ");
      
      // Score-based relevance matching
      const titleMatch = title.includes(query) ? 100 : 0;
      const exactWordMatch = title.split(/[\s-]+/).some(word => word === query) ? 80 : 0;
      const keywordMatch = searchTerms.includes(query) ? 60 : 0;
      const partialMatch = searchTerms.includes(query) ? 40 : 0;
      
      const relevanceScore = titleMatch + exactWordMatch + keywordMatch + partialMatch;
      
      // Return true if there's any meaningful match
      return relevanceScore > 0;
    }
    return true;
  });

  const handleCourseClick = (course: Course) => {
    const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === course.id);
    const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
    
    // Allow access if user has Gold/Platinum or has purchased this specific course
    if (!hasPurchased && !hasGoldAccess) {
      toast({
        title: "Subscription Required",
        description: "This content requires a Gold or Platinum subscription.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to course detail view
    setSelectedCourse(course.id);
  };

  const getCourseButtonText = (course: Course) => {
    const courseProgress = userProgress?.find((p: any) => p.courseId === course.id);
    
    if (courseProgress && courseProgress.progress > 0) {
      return "Continue Course";
    } else {
      return "Start Course";
    }
  };

  const handlePurchase = (course: Course) => {
    toast({
      title: "Purchase Started",
      description: `Redirecting to purchase ${course.title}...`,
    });
    // Handle individual course purchase
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dr-bg">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Show CourseDetail if a course is selected
  if (selectedCourse) {
    return (
      <CourseDetail 
        courseId={selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Back Navigation */}
      <div className="bg-white p-4 pb-2">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 pt-2">
        <div className="mb-4">
          <h1 className="text-lg font-semibold flex items-center">
            <Grid className="mr-2 h-5 w-5 text-[#83CFCC]" />
            Courses for the {user?.lastName || "Adnam"} family
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Supporting your parenting journey with courses on sleep, nutrition, and everything in between 💛
        </p>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dr-teal"
          />
        </div>
      </div>

      {/* Course Category Tabs */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {courseTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-1 ${
                  activeTab === tab.id
                    ? "bg-white text-dr-teal shadow-sm"
                    : "text-gray-600 hover:text-dr-teal"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4">
        {activeTab === "my" && userProgress && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
            <div className="space-y-4">
              {(() => {
                // Create a map to group progress by courseId and get the highest progress
                const progressMap = new Map();
                userProgress.forEach((progress: any) => {
                  const courseId = progress.courseId;
                  if (!progressMap.has(courseId) || progressMap.get(courseId).progress < progress.progress) {
                    progressMap.set(courseId, progress);
                  }
                });
                
                // Convert map back to array and render
                return Array.from(progressMap.values()).map((progress: any) => {
                  // Find the course title from the courses data
                  const course = courses?.find((c: Course) => c.id === progress.courseId);
                  const courseTitle = course?.title || `Course ${progress.courseId}`;
                  
                  return (
                    <div key={`progress-${progress.courseId}`} className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium truncate mr-2">{courseTitle}</h3>
                        <span className="text-sm text-gray-500 flex-shrink-0">{progress.progress}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-dr-teal h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Course Cards */}
        {/* Mobile: Single column layout */}
        <div className="space-y-6 lg:hidden">
          {filteredCourses?.map((course: Course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <img
                src={course.thumbnailUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{course.ageRange}</p>
                <p className="text-sm text-gray-500 mb-4 capitalize">{course.category}</p>
                
                {(() => {
                  const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === course.id);
                  const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
                  
                  // If user has purchased this course or has Gold/Platinum access, show access button
                  if (hasPurchased || hasGoldAccess) {
                    return (
                      <Button
                        onClick={() => handleCourseClick(course)}
                        className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white"
                      >
                        {getCourseButtonText(course)}
                      </Button>
                    );
                  }
                  
                  // Free users without this course purchased - show purchase options
                  return (
                    <>
                      <Button
                        onClick={() => window.location.href = "/manage"}
                        className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white mb-3"
                      >
                        Unlimited Access with Gold
                      </Button>
                      <Button
                        onClick={() => window.location.href = `/checkout/${course.id}`}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Buy for $120
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Three column grid layout */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {filteredCourses?.map((course: Course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <img
                src={course.thumbnailUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{course.ageRange}</p>
                <p className="text-sm text-gray-500 mb-4 capitalize">{course.category}</p>
                
                {(() => {
                  const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === course.id);
                  const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
                  
                  // If user has purchased this course or has Gold/Platinum access, show access button
                  if (hasPurchased || hasGoldAccess) {
                    return (
                      <Button
                        onClick={() => handleCourseClick(course)}
                        className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white"
                      >
                        {getCourseButtonText(course)}
                      </Button>
                    );
                  }
                  
                  // Free users without this course purchased - show purchase options
                  return (
                    <>
                      <Button
                        onClick={() => window.location.href = "/manage"}
                        className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white mb-3"
                      >
                        Unlimited Access with Gold
                      </Button>
                      <Button
                        onClick={() => window.location.href = `/checkout/${course.id}`}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Buy for $120
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {filteredCourses?.length === 0 && (
          <div className="text-center py-12">
            {activeTab === "my" ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-dr-teal to-blue-600 text-white p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-2">No Purchases Yet</h3>
                  <p className="text-sm opacity-90 mb-4">
                    You haven't purchased any courses yet. Browse our extensive library to find the perfect course for your family's needs.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("all")}
                    className="bg-white text-dr-teal hover:bg-gray-50 font-medium"
                  >
                    Browse All Courses
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  <p>💡 Tip: Gold subscribers get unlimited access to all courses!</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No courses found matching your criteria.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
