import React from 'react';
import { ArrowLeft, Clock, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CopyProtection } from '@/lib/copyProtection';

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

interface ModuleDetailProps {
  module: Module;
  onBack: () => void;
  isCompleted?: boolean;
  onMarkComplete?: (moduleId: number) => void;
}

export default function ModuleDetail({ module, onBack, isCompleted = false, onMarkComplete }: ModuleDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moduleProgressMutation = useMutation({
    mutationFn: async ({ moduleId, completed }: { moduleId: number; completed: boolean }) => {
      const response = await apiRequest('POST', '/api/user/module-progress', {
        moduleId,
        completed,
        watchTime: 0,
        completedAt: completed ? new Date() : undefined,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/module-progress'] });
      
      if (variables.completed) {
        toast({
          title: "Module Complete! 🎉",
          description: "Great job! You've completed this module.",
        });
        onMarkComplete?.(module.id);
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

  const handleMarkComplete = () => {
    moduleProgressMutation.mutate({ moduleId: module.id, completed: true });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span>Course</span>
            <span>/</span>
            <span>Chapter</span>
            <span>/</span>
            <span className="text-gray-900">{module.title}</span>
          </div>
          
          <div className="course-content" data-protected="true">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                {module.contentType === 'video' ? (
                  <Play className="w-5 h-5 text-blue-500" />
                ) : (
                  <div className="w-5 h-5 bg-gray-400 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                )}
                <CheckCircle className={`w-5 h-5 ${
                  isCompleted ? 'text-green-500' : 'text-gray-300'
                }`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                <p className="text-gray-600 mt-2">{module.description}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="flex items-center gap-1">
                {module.contentType === 'video' ? (
                  <>
                    <Play className="w-3 h-3" />
                    Video
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                    Text
                  </>
                )}
              </Badge>
              {module.duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(module.duration)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={onBack} 
            variant="outline" 
            className="flex items-center gap-2 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Button>
          <Button
            onClick={handleMarkComplete}
            disabled={moduleProgressMutation.isPending || isCompleted}
            className={`${
              isCompleted 
                ? 'bg-green-700 hover:bg-green-800' 
                : 'bg-green-700 hover:bg-green-800'
            } text-white`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </Button>
        </div>

        {/* Module Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{module.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="course-content prose prose-lg max-w-none"
              data-protected="true"
              dangerouslySetInnerHTML={{ __html: module.content || 'No content available for this module.' }}
            />
          </CardContent>
        </Card>

        {/* Copy Protection Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-yellow-600 rounded-sm flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
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