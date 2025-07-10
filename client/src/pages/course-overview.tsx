import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Clock, Users, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CourseOverview() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
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

  // Fetch course modules
  const { data: modules = [] } = useQuery({
    queryKey: [`/api/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  // Check user's access to this course
  const hasAccess = () => {
    const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === parseInt(courseId || '0'));
    const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
    return hasPurchased || hasGoldAccess;
  };

  // Redirect if user doesn't have access
  React.useEffect(() => {
    if (course && !hasAccess()) {
      toast({
        title: "Access Required",
        description: "You need to purchase this course or upgrade to Gold for access.",
        variant: "destructive",
      });
      setLocation('/courses');
    }
  }, [course, coursePurchases, user]);

  const handleBackToCourses = () => {
    setLocation('/courses');
  };

  const handleStartModule = (moduleId: number) => {
    // Navigate to module content - this would be implemented later
    toast({
      title: "Module Starting",
      description: "Opening module content...",
    });
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
          <Button onClick={handleBackToCourses} className="bg-[#095D66] hover:bg-[#095D66]/90 text-white">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress
  const getModuleProgress = (moduleId: number) => {
    return userProgress?.find((p: any) => p.courseId === parseInt(courseId || '0') && p.moduleId === moduleId);
  };

  const completedModules = modules.filter((module: any) => {
    const progress = getModuleProgress(module.id);
    return progress?.completedAt;
  });

  const progressPercentage = modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Mobile-First Header with back button */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <Button 
          onClick={handleBackToCourses} 
          variant="ghost" 
          className="flex items-center gap-2 text-[#095D66] p-3 -ml-3 min-h-[44px] rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Courses</span>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Course Header */}
        <div className="mb-8">
          {/* Rating and Reviews */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
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
          
          {/* Course Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 capitalize leading-tight">
            {course.title}
          </h1>
          
          {/* Description */}
          <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
            {course.description}
          </p>
          
          {/* Badges */}
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

          {/* Progress Card */}
          <Card className="mb-6 rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="pt-6 px-5 md:px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
                <span className="text-sm font-medium text-[#095D66]">
                  {completedModules.length} of {modules.length} modules completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-[#095D66] h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {progressPercentage === 100 
                  ? "Congratulations! You've completed this course." 
                  : `${Math.round(progressPercentage)}% complete - keep going!`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Modules */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4 px-5 md:px-6 pt-6">
            <CardTitle className="text-lg md:text-xl text-gray-900 font-semibold">Course Modules</CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6">
            {modules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Course modules will be available soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module: any, index: number) => {
                  const progress = getModuleProgress(module.id);
                  const isCompleted = !!progress?.completedAt;
                  
                  return (
                    <div 
                      key={module.id} 
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#095D66]/20 hover:bg-gray-50/50 transition-all duration-200"
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-medium text-gray-900 mb-1">
                          {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {module.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => handleStartModule(module.id)}
                          className={`min-h-[40px] px-4 rounded-lg transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-[#095D66] hover:bg-[#095D66]/90 text-white'
                          }`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}