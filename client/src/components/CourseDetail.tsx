import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Play, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { CopyProtection } from '@/lib/copyProtection';
import { apiRequest } from '@/lib/queryClient';
import confetti from 'canvas-confetti';

interface CourseDetailProps {
  courseId: number;
  onClose: () => void;
}

interface Chapter {
  id: number;
  title: string;
  description: string;
  chapterNumber: string;
  orderIndex: number;
  isCompleted: boolean;
  courseId: number;
}

interface Module {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  contentType: 'text' | 'video';
  duration?: number;
  chapterId: number;
  courseId: number;
}

interface ChapterProgress {
  id: number;
  userId: string;
  chapterId: number;
  completed: boolean;
  completedAt?: string;
}

interface ModuleProgress {
  id: number;
  userId: string;
  moduleId: number;
  completed: boolean;
  watchTime: number;
  completedAt?: string;
}

export default function CourseDetail({ courseId, onClose }: CourseDetailProps) {
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);
  const [copyProtection, setCopyProtection] = useState<CopyProtection | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#095D66', '#83CFCC', '#10B981', '#F59E0B']
    });
  };

  // Initialize copy protection on mount
  useEffect(() => {
    const protection = CopyProtection.getInstance();
    setCopyProtection(protection);
    return () => {
      protection.destroy();
    };
  }, []);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest('GET', `/api/courses/${courseId}`),
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'chapters'],
    queryFn: () => apiRequest('GET', `/api/courses/${courseId}/chapters`),
  });

  // Fetch modules for expanded chapters
  const { data: modulesByChapter = {} } = useQuery({
    queryKey: ['/api/chapters', expandedChapters, 'modules'],
    queryFn: async () => {
      const modulesData: Record<number, Module[]> = {};
      
      for (const chapterId of expandedChapters) {
        const modules = await apiRequest('GET', `/api/chapters/${chapterId}/modules`);
        modulesData[chapterId] = modules;
      }
      
      return modulesData;
    },
    enabled: expandedChapters.length > 0,
  });

  // Chapter progress mutation
  const chapterProgressMutation = useMutation({
    mutationFn: async ({ chapterId, completed }: { chapterId: number; completed: boolean }) => {
      return await apiRequest('POST', '/api/user/chapter-progress', {
        chapterId,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/chapter-progress'] });
      
      if (variables.completed) {
        setCompletedChapters(prev => new Set(prev).add(variables.chapterId));
        triggerConfetti();
        toast({
          title: "Chapter Complete! 🎉",
          description: "Excellent work! You've completed this chapter.",
        });
      } else {
        toast({
          title: "Progress Updated",
          description: "Chapter progress has been saved!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update chapter progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Module progress mutation
  const moduleProgressMutation = useMutation({
    mutationFn: async ({ moduleId, completed, watchTime }: { moduleId: number; completed: boolean; watchTime?: number }) => {
      return await apiRequest('POST', '/api/user/module-progress', {
        moduleId,
        completed,
        watchTime: watchTime || 0,
        completedAt: completed ? new Date().toISOString() : undefined,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/module-progress'] });
      
      if (variables.completed) {
        setCompletedModules(prev => new Set(prev).add(variables.moduleId));
        triggerConfetti();
        toast({
          title: "Module Complete! 🎉",
          description: "Great job! You've completed this module.",
        });
      } else {
        toast({
          title: "Progress Updated",
          description: "Module progress has been saved!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update module progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleChapterComplete = (chapterId: number, completed: boolean) => {
    chapterProgressMutation.mutate({ chapterId, completed });
  };

  const handleModuleComplete = (moduleId: number, completed: boolean) => {
    moduleProgressMutation.mutate({ moduleId, completed });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getChapterProgress = (chapterId: number) => {
    const modules = modulesByChapter[chapterId] || [];
    if (modules.length === 0) return 0;
    
    // For demo purposes, return 0 - in real app, fetch from API
    return 0;
  };

  if (courseLoading || chaptersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={onClose} variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
          
          <div className="course-content" data-protected="true">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course?.title}</h1>
            <p className="text-gray-600 mb-4">{course?.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary">{course?.category}</Badge>
              <Badge variant="outline">{course?.tier}</Badge>
              <Badge variant="outline">{course?.ageRange}</Badge>
            </div>
          </div>
        </div>

        {/* Course Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
              <span className="text-sm text-gray-600">0 / {chapters.length} chapters</span>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.map((chapter: Chapter) => (
            <Card key={chapter.id} className="course-chapter" data-protected="true">
              <Collapsible 
                open={expandedChapters.includes(chapter.id)}
                onOpenChange={() => toggleChapter(chapter.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {chapter.chapterNumber}
                          </Badge>
                          <CheckCircle 
                            className={`w-5 h-5 ${
                              getChapterProgress(chapter.id) === 100 
                                ? 'text-green-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{chapter.title}</CardTitle>
                          <p className="text-sm text-gray-600">{chapter.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {getChapterProgress(chapter.id)}% complete
                        </span>
                        {expandedChapters.includes(chapter.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {(modulesByChapter[chapter.id] || []).map((module: Module) => (
                        <div 
                          key={module.id} 
                          className="course-module bg-gray-50 rounded-lg p-4 border border-gray-200"
                          data-protected="true"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {module.contentType === 'video' ? (
                                  <Play className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-500" />
                                )}
                                <CheckCircle className={`w-4 h-4 ${
                                  completedModules.has(module.id) 
                                    ? 'text-green-500' 
                                    : 'text-gray-300'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-medium">{module.title}</h4>
                                <p className="text-sm text-gray-600">{module.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {module.duration && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDuration(module.duration)}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleModuleComplete(module.id, true)}
                                disabled={moduleProgressMutation.isPending}
                              >
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Chapter completion button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={() => handleChapterComplete(chapter.id, true)}
                          disabled={chapterProgressMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Chapter Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Copy Protection Notice */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">Content Protection</h3>
                <p className="text-sm text-yellow-700">
                  This content is generated by medical professionals and is copyrighted. 
                  Copying, downloading, or sharing this content is not permitted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}