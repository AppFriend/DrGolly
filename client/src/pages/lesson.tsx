import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Play, CheckCircle, Circle, Clock, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';

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
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [watchTime, setWatchTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
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
      toast({
        title: "Progress Updated",
        description: "Your lesson progress has been saved",
      });
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

  const handleMarkComplete = () => {
    markProgressMutation.mutate({ completed: true, watchTime });
  };

  const handleBackToCourse = () => {
    if (lessonData?.lesson.courseId) {
      setLocation(`/courses/${lessonData.lesson.courseId}`);
    } else {
      setLocation('/courses');
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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
                onClick={handleBackToCourse}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Course
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
                {lesson.content && (
                  <CardDescription>{lesson.content}</CardDescription>
                )}
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

                {/* Lesson Content Items */}
                {content.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Lesson Content</h3>
                    {content.map((item, index) => (
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
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Complete Lesson Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isCompleted || markProgressMutation.isPending}
                    className="w-full bg-green-700 hover:bg-green-800 text-white"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Lesson Completed
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
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

      {/* Mobile Floating Button */}
      <div className="fixed bottom-4 left-4 right-4 lg:hidden">
        <Button
          onClick={handleMarkComplete}
          disabled={isCompleted || markProgressMutation.isPending}
          className="w-full bg-green-700 hover:bg-green-800 text-white"
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 mr-2" />
              Mark Complete
            </>
          )}
        </Button>
      </div>
    </div>
  );
}