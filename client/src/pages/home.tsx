import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell } from "lucide-react";
import { VideoCard } from "@/components/ui/video-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";

const categories = [
  { id: "all", label: "All" },
  { id: "sleep", label: "Sleep" },
  { id: "nutrition", label: "Nutrition" },
  { id: "health", label: "Health" },
  { id: "freebies", label: "Freebies" },
];

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["/api/courses", activeCategory === "all" ? undefined : activeCategory],
    enabled: !!user,
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

  const handleVideoClick = (course: Course) => {
    if (course.tier === "gold" && user?.subscriptionTier === "free") {
      toast({
        title: "Subscription Required",
        description: "This content requires a Gold or Platinum subscription.",
        variant: "destructive",
      });
      return;
    }
    // Handle video playback
    console.log("Playing video:", course.title);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-32 bg-[#83CFCC]"></div>
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-[#095D66] text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-white font-heading font-bold text-lg">Dr. Golly</div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#095D66] text-xs font-bold">
              {user?.subscriptionTier === "free" ? "F" : user?.subscriptionTier === "gold" ? "G" : "P"}
            </span>
          </div>
          <span className="text-sm font-medium capitalize">
            {user?.subscriptionTier || "Free"} Plan
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-white hover:text-gray-200 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-white hover:text-gray-200 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <img
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-white"
          />
        </div>
      </header>

      {/* Welcome Hero */}
      <section className="bg-gradient-to-r from-[#83CFCC] to-[#CBEFE8] text-[#095D66] p-6 rounded-b-3xl">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-2">
              Welcome {user?.firstName || "there"}!
            </h1>
            <p className="text-sm text-white/90 mb-4">
              I'm here to help you navigate sleep, parenthood & beyond
            </p>
            {user?.subscriptionTier === "free" && (
              <Button
                variant="secondary"
                className="bg-white text-dr-teal hover:bg-gray-100"
                onClick={() => window.location.href = "/subscription"}
              >
                Try Gold Plan for 30 days
              </Button>
            )}
          </div>
          <img
            src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120"
            alt="Dr. Golly"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"
          />
        </div>
      </section>

      {/* Expert Advice Section */}
      <section className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          Explore Expert Advice by Topic!
          <span className="ml-2">📖✨</span>
        </h2>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? "bg-dr-teal text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="space-y-6">
          {courses?.map((course: Course) => (
            <VideoCard
              key={course.id}
              course={course}
              onClick={() => handleVideoClick(course)}
            />
          ))}
        </div>

        {courses?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No courses available in this category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
