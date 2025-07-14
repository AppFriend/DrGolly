import { Play, Heart, Eye, ArrowRight, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@shared/schema";
import { useLocation } from "wouter";

interface VideoCardProps {
  course: Course;
  onClick?: () => void;
  className?: string;
  showAddToCart?: boolean;
}

export function VideoCard({ course, onClick, className, showAddToCart = false }: VideoCardProps) {
  const { user } = useAuth();
  const { hasAccess } = useFeatureAccess();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check if user has access to unlimited courses
  const hasUnlimitedCourses = hasAccess("courses_unlimited");
  
  // Debug logging
  console.log('VideoCard Debug:', {
    courseId: course.id,
    courseTitle: course.title,
    courseCategory: course.category,
    hasUnlimitedCourses,
    buttonWillShow: !hasUnlimitedCourses && course.category !== "freebies"
  });
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ itemType, itemId, quantity }: { itemType: string; itemId: number; quantity: number }) => {
      const response = await apiRequest('POST', '/api/cart', {
        itemType,
        itemId,
        quantity
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Cart",
        description: "Course has been added to your cart successfully!",
      });
      // Invalidate cart queries to update the count
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add course to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    addToCartMutation.mutate({
      itemType: 'course',
      itemId: course.id,
      quantity: 1
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    console.log('Buy Now clicked for course:', course.id);
    setLocation(`/checkout?courseId=${course.id}`);
  };
  
  // Handle different image URL formats
  const getImageUrl = (thumbnailUrl: string) => {
    if (thumbnailUrl?.startsWith('/assets/')) {
      return thumbnailUrl.replace('/assets/', '/attached_assets/');
    }
    return thumbnailUrl;
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sleep":
        return "bg-dr-teal";
      case "nutrition":
        return "bg-orange-500";
      case "health":
        return "bg-purple-500";
      case "freebies":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={getImageUrl(course.thumbnailUrl || course.thumbnail_url)}
          alt={course.title}
          className="w-full h-32 object-cover"
          onLoad={() => {
            console.log('VideoCard image loaded successfully:', course.thumbnailUrl || course.thumbnail_url, 'for course:', course.title);
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.log('VideoCard image failed to load:', target.src, 'for course:', course.title);
            console.log('Full course object:', course);
          }}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <button className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Play className="h-4 w-4 text-dr-teal ml-1" />
          </button>
        </div>
        <span className={cn(
          "absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-medium",
          getCategoryColor(course.category)
        )}>
          {course.category === "freebies" ? "Free DL" : course.category}
        </span>
        
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="absolute top-2 left-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4 text-brand-teal" />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-3">
          {course.category} • Published
          {course.ageRange && ` • ${course.ageRange}`}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              {course.likes || 0}
            </span>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {course.views || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!hasUnlimitedCourses && course.category !== "freebies" && (
              <span className="text-lg font-bold text-dr-teal">$120</span>
            )}
            <button 
              onClick={!hasUnlimitedCourses && course.category !== "freebies" ? handleBuyNow : onClick}
              className="text-dr-teal font-medium text-sm flex items-center hover:text-dr-teal-dark transition-colors"
            >
              {!hasUnlimitedCourses && course.category !== "freebies" ? "Buy Now" : "Read More"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
