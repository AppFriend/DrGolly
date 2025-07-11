import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Video, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  GripVertical,
  FileText,
  Play,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable Item Component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-start gap-2">
        <div {...listeners} className="cursor-grab hover:cursor-grabbing mt-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Rich Text Editor Component
function RichTextEditor({ 
  content, 
  onSave, 
  onCancel, 
  isEditing = false,
  onEdit,
  placeholder = "Enter content..."
}: { 
  content: string; 
  onSave: (content: string) => void; 
  onCancel: () => void; 
  isEditing: boolean;
  onEdit: () => void;
  placeholder?: string;
}) {
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    setEditContent(content);
  }, [content, isEditing]);

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div 
          className="prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg min-h-[80px] text-sm"
          dangerouslySetInnerHTML={{ __html: content || `<p class="text-gray-500 italic">${placeholder}</p>` }}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          className="h-8 text-xs"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea 
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] text-sm"
        rows={6}
      />
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => onSave(editContent)}
          className="h-8 text-xs bg-green-600 hover:bg-green-700"
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          className="h-8 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Create New Item Dialog
function CreateItemDialog({ 
  type, 
  parentId, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  type: 'chapter' | 'lesson' | 'sublesson'; 
  parentId: number; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void; 
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleSave = () => {
    const data = {
      title,
      content,
      videoUrl: videoUrl || undefined,
      [`${type === 'chapter' ? 'courseId' : type === 'lesson' ? 'chapterId' : 'lessonId'}`]: parentId,
      orderIndex: 0
    };
    onSave(data);
    setTitle('');
    setContent('');
    setVideoUrl('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${type} title`}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter ${type} content`}
              rows={4}
            />
          </div>
          {type !== 'chapter' && (
            <div>
              <Label htmlFor="videoUrl">Video URL (optional)</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://vimeo.com/..."
              />
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Create {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCoursesAccordion({ courses, onUpdateCourse }: AdminCoursesAccordionProps) {
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<{ type: 'course' | 'chapter' | 'lesson' | 'sublesson'; id: number } | null>(null);
  const [createDialog, setCreateDialog] = useState<{ type: 'chapter' | 'lesson' | 'sublesson'; parentId: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch chapters for each course
  const { data: allChapters } = useQuery({
    queryKey: ['/api/chapters'],
    enabled: courses?.length > 0,
  });

  // Fetch lessons for each chapter
  const { data: allLessons } = useQuery({
    queryKey: ['/api/lessons'],
    enabled: courses?.length > 0,
  });

  // Fetch sublessons for each lesson
  const { data: allSubLessons } = useQuery({
    queryKey: ['/api/sublessons'],
    enabled: courses?.length > 0,
  });

  // Mutations for content updates
  const updateChapterMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest('PATCH', `/api/chapters/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
      toast({ title: "Success", description: "Chapter updated successfully" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest('PATCH', `/api/lessons/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      toast({ title: "Success", description: "Lesson updated successfully" });
    },
  });

  const updateSubLessonMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest('PATCH', `/api/sublessons/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sublessons'] });
      toast({ title: "Success", description: "Sub-lesson updated successfully" });
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/chapters', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
      toast({ title: "Success", description: "Chapter created successfully" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/lessons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      toast({ title: "Success", description: "Lesson created successfully" });
    },
  });

  const createSubLessonMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/sublessons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sublessons'] });
      toast({ title: "Success", description: "Sub-lesson created successfully" });
    },
  });

  // Helper functions
  const getChaptersForCourse = (courseId: number): Chapter[] => {
    return (allChapters || [])
      .filter((chapter: Chapter) => chapter.courseId === courseId)
      .sort((a: Chapter, b: Chapter) => a.orderIndex - b.orderIndex);
  };

  const getLessonsForChapter = (chapterId: number): Lesson[] => {
    return (allLessons || [])
      .filter((lesson: Lesson) => lesson.chapterId === chapterId)
      .sort((a: Lesson, b: Lesson) => a.orderIndex - b.orderIndex);
  };

  const getSubLessonsForLesson = (lessonId: number): SubLesson[] => {
    return (allSubLessons || [])
      .filter((subLesson: SubLesson) => subLesson.lessonId === lessonId)
      .sort((a: SubLesson, b: SubLesson) => a.orderIndex - b.orderIndex);
  };

  // Content update handlers
  const handleUpdateContent = (type: 'chapter' | 'lesson' | 'sublesson', id: number, content: string) => {
    const mutation = type === 'chapter' ? updateChapterMutation : 
                    type === 'lesson' ? updateLessonMutation : updateSubLessonMutation;
    
    mutation.mutate({ id, updates: { content } });
    setEditingItem(null);
  };

  const handleCreateItem = (type: 'chapter' | 'lesson' | 'sublesson', data: any) => {
    const mutation = type === 'chapter' ? createChapterMutation : 
                    type === 'lesson' ? createLessonMutation : createSubLessonMutation;
    
    mutation.mutate(data);
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Handle reordering logic here
    toast({ title: "Info", description: "Drag and drop reordering will be implemented in backend" });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sleep": return "bg-blue-100 text-blue-800";
      case "nutrition": return "bg-green-100 text-green-800";
      case "health": return "bg-red-100 text-red-800";
      case "freebies": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Debug logging
  console.log('AdminCoursesAccordion received courses:', courses);
  console.log('Chapters data:', allChapters);
  console.log('Lessons data:', allLessons);
  console.log('Sublessons data:', allSubLessons);

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">No courses available (courses: {courses?.length || 'undefined'})</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Accordion type="multiple" value={expandedCourses} onValueChange={setExpandedCourses}>
          {courses.map((course) => (
            <AccordionItem key={course.id} value={course.id.toString()}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-left flex-1">{course.title}</span>
                  <Badge className={`${getCategoryColor(course.category)} text-xs`}>
                    {course.category}
                  </Badge>
                  <span className="text-sm text-gray-500">${course.price}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  {/* Course Description */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Course Description</h4>
                    <p className="text-sm text-gray-600">{course.description}</p>
                  </div>

                  {/* Add Chapter Button */}
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Chapters</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCreateDialog({ type: 'chapter', parentId: course.id })}
                      className="h-8 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Chapter
                    </Button>
                  </div>

                  {/* Chapters */}
                  <SortableContext 
                    items={getChaptersForCourse(course.id).map(c => c.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {getChaptersForCourse(course.id).map((chapter) => (
                        <SortableItem key={chapter.id} id={chapter.id.toString()}>
                          <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-sm">{chapter.title}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setCreateDialog({ type: 'lesson', parentId: chapter.id })}
                                  className="h-7 text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Lesson
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <RichTextEditor
                                content={chapter.content}
                                onSave={(content) => handleUpdateContent('chapter', chapter.id, content)}
                                onCancel={() => setEditingItem(null)}
                                isEditing={editingItem?.type === 'chapter' && editingItem?.id === chapter.id}
                                onEdit={() => setEditingItem({ type: 'chapter', id: chapter.id })}
                                placeholder="Enter chapter content..."
                              />

                              {/* Lessons */}
                              <div className="mt-4 space-y-2">
                                {getLessonsForChapter(chapter.id).map((lesson) => (
                                  <Card key={lesson.id} className="border-l-4 border-l-green-500 ml-4">
                                    <CardHeader className="pb-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {lesson.videoUrl ? (
                                            <Play className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-green-600" />
                                          )}
                                          <span className="font-medium text-sm">{lesson.title}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setCreateDialog({ type: 'sublesson', parentId: lesson.id })}
                                          className="h-6 text-xs"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Sub-lesson
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      <RichTextEditor
                                        content={lesson.content}
                                        onSave={(content) => handleUpdateContent('lesson', lesson.id, content)}
                                        onCancel={() => setEditingItem(null)}
                                        isEditing={editingItem?.type === 'lesson' && editingItem?.id === lesson.id}
                                        onEdit={() => setEditingItem({ type: 'lesson', id: lesson.id })}
                                        placeholder="Enter lesson content..."
                                      />

                                      {/* Sub-lessons */}
                                      <div className="mt-3 space-y-2">
                                        {getSubLessonsForLesson(lesson.id).map((subLesson) => (
                                          <Card key={subLesson.id} className="border-l-4 border-l-orange-500 ml-4">
                                            <CardHeader className="pb-2">
                                              <div className="flex items-center gap-2">
                                                {subLesson.videoUrl ? (
                                                  <Play className="h-3 w-3 text-orange-600" />
                                                ) : (
                                                  <FileText className="h-3 w-3 text-orange-600" />
                                                )}
                                                <span className="font-medium text-xs">{subLesson.title}</span>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                              <RichTextEditor
                                                content={subLesson.content}
                                                onSave={(content) => handleUpdateContent('sublesson', subLesson.id, content)}
                                                onCancel={() => setEditingItem(null)}
                                                isEditing={editingItem?.type === 'sublesson' && editingItem?.id === subLesson.id}
                                                onEdit={() => setEditingItem({ type: 'sublesson', id: subLesson.id })}
                                                placeholder="Enter sub-lesson content..."
                                              />
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DndContext>

      {/* Create Item Dialog */}
      {createDialog && (
        <CreateItemDialog
          type={createDialog.type}
          parentId={createDialog.parentId}
          isOpen={!!createDialog}
          onClose={() => setCreateDialog(null)}
          onSave={(data) => handleCreateItem(createDialog.type, data)}
        />
      )}
    </div>
  );
}