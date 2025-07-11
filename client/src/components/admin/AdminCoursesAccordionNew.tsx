import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Video, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  FileText,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  orderIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  content: string;
  courseId: number;
  orderIndex: number;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  chapterId: number;
  orderIndex: number;
}

interface SubLesson {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  lessonId: number;
  orderIndex: number;
}

interface AdminCoursesAccordionProps {
  courses: Course[];
  onUpdateCourse: (courseId: number, updates: Partial<Course>) => void;
}

export default function AdminCoursesAccordion({ courses, onUpdateCourse }: AdminCoursesAccordionProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'chapter' | 'lesson' | 'sublesson' | null>(null);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [createCourseId, setCreateCourseId] = useState<number | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course chapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/admin/chapters'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch course lessons
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/admin/lessons'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch lesson content (sub-lessons)
  const { data: lessonContentData, isLoading: lessonContentLoading } = useQuery({
    queryKey: ['/api/lesson-content'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Helper functions to organize data
  const getChaptersForCourse = (courseId: number) => {
    if (!chaptersData) return [];
    return chaptersData
      .filter((chapter: any) => chapter.courseId === courseId)
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  };

  const getLessonsForChapter = (chapterId: number) => {
    if (!lessonsData) return [];
    return lessonsData
      .filter((lesson: any) => lesson.chapterId === chapterId)
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  };

  const getSubLessonsForLesson = (lessonId: number) => {
    if (!lessonContentData) return [];
    return lessonContentData
      .filter((subLesson: any) => subLesson.lessonId === lessonId)
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  };

  const handleEdit = (id: string, content: string) => {
    setEditingItem(id);
    setEditContent(content);
  };

  const handleSave = async (id: string, type: 'course' | 'chapter' | 'lesson' | 'sublesson') => {
    try {
      const endpoint = type === 'course' ? `/api/admin/courses/${id}` : 
                     type === 'chapter' ? `/api/admin/chapters/${id}` :
                     type === 'lesson' ? `/api/admin/lessons/${id}` :
                     `/api/admin/lesson-content/${id}`;

      await apiRequest('PUT', endpoint, { content: editContent });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-content'] });

      setEditingItem(null);
      setEditContent('');
      
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: "Error",
        description: `Failed to update ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditContent('');
  };

  const handleCreate = (type: 'chapter' | 'lesson' | 'sublesson', courseId: number, parentId?: number) => {
    setCreateType(type);
    setCreateCourseId(courseId);
    setCreateParentId(parentId || null);
    setCreateTitle('');
    setCreateContent('');
    setCreateVideoUrl('');
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!createType || !createCourseId || !createTitle.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = createType === 'chapter' ? '/api/admin/chapters' :
                     createType === 'lesson' ? '/api/admin/lessons' :
                     '/api/admin/lesson-content';

      const payload = {
        title: createTitle,
        content: createContent,
        videoUrl: createVideoUrl || null,
        courseId: createCourseId,
        ...(createType === 'lesson' && { chapterId: createParentId }),
        ...(createType === 'sublesson' && { lessonId: createParentId }),
      };

      await apiRequest('POST', endpoint, payload);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-content'] });

      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: `${createType.charAt(0).toUpperCase() + createType.slice(1)} created successfully`,
      });
    } catch (error) {
      console.error('Error creating:', error);
      toast({
        title: "Error",
        description: `Failed to create ${createType}`,
        variant: "destructive",
      });
    }
  };

  if (chaptersLoading || lessonsLoading || lessonContentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {course.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {course.category}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreate('chapter', course.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Chapter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {getChaptersForCourse(course.id).map((chapter: any) => (
                  <AccordionItem key={chapter.id} value={`chapter-${chapter.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {chapter.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(`chapter-${chapter.id}`, chapter.content || '');
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreate('lesson', course.id, chapter.id);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-4">
                        {editingItem === `chapter-${chapter.id}` ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="Chapter content..."
                              className="min-h-[100px]"
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleSave(chapter.id.toString(), 'chapter')}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 mb-4">
                            {chapter.content || 'No content'}
                          </div>
                        )}

                        {/* Lessons */}
                        {getLessonsForChapter(chapter.id).map((lesson: any) => (
                          <Card key={lesson.id} className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {lesson.videoUrl ? (
                                    <Video className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-green-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(`lesson-${lesson.id}`, lesson.content || '')}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreate('sublesson', course.id, lesson.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {editingItem === `lesson-${lesson.id}` ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="Lesson content..."
                                    className="min-h-[100px]"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSave(lesson.id.toString(), 'lesson')}
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancel}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-600">
                                    {lesson.content || 'No content'}
                                  </div>
                                  {lesson.videoUrl && (
                                    <div className="text-xs text-blue-600">
                                      Video: {lesson.videoUrl}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Sub-lessons */}
                              {getSubLessonsForLesson(lesson.id).map((subLesson: any) => (
                                <Card key={subLesson.id} className="border-l-4 border-l-orange-500 mt-2">
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-3 w-3 text-orange-500" />
                                        <span className="text-xs font-medium">
                                          {subLesson.title}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(`sublesson-${subLesson.id}`, subLesson.content || '')}
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    {editingItem === `sublesson-${subLesson.id}` ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          placeholder="Sub-lesson content..."
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex items-center space-x-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleSave(subLesson.id.toString(), 'sublesson')}
                                          >
                                            <Save className="h-3 w-3 mr-1" />
                                            Save
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="text-xs text-gray-600">
                                          {subLesson.content || 'No content'}
                                        </div>
                                        {subLesson.videoUrl && (
                                          <div className="text-xs text-blue-600">
                                            Video: {subLesson.videoUrl}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder={`Enter ${createType} title...`}
              />
            </div>
            <div>
              <Label htmlFor="create-content">Content</Label>
              <Textarea
                id="create-content"
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                placeholder={`Enter ${createType} content...`}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="create-video">Video URL (optional)</Label>
              <Input
                id="create-video"
                value={createVideoUrl}
                onChange={(e) => setCreateVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit}>
                Create {createType}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}