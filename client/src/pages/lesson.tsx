import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, Play, CheckCircle, Circle, Clock, BookOpen, ArrowRight, Trophy, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import confetti from 'canvas-confetti';

interface LessonContent {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  orderIndex: number;
  description?: string;
}

interface LessonProgress {
  id: number;
  userId: string;
  lessonId: number;
  completed: boolean;
  watchTime: number;
  completedAt?: Date;
}

interface LessonData {
  lesson: {
    id: number;
    title: string;
    content: string;
    videoUrl?: string;
    orderIndex: number;
    courseId: number;
    chapterId?: number;
    chapterIndex: number;
    moduleIndex: number;
  };
  course: {
    id: number;
    title: string;
    description?: string;
    category: string;
    tier: string;
  };
  content: LessonContent[];
  progress?: LessonProgress;
  nextLesson?: {
    id: number;
    title: string;
    chapterIndex: number;
    moduleIndex: number;
  } | null;
  isLastInChapter?: boolean;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [watchTime, setWatchTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showChapterCompleteModal, setShowChapterCompleteModal] = useState(false);
  
  // Extract contentId from query parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const contentId = urlParams.get('contentId');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this lesson",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const { data: lessonData, isLoading: lessonLoading, error } = useQuery<LessonData>({
    queryKey: [`/api/lessons/${id}`],
    enabled: isAuthenticated && !!id,
    retry: (failureCount, error) => {
      console.log(`Query retry for lesson ${id}, attempt ${failureCount}, error:`, error);
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error(`Failed to load lesson ${id}:`, error);
    },
  });



  const markProgressMutation = useMutation({
    mutationFn: async (data: { completed: boolean; watchTime: number }) => {
      const response = await fetch(`/api/lessons/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${lessonData?.lesson.courseId}/chapters`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${lessonData?.lesson.courseId}/lessons`] });
      // Remove completion toast notification
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        setLocation('/login');
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkComplete = async () => {
    if (!isCompleted) {
      // Mark lesson as complete first
      markProgressMutation.mutate({ completed: true, watchTime });
      
      // Wait for progress to be saved before showing celebration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if this is the last lesson in the chapter
      if (lessonData && lessonData.isLastInChapter) {
        // Show chapter completion celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Show chapter completion modal
        setShowChapterCompleteModal(true);
        return;
      }
    }
    
    // If there's a next lesson, navigate immediately for fast UX
    if (lessonData?.nextLesson) {
      setLocation(`/lesson/${lessonData.nextLesson.id}`);
      return;
    }
    
    // For last lesson in course, navigate back to course overview
    if (lessonData?.lesson.courseId) {
      setLocation(`/course-overview/${lessonData.lesson.courseId}`);
    }
  };

  const handleBackToChapters = () => {
    if (lessonData?.lesson.courseId) {
      setLocation(`/course-overview/${lessonData.lesson.courseId}`);
    } else {
      setLocation('/courses');
    }
  };

  const handleChapterCompleteModalClose = () => {
    setShowChapterCompleteModal(false);
    // Navigate back to course overview
    if (lessonData?.lesson.courseId) {
      setLocation(`/course-overview/${lessonData.lesson.courseId}`);
    }
  };

  // Handle unauthorized access
  if (error && isUnauthorizedError(error as Error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need to upgrade your plan or purchase this course to access this lesson.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/courses')} className="w-full">
              View Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lessonLoading || !lessonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingAnimation size="lg" message={`Loading lesson ${id}...`} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium">Error loading lesson:</p>
              <p className="text-red-600 text-sm">{error.message}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-2"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { lesson, course, content, progress } = lessonData;
  const isCompleted = progress?.completed || false;
  const progressPercentage = progress?.watchTime ? Math.min((progress.watchTime / 300) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToChapters}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Chapters
              </Button>
              <div className="text-sm text-gray-500">
                {course.title}
              </div>
            </div>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-brand-teal" />
                  <CardTitle className="text-xl">{lesson.title}</CardTitle>
                </div>

              </CardHeader>
              <CardContent>
                {/* Video Player */}
                {lesson.videoUrl && (
                  <div className="mb-6">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <iframe
                        src={lesson.videoUrl}
                        title={lesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsVideoPlaying(true)}
                      />
                    </div>
                  </div>
                )}

                {/* Main Lesson Content - Always show the main lesson content */}
                {lesson.content && (
                  <div className="mb-6">
                    <div
                      className="prose-lesson max-w-none"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                  </div>
                )}

                {/* Sublessions as Accordion - Only show if there are actual sub-lessons */}
                {content.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Content</h3>
                    {contentId ? (
                      // If contentId is provided, show only that specific content
                      content.filter(item => item.id === parseInt(contentId)).map((item, index) => (
                        <Card key={item.id} className="border-l-4 border-l-brand-teal">
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-500">
                                {index + 1}.
                              </span>
                              <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            )}
                            {item.videoUrl && (
                              <div className="mb-4">
                                <iframe
                                  src={item.videoUrl}
                                  title={item.title}
                                  className="w-full h-48 rounded-lg"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            <div
                              className="prose-lesson max-w-none"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      // Show all content as collapsible sublession cards
                      content.map((item, index) => (
                        <Card key={item.id} className="border-l-4 border-l-brand-teal">
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-500">
                                {index + 1}.
                              </span>
                              <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                            )}
                          </CardHeader>
                          <CardContent>
                            {item.videoUrl && (
                              <div className="mb-4">
                                <iframe
                                  src={item.videoUrl}
                                  title={item.title}
                                  className="w-full h-48 rounded-lg"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            <div
                              className="prose-lesson max-w-none"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* Complete Lesson Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={markProgressMutation.isPending}
                      className="w-full bg-green-700 hover:bg-green-800 text-white"
                    >
                      {isCompleted ? (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Next
                        </>
                      ) : (
                        <>
                          {lessonData.isLastInChapter ? (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              Complete Chapter
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 mr-2" />
                              {lessonData.nextLesson ? 'Complete and Next' : 'Complete Lesson'}
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    
                    {lessonData.nextLesson && (
                      <div className="text-sm text-gray-600 text-center">
                        Next: {lessonData.nextLesson.title}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {progress?.watchTime && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{Math.round(progress.watchTime / 60)} minutes watched</span>
                  </div>
                )}

                {progress?.completedAt && (
                  <div className="text-sm text-gray-600">
                    <p>Completed on:</p>
                    <p className="font-medium">
                      {new Date(progress.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-2">Course Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Course:</strong> {course.title}</p>
                    <p><strong>Category:</strong> {course.category}</p>
                    <p><strong>Tier:</strong> {course.tier}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chapter Completion Modal */}
      <Dialog open={showChapterCompleteModal} onOpenChange={setShowChapterCompleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              🎉 Awesome work on completing the chapter!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              You're doing great! Keep going with the next chapter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 mt-6">
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            </div>
            
            <Button
              onClick={handleChapterCompleteModalClose}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Head back to chapters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}