import { Play, Heart, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { Course } from "@shared/schema";

interface VideoCardProps {
  course: Course;
  onClick?: () => void;
  className?: string;
}

export function VideoCard({ course, onClick, className }: VideoCardProps) {
  const { user } = useAuth();
  const { hasAccess } = useFeatureAccess();
  
  // Check if user has access to unlimited courses
  const hasUnlimitedCourses = hasAccess("courses_unlimited");
  
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
          src={course.thumbnailUrl || course.thumbnail_url || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
          alt={course.title}
          className="w-full h-32 object-cover"
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
            <button className="text-dr-teal font-medium text-sm flex items-center hover:text-dr-teal-dark transition-colors">
              {!hasUnlimitedCourses && course.category !== "freebies" ? "Buy Now" : "Read More"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
