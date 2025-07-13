import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Bell, HelpCircle, Settings, ShoppingCart } from "lucide-react";
import { BlogCard } from "@/components/ui/blog-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { WelcomePopup } from "@/components/WelcomePopup";
import { SupportModal } from "@/components/SupportModal";
import { FreebieImage } from "@/components/FreebieImageLoader";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { BlogPost } from "@shared/schema";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";
import drGollyLogo from "../assets/dr-golly-logo.png";
import welcomeBanner from "@assets/Golly-Welcome Banner-App-02_1752111946858.png";

const categories = [
  { id: "all", label: "All" },
  { id: "freebies", label: "Freebies" },
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // Initialize personalization hook to save signup data after auth
  const { personalization } = usePersonalization();

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  // Check if user should see welcome popup (first-time purchaser from Big Baby)
  useEffect(() => {
    if (user?.signupSource === 'public_checkout' && !localStorage.getItem('welcomeShown')) {
      // Show welcome popup for first-time Big Baby purchasers
      setShowWelcomePopup(true);
      localStorage.setItem('welcomeShown', 'true');
    }
  }, [user]);

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
          <img 
            src={drGollyLogo} 
            alt="Dr. Golly" 
            className="h-8 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }} // Makes the logo white
          />
          <button 
            onClick={() => window.location.href = '/manage'}
            className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              user?.subscriptionTier === "gold" ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500]" :
              user?.subscriptionTier === "platinum" ? "bg-gradient-to-r from-[#E5E4E2] to-[#C0C0C0]" :
              "bg-white"
            )}>
              <span className={cn(
                "text-xs font-bold",
                user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" ? "text-black" : "text-[#095D66]"
              )}>
                {user?.subscriptionTier === "free" ? "F" : user?.subscriptionTier === "gold" ? "G" : "P"}
              </span>
            </div>
            <span className="text-sm font-medium capitalize">
              {user?.subscriptionTier || "Free"} Plan
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {adminCheck?.isAdmin && (
            <button
              onClick={() => setLocation("/admin")}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 bg-[#095D66] text-white hover:bg-[#095D66]/90"
              title="Admin Panel"
            >
              Admin
            </button>
          )}
          <NotificationBell />

          <button
            onClick={() => setShowSupportModal(true)}
            className="text-white hover:text-gray-200 transition-colors"
            title="Get Support"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => setLocation("/profile")}
            className="transition-transform hover:scale-105"
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center">
                <span className="text-[#095D66] text-xs font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Welcome Hero */}
      <section className={cn(
        "p-6 rounded-b-3xl relative overflow-hidden min-h-[180px]",
        user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" 
          ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black" 
          : "text-white"
      )}>
        {/* Background Image for non-Gold/Platinum users */}
        {!(user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum") && (
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${welcomeBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top'
            }}
          />
        )}
        
        {/* Content overlay */}
        <div className="relative z-10 flex items-center justify-start">
          <div className="flex-1">
            <h1 className={cn(
              "text-xl font-bold mb-2",
              user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" 
                ? "text-black" 
                : "text-[#095D66]"
            )}>
              Welcome {user?.first_name || user?.firstName || "there"}!
            </h1>
            {user?.subscriptionTier === "free" && (
              <div className="flex flex-col items-start">
                <p className={cn(
                  "text-sm mb-4 max-w-[240px]",
                  user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" 
                    ? "text-black/80" 
                    : "text-[#166534]"
                )}>
                  I'm here to help you navigate sleep, parenthood & beyond
                </p>
                <Button
                  variant="secondary"
                  className="bg-[#095D66] text-white hover:bg-[#095D66]/90 font-medium rounded-xl shadow-lg"
                  onClick={() => window.location.href = "/subscription"}
                >
                  Try Gold 50% off for 1 month
                </Button>
              </div>
            )}
            {(user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum") && (
              <>
                <p className={cn(
                  "text-sm mb-4",
                  user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" 
                    ? "text-black/80" 
                    : "text-[#166534]"
                )}>
                  I'm here to help you navigate sleep, parenthood & beyond
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="text-sm font-medium text-black">
                    {user?.subscriptionTier === "gold" ? "Gold" : "Platinum"} Member - Unlimited Access
                  </span>
                </div>
              </>
            )}
          </div>
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
          
          {/* Mobile: Single column layout */}
          <div className={cn(
            "space-y-6 transition-opacity duration-200 lg:hidden",
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

          {/* Desktop: Three column grid layout */}
          <div className={cn(
            "hidden lg:grid lg:grid-cols-3 lg:gap-6 transition-opacity duration-200",
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
      
      {/* Welcome Popup for first-time Big Baby purchasers */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={() => setShowWelcomePopup(false)}
        userName={user?.firstName}
      />
      
      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}
