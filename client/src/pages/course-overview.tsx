import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Clock, Users, Star, CheckCircle, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { InlineEditTitle } from '@/components/admin/InlineEditTitle';
import { apiRequest } from '@/lib/queryClient';

export default function CourseOverview() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Early return for testing - render basic content
  if (!courseId) {
    return <div>No course ID found</div>;
  }
  
  // State for managing expanded chapters
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAdmin = adminCheck?.isAdmin || false;

  // Admin functions for updating titles
  const updateCourseTitle = async (newTitle: string) => {
    if (!course) return;
    
    await apiRequest("PUT", `/api/courses/${course.id}`, {
      title: newTitle
    });
    
    // Invalidate and refetch course data
    queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
  };

  const updateChapterTitle = async (chapterId: number, newTitle: string) => {
    await apiRequest("PATCH", `/api/chapters/${chapterId}`, {
      title: newTitle
    });
    
    // Invalidate and refetch chapter data
    queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/chapters`] });
  };

  const updateLessonTitle = async (lessonId: number, newTitle: string) => {
    await apiRequest("PATCH", `/api/lessons/${lessonId}`, {
      title: newTitle
    });
    
    // Invalidate and refetch lesson data
    queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/lessons`] });
  };

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Check if user has purchased this course
  const { data: coursePurchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/user/courses'],
    enabled: !!user,
    retry: false,
  });

  // Fetch course chapters
  const { data: chapters = [], isLoading: chaptersLoading, error: chaptersError } = useQuery({
    queryKey: [`/api/courses/${courseId}/chapters`],
    enabled: !!courseId && !!user,
    retry: false,
  });

  // Fetch course lessons (grouped by chapter)
  const { data: lessons = [], isLoading: lessonsLoading, error: lessonsError } = useQuery({
    queryKey: [`/api/courses/${courseId}/lessons`],
    enabled: !!courseId && !!user,
    retry: false,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Chapters received:', chapters.length, chapters);
    console.log('Lessons received:', lessons.length, lessons);
  }, [chapters, lessons]);



  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });



  // Check user's access to this course
  const hasAccess = () => {
    // Check if user has purchased this course (database returns courseId field)
    const hasPurchased = coursePurchases?.some((purchase: any) => purchase.courseId === parseInt(courseId || '0'));
    const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
    

    
    return hasPurchased || hasGoldAccess;
  };

  // Handle access control errors from API
  React.useEffect(() => {
    if (chaptersError || lessonsError) {
      // Check if it's a 403 (access denied) error
      if (chaptersError?.message?.includes('403') || lessonsError?.message?.includes('403')) {
        toast({
          title: "Access Required",
          description: "Purchase this course or upgrade to Gold for unlimited access.",
          variant: "destructive",
        });
        setLocation('/courses');
      } else if (isUnauthorizedError(chaptersError) || isUnauthorizedError(lessonsError)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this course.",
          variant: "destructive",
        });
        setLocation('/login');
      }
    }
  }, [chaptersError, lessonsError, toast, setLocation]);



  const handleBackToCourses = () => {
    setLocation('/courses');
  };

  const handleStartLesson = (lessonId: number) => {
    // Navigate to individual lesson page
    setLocation(`/lesson/${lessonId}`);
  };

  const handleStartLessonContent = (contentId: number, contentTitle: string) => {
    // Navigate to lesson page with content ID
    setLocation(`/lesson/${contentId}`);
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // Get lessons for a specific chapter
  const getLessonsForChapter = (chapterId: number) => {
    const filteredLessons = lessons.filter((lesson: any) => lesson.chapter_id === chapterId);
    console.log(`Chapter ${chapterId} lessons:`, filteredLessons.length, filteredLessons);
    return filteredLessons;
  };

  if (courseLoading || purchasesLoading || chaptersLoading || lessonsLoading) {
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

  // Calculate progress based on lessons, not chapters
  const getLessonProgress = (lessonId: number) => {
    return userProgress?.find((p: any) => p.lesson_id === lessonId);
  };

  const completedLessons = lessons.filter((lesson: any) => {
    const progress = getLessonProgress(lesson.id);
    return progress?.completedAt;
  });

  const progressPercentage = lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0;

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
          <div className="mb-4">
            {isAdmin ? (
              <InlineEditTitle
                title={course.title}
                onSave={updateCourseTitle}
                className="text-2xl md:text-3xl font-bold text-gray-900 capitalize leading-tight"
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize leading-tight">
                {course.title}
              </h1>
            )}
          </div>
          
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
                  {completedLessons.length} of {lessons.length} lessons completed
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

        {/* Chapters */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4 px-5 md:px-6 pt-6">
            <CardTitle className="text-lg md:text-xl text-gray-900 font-semibold">Chapters</CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6">
            {chapters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Course chapters will be available soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter: any, index: number) => {
                  const chapterLessons = getLessonsForChapter(chapter.id);
                  const isExpanded = expandedChapters[chapter.id] || false;
                  const hasLessons = chapterLessons.length > 0;
                  
                  return (
                    <div key={chapter.id} className="relative">
                      {/* Chapter Header */}
                      <div 
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 transition-all duration-200 rounded-lg"
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        {/* Chapter Circle */}
                        <div className="flex-shrink-0">
                          {(() => {
                            const chapterLessons = getLessonsForChapter(chapter.id);
                            const completedInChapter = chapterLessons.filter(lesson => {
                              const progress = getLessonProgress(lesson.id);
                              return progress?.completed_at;
                            });
                            const isChapterCompleted = chapterLessons.length > 0 && completedInChapter.length === chapterLessons.length;
                            
                            if (isChapterCompleted) {
                              return (
                                <div className="w-5 h-5 rounded-full bg-green-700 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              );
                            }
                            
                            return (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Chapter Content */}
                        <div className="flex-1 min-w-0">
                          {isAdmin ? (
                            <InlineEditTitle
                              title={chapter.title}
                              onSave={(newTitle) => updateChapterTitle(chapter.id, newTitle)}
                              className="text-sm font-medium text-gray-900"
                            />
                          ) : (
                            <h4 className="text-sm font-medium text-gray-900">
                              {chapter.title}
                            </h4>
                          )}
                          {hasLessons && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {chapterLessons.length} lesson{chapterLessons.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Lessons */}
                      {isExpanded && (
                        <div className="ml-2.5 border-l-2 border-gray-200 pl-4 mt-2">
                          {hasLessons ? (
                            // Multiple lessons
                            chapterLessons.map((lesson: any, lessonIndex: number) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 py-2 hover:bg-gray-50/50 transition-colors rounded-lg -ml-4 pl-4"
                              >
                                {/* Lesson Circle */}
                                <div className="flex-shrink-0">
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                  </div>
                                </div>
                                
                                {/* Lesson Content */}
                                <div className="flex-1 min-w-0">
                                  {isAdmin ? (
                                    <InlineEditTitle
                                      title={lesson.title}
                                      onSave={(newTitle) => updateLessonTitle(lesson.id, newTitle)}
                                      className="text-sm font-medium text-gray-800"
                                    />
                                  ) : (
                                    <h5 className="text-sm font-medium text-gray-800">
                                      {lesson.title}
                                    </h5>
                                  )}
                                  {lesson.description && (
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Status Indicator */}
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const progress = getLessonProgress(lesson.id);
                                    const isCompleted = progress?.completed_at;
                                    
                                    if (isCompleted) {
                                      return (
                                        <Button
                                          size="sm"
                                          className="bg-green-700 hover:bg-green-800 text-white text-xs px-3 py-1 h-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartLesson(lesson.id);
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          ✓
                                        </Button>
                                      );
                                    }
                                    
                                    return (
                                      <Button
                                        size="sm"
                                        className="bg-[#095D66] hover:bg-[#095D66]/90 text-white text-xs px-3 py-1 h-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartLesson(lesson.id);
                                        }}
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start
                                      </Button>
                                    );
                                  })()}
                                </div>
                              </div>
                            ))
                          ) : (
                            // No lessons in this chapter
                            <div className="flex items-center gap-3 py-2 text-gray-500 text-sm">
                              <div className="flex-shrink-0">
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                </div>
                              </div>
                              <span>No lessons available</span>
                            </div>
                          )}
                        </div>
                      )}
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