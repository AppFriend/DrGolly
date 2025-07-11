import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Video, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  tier: string;
  price: number;
  orderIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  content: string;
  courseId: number;
  chapterIndex: number;
  orderIndex: number;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  chapterIndex: number;
  moduleIndex: number;
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

// Sortable components
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <div {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
}

// Rich text editor component
function RichTextEditor({ 
  content, 
  onSave, 
  onCancel, 
  isEditing = false,
  onEdit
}: { 
  content: string; 
  onSave: (content: string) => void; 
  onCancel: () => void; 
  isEditing: boolean;
  onEdit: () => void;
}) {
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div 
          className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg min-h-[100px]"
          dangerouslySetInnerHTML={{ __html: content || '<p>No content available</p>' }}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          className="w-full"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Content
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Textarea 
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        rows={8}
        className="w-full"
        placeholder="Enter HTML content..."
      />
      <div className="flex gap-2">
        <Button 
          onClick={() => onSave(editContent)}
          size="sm"
          className="bg-green-700 hover:bg-green-800"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button 
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminCoursesAccordion({ courses, onUpdateCourse }: AdminCoursesAccordionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch chapters for expanded courses
  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/admin/chapters'],
    enabled: expandedCourses.length > 0,
  });

  // Fetch lessons for expanded chapters
  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/admin/lessons'],
    enabled: expandedChapters.length > 0,
  });

  // Fetch sublessons for expanded lessons
  const { data: sublessons = [] } = useQuery({
    queryKey: ['/api/admin/sublessons'],
    enabled: expandedLessons.length > 0,
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ type, id, content }: { type: string; id: number; content: string }) => {
      const response = await fetch(`/api/admin/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({
        title: "Content Updated",
        description: "The content has been successfully updated.",
      });
      setEditingContent(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Handle reordering logic based on the type of item being dragged
      // Implementation depends on the specific drag and drop requirements
      console.log('Reordering items:', active.id, over.id);
    }
  };

  const handleContentSave = (type: string, id: number, content: string) => {
    updateContentMutation.mutate({ type, id, content });
  };

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Course Management</h2>
          <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        <SortableContext items={courses.map(c => c.id.toString())} strategy={verticalListSortingStrategy}>
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <SortableItem id={course.id.toString()}>
                <div className="flex-1">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCourseExpansion(course.id.toString())}
                  >
                    <div className="flex items-center gap-3">
                      {expandedCourses.includes(course.id.toString()) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <BookOpen className="w-5 h-5 text-brand-teal" />
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.tier}</Badge>
                      <Badge variant="outline">${course.price}</Badge>
                    </div>
                  </div>

                  {expandedCourses.includes(course.id.toString()) && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-4">
                        {/* Course Description */}
                        <div>
                          <h4 className="font-medium mb-2">Course Description</h4>
                          <RichTextEditor 
                            content={course.description}
                            onSave={(content) => handleContentSave('courses', course.id, content)}
                            onCancel={() => setEditingContent(null)}
                            isEditing={editingContent === `course-${course.id}`}
                            onEdit={() => setEditingContent(`course-${course.id}`)}
                          />
                        </div>

                        {/* Chapters */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Chapters</h4>
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Chapter
                            </Button>
                          </div>
                          
                          <div className="pl-4 space-y-2">
                            {chapters
                              .filter(chapter => chapter.courseId === course.id)
                              .map((chapter) => (
                                <Card key={chapter.id} className="border-l-4 border-l-blue-500">
                                  <SortableItem id={`chapter-${chapter.id}`}>
                                    <div className="flex-1">
                                      <div 
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleChapterExpansion(chapter.id.toString())}
                                      >
                                        <div className="flex items-center gap-2">
                                          {expandedChapters.includes(chapter.id.toString()) ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          <span className="font-medium">{chapter.chapterIndex} {chapter.title}</span>
                                        </div>
                                      </div>

                                      {expandedChapters.includes(chapter.id.toString()) && (
                                        <div className="border-t bg-white p-3">
                                          <div className="space-y-4">
                                            {/* Chapter Content */}
                                            <RichTextEditor 
                                              content={chapter.content}
                                              onSave={(content) => handleContentSave('chapters', chapter.id, content)}
                                              onCancel={() => setEditingContent(null)}
                                              isEditing={editingContent === `chapter-${chapter.id}`}
                                              onEdit={() => setEditingContent(`chapter-${chapter.id}`)}
                                            />

                                            {/* Lessons */}
                                            <div>
                                              <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium">Lessons</h5>
                                                <Button size="sm" variant="outline">
                                                  <Plus className="w-4 h-4 mr-1" />
                                                  Add Lesson
                                                </Button>
                                              </div>
                                              
                                              <div className="pl-4 space-y-2">
                                                {lessons
                                                  .filter(lesson => lesson.chapterIndex === chapter.chapterIndex)
                                                  .map((lesson) => (
                                                    <Card key={lesson.id} className="border-l-4 border-l-green-500">
                                                      <SortableItem id={`lesson-${lesson.id}`}>
                                                        <div className="flex-1">
                                                          <div 
                                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                                            onClick={() => toggleLessonExpansion(lesson.id.toString())}
                                                          >
                                                            <div className="flex items-center gap-2">
                                                              {expandedLessons.includes(lesson.id.toString()) ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                              ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                              )}
                                                              <span className="font-medium">{lesson.moduleIndex} {lesson.title}</span>
                                                              {lesson.videoUrl && (
                                                                <Video className="w-4 h-4 text-blue-500" />
                                                              )}
                                                            </div>
                                                          </div>

                                                          {expandedLessons.includes(lesson.id.toString()) && (
                                                            <div className="border-t bg-white p-3">
                                                              <div className="space-y-4">
                                                                {/* Lesson Content */}
                                                                <RichTextEditor 
                                                                  content={lesson.content}
                                                                  onSave={(content) => handleContentSave('lessons', lesson.id, content)}
                                                                  onCancel={() => setEditingContent(null)}
                                                                  isEditing={editingContent === `lesson-${lesson.id}`}
                                                                  onEdit={() => setEditingContent(`lesson-${lesson.id}`)}
                                                                />

                                                                {/* Video URL */}
                                                                {lesson.videoUrl && (
                                                                  <div>
                                                                    <h6 className="font-medium mb-2">Video URL</h6>
                                                                    <Input 
                                                                      value={lesson.videoUrl}
                                                                      onChange={(e) => {
                                                                        // Handle video URL update
                                                                      }}
                                                                    />
                                                                  </div>
                                                                )}

                                                                {/* Sub-lessons */}
                                                                <div>
                                                                  <div className="flex items-center justify-between mb-2">
                                                                    <h6 className="font-medium">Sub-lessons</h6>
                                                                    <Button size="sm" variant="outline">
                                                                      <Plus className="w-4 h-4 mr-1" />
                                                                      Add Sub-lesson
                                                                    </Button>
                                                                  </div>
                                                                  
                                                                  <div className="pl-4 space-y-2">
                                                                    {sublessons
                                                                      .filter(sublesson => sublesson.lessonId === lesson.id)
                                                                      .map((sublesson) => (
                                                                        <Card key={sublesson.id} className="border-l-4 border-l-purple-500">
                                                                          <SortableItem id={`sublesson-${sublesson.id}`}>
                                                                            <div className="flex-1 p-3">
                                                                              <div className="flex items-center justify-between mb-2">
                                                                                <span className="font-medium">{sublesson.title}</span>
                                                                                {sublesson.videoUrl && (
                                                                                  <Video className="w-4 h-4 text-blue-500" />
                                                                                )}
                                                                              </div>
                                                                              
                                                                              <RichTextEditor 
                                                                                content={sublesson.content}
                                                                                onSave={(content) => handleContentSave('sublessons', sublesson.id, content)}
                                                                                onCancel={() => setEditingContent(null)}
                                                                                isEditing={editingContent === `sublesson-${sublesson.id}`}
                                                                                onEdit={() => setEditingContent(`sublesson-${sublesson.id}`)}
                                                                              />
                                                                            </div>
                                                                          </SortableItem>
                                                                        </Card>
                                                                      ))}
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </SortableItem>
                                                    </Card>
                                                  ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </SortableItem>
                                </Card>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SortableItem>
            </Card>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}