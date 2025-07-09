import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bookmark, Grid, Moon, Baby, Lock } from "lucide-react";
import { VideoCard } from "@/components/ui/video-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";

const courseTabs = [
  { id: "my", label: "Purchases", icon: Bookmark },
  { id: "all", label: "All Courses", icon: Grid },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "toddler", label: "Toddler", icon: Baby },
];

export default function Courses() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["/api/courses", activeTab === "all" ? undefined : activeTab],
    enabled: !!user,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
    enabled: !!user && activeTab === "my",
  });

  const { data: coursePurchases } = useQuery({
    queryKey: ["/api/user/course-purchases"],
    enabled: !!user && activeTab === "my",
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

  const filteredCourses = courses?.filter((course: Course) => {
    // For "Purchases" tab, show purchased courses + all courses if Gold/Platinum
    if (activeTab === "my") {
      const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === course.id);
      return hasPurchased; // Only show actually purchased courses in "Purchases"
    }
    
    // Apply search filter
    if (searchQuery) {
      return course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             course.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
    // Handle course access
    console.log("Accessing course:", course.title);
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

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Courses for the {user?.firstName || "Adnam"} family 👨‍👩‍👧‍👦</h1>
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
              {userProgress.map((progress: any) => (
                <div key={progress.id} className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Course Progress</h3>
                    <span className="text-sm text-gray-500">{progress.progress}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-dr-teal h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Cards */}
        <div className="space-y-6">
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
                        Access Course
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
