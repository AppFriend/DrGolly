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
import ModuleDetail from './ModuleDetail';
import { FacebookPixel } from '@/lib/facebook-pixel';

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
  content: string;
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

  // Fetch user's module progress
  const { data: moduleProgressData } = useQuery({
    queryKey: ['/api/user/module-progress'],
    queryFn: async () => {
      const response = await fetch('/api/user/module-progress', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch module progress');
      }
      return response.json();
    },
  });

  // Update completed modules when progress data changes
  useEffect(() => {
    if (moduleProgressData) {
      const completedSet = new Set<number>();
      moduleProgressData.forEach((progress: any) => {
        if (progress.completed) {
          completedSet.add(progress.moduleId);
        }
      });
      setCompletedModules(completedSet);
    }
  }, [moduleProgressData]);
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
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
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Track course view with Facebook Pixel
  useEffect(() => {
    if (course) {
      FacebookPixel.trackViewContent(course.id, course.title);
    }
  }, [course]);

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/chapters`],
    enabled: !!courseId,
  });

  // Fetch modules for expanded chapters
  const { data: modulesByChapter = {} } = useQuery({
    queryKey: [`/api/chapters/modules`, expandedChapters],
    queryFn: async () => {
      const modulesData: Record<number, Module[]> = {};
      
      for (const chapterId of expandedChapters) {
        try {
          const response = await fetch(`/api/chapters/${chapterId}/modules`, {
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch modules for chapter ${chapterId}`);
          }
          
          const modules = await response.json();
          modulesData[chapterId] = modules;
        } catch (error) {
          console.error(`Failed to fetch modules for chapter ${chapterId}:`, error);
          modulesData[chapterId] = [];
        }
      }
      
      return modulesData;
    },
    enabled: expandedChapters.length > 0,
  });

  // Fetch chapter progress
  const { data: chapterProgress = [] } = useQuery({
    queryKey: ['/api/user/chapter-progress'],
    retry: false,
  });

  // Chapter progress mutation
  const chapterProgressMutation = useMutation({
    mutationFn: async ({ chapterId, completed }: { chapterId: number; completed: boolean }) => {
      const response = await apiRequest('POST', '/api/user/chapter-progress', {
        chapterId,
        completed,
        completedAt: completed ? new Date() : undefined,
      });
      return await response.json();
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
      const response = await apiRequest('POST', '/api/user/module-progress', {
        moduleId,
        completed,
        watchTime: watchTime || 0,
        completedAt: completed ? new Date() : undefined,
      });
      return await response.json();
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
        
        // Check if all modules in the chapter are now completed
        checkAndCompleteChapter(variables.moduleId);
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

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module);
  };

  const handleBackToChapters = () => {
    setSelectedModule(null);
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
    
    // Calculate percentage based on completed modules
    const completedCount = modules.filter(module => completedModules.has(module.id)).length;
    return Math.round((completedCount / modules.length) * 100);
  };

  // Calculate overall course progress
  const getCourseProgress = () => {
    if (!chapters || chapters.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedChapters = chapterProgress.filter(cp => cp.completed).length;
    const totalChapters = chapters.length;
    const percentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    
    return {
      completed: completedChapters,
      total: totalChapters,
      percentage
    };
  };

  // Check if all modules in a chapter are completed and auto-complete chapter
  const checkAndCompleteChapter = async (moduleId: number) => {
    // Find which chapter this module belongs to
    const chapterWithModule = chapters.find(chapter => {
      const modules = modulesByChapter[chapter.id] || [];
      return modules.some(module => module.id === moduleId);
    });

    if (!chapterWithModule) return;

    // Check if all modules in this chapter are completed
    const chapterModules = modulesByChapter[chapterWithModule.id] || [];
    const allModulesCompleted = chapterModules.every(module => 
      completedModules.has(module.id) || module.id === moduleId
    );

    // If all modules are completed and chapter isn't already marked complete
    if (allModulesCompleted && !chapterProgress.some(cp => cp.chapterId === chapterWithModule.id && cp.completed)) {
      try {
        await chapterProgressMutation.mutateAsync({
          chapterId: chapterWithModule.id,
          completed: true
        });
      } catch (error) {
        console.error('Failed to auto-complete chapter:', error);
      }
    }
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

  // Show module detail if a module is selected
  if (selectedModule) {
    return (
      <ModuleDetail 
        module={selectedModule} 
        onBack={handleBackToChapters}
        isCompleted={completedModules.has(selectedModule.id)}
        onMarkComplete={() => {
          setCompletedModules(prev => new Set(prev).add(selectedModule.id));
          handleModuleComplete(selectedModule.id, true);
        }}
      />
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
                  style={{ width: `${getCourseProgress().percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {getCourseProgress().completed} / {getCourseProgress().total} chapters
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        <div className="space-y-4">
          {(!chapters || !Array.isArray(chapters) || chapters.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No chapters available for this course</p>
            </div>
          ) : (
            chapters.map((chapter: Chapter) => (
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
                              chapterProgress.some(cp => cp.chapterId === chapter.id && cp.completed) 
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
                    <div className="relative pl-8">
                      {/* Connecting line from chapter to first module */}
                      <div className="absolute left-3 top-0 w-px h-4 bg-gray-300"></div>
                      
                      {(modulesByChapter[chapter.id] || []).map((module: Module, index: number) => (
                        <div key={module.id} className="relative">
                          {/* Connecting lines */}
                          <div className="absolute left-[-20px] top-0 flex items-center">
                            {/* Vertical line */}
                            <div className={`w-px bg-gray-300 ${index === 0 ? 'h-6' : 'h-12'}`}></div>
                            {/* Horizontal line */}
                            <div className="w-4 h-px bg-gray-300"></div>
                          </div>
                          
                          {/* Vertical line to next module (if not last) */}
                          {index < (modulesByChapter[chapter.id] || []).length - 1 && (
                            <div className="absolute left-[-20px] top-6 w-px h-8 bg-gray-300"></div>
                          )}
                          
                          <div 
                            className="course-module bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors mb-4 ml-2"
                            data-protected="true"
                            onClick={() => handleModuleClick(module)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  {chapter.chapterNumber}.{index + 1}
                                </Badge>
                                <div>
                                  <h4 className="font-medium cursor-pointer hover:text-teal-600">{module.title}</h4>
                                  <p className="text-sm text-gray-600">{module.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <CheckCircle className={`w-5 h-5 ${
                                  completedModules.has(module.id) 
                                    ? 'text-green-500' 
                                    : 'text-gray-300'
                                }`} />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleModuleClick(module);
                                  }}
                                  className={`text-xs px-2 py-1 h-auto ${
                                    completedModules.has(module.id) 
                                      ? 'text-gray-500 hover:text-gray-700' 
                                      : 'text-teal-600 hover:text-teal-700'
                                  }`}
                                >
                                  {completedModules.has(module.id) ? 'Read Again' : 'Read More'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Chapter completion button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={() => handleChapterComplete(chapter.id, true)}
                          disabled={chapterProgressMutation.isPending}
                          className="bg-green-700 hover:bg-green-800 text-white"
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
            ))
          )}
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