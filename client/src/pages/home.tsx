import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Bell } from "lucide-react";
import { BlogCard } from "@/components/ui/blog-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@shared/schema";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";

const categories = [
  { id: "all", label: "All" },
  { id: "sleep", label: "Sleep" },
  { id: "nutrition", label: "Nutrition" },
  { id: "health", label: "Health" },
  { id: "parenting", label: "Parenting" },
];

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Initialize personalization hook to save signup data after auth
  const { personalization } = usePersonalization();

  const { data: blogPosts, isLoading, isFetching, error } = useQuery({
    queryKey: ["/api/blog-posts", activeCategory === "all" ? undefined : activeCategory],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents unnecessary refetches
    refetchOnWindowFocus: false, // Prevents unnecessary background fetches
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

  const handleBlogClick = (blogPost: BlogPost) => {
    // Navigate to blog post detail page
    window.location.href = `/blog/${blogPost.slug}`;
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
          <button 
            onClick={() => window.location.href = '/manage'}
            className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#095D66] text-xs font-bold">
                {user?.subscriptionTier === "free" ? "F" : user?.subscriptionTier === "gold" ? "G" : "P"}
              </span>
            </div>
            <span className="text-sm font-medium capitalize">
              {user?.subscriptionTier || "Free"} Plan
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-white hover:text-gray-200 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-white hover:text-gray-200 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={() => setLocation("/profile")}
            className="transition-transform hover:scale-105"
          >
            <img
              src={user?.profileImageUrl || drGollyImage}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
          </button>
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
            src={drGollyImage}
            alt="Dr. Golly"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"
          />
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          Latest Expert Advice
          <span className="ml-2">📖✨</span>
        </h2>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              disabled={isFetching}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeCategory === category.id
                  ? "bg-dr-teal text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105",
                isFetching && "opacity-50 cursor-not-allowed"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="relative">
          {/* Loading overlay for filter changes */}
          {isFetching && blogPosts && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2 text-dr-teal">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-dr-teal border-t-transparent"></div>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </div>
          )}
          
          <div className={cn(
            "space-y-6 transition-opacity duration-200",
            isFetching && blogPosts ? "opacity-50" : "opacity-100"
          )}>
            {blogPosts
              ?.filter(post => activeCategory === "all" || post.category === activeCategory)
              ?.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onClick={() => handleBlogClick(post)}
              />
            ))}
          </div>

          {!isFetching && blogPosts?.filter(post => activeCategory === "all" || post.category === activeCategory)?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blog posts available in this category.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
