import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Eye, 
  Heart, 
  Save,
  Calendar,
  Tag,
  Play,
  FileText,
  Book,
  Users,
  DollarSign,
  List,
  Grid3X3,
  BookOpen,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminCoursesAccordion from './AdminCoursesAccordionNew';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InlineEditTitle } from "./InlineEditTitle";

interface SortableChapterProps {
  chapter: any;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateTitle: (title: string) => void;
  children: React.ReactNode;
}

function SortableChapter({ chapter, isExpanded, onToggle, onUpdateTitle, children }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg mb-2">
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-t-lg">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <Book className="h-4 w-4 text-green-600" />
        <InlineEditTitle
          title={chapter.title}
          onSave={onUpdateTitle}
          className="text-sm font-medium flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="hover:bg-gray-200"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isExpanded && (
        <div className="p-3 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

interface SortableLessonProps {
  lesson: any;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateTitle: (title: string) => void;
  onEditContent: () => void;
  isEditing: boolean;
  editContent: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function SortableLesson({ 
  lesson, 
  isExpanded, 
  onToggle, 
  onUpdateTitle, 
  onEditContent, 
  isEditing, 
  editContent, 
  onContentChange, 
  onSave, 
  onCancel 
}: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg mb-2 ml-6">
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-t-lg">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <FileText className="h-4 w-4 text-blue-600" />
        <InlineEditTitle
          title={lesson.title}
          onSave={onUpdateTitle}
          className="text-sm font-medium flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditContent}
          className="hover:bg-blue-200"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="hover:bg-blue-200"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isExpanded && (
        <div className="p-3 border-t">
          {isEditing ? (
            <div className="space-y-3">
              <RichTextEditor
                content={editContent}
                onChange={onContentChange}
                placeholder="Enter lesson content..."
              />
              <div className="flex gap-2">
                <Button onClick={onSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose-lesson text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: lesson.content || "No content available" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Course {
  id: number;
  title: string;
  
  // Course Description Page Fields (for marketing/purchase page)
  description: string; // Short description for course cards
  detailedDescription?: string; // Detailed description for course description page
  websiteContent?: string; // Full marketing content
  keyFeatures?: string[]; // Array of key features for marketing
  whatsCovered?: string[]; // Array of what's covered points
  price: number;
  discountedPrice?: number;
  rating?: number; // Course rating for description page
  reviewCount?: number; // Number of reviews for description page
  thumbnailUrl?: string; // Thumbnail for course cards and description page
  
  // Course Overview Page Fields (for purchased course experience)
  overviewDescription?: string; // Welcome message for purchased course
  learningObjectives?: string[]; // What students will learn
  completionCriteria?: string; // How course completion is determined
  courseStructureNotes?: string; // Notes about course organization
  
  // Shared Fields (used by both description and overview pages)
  category: string;
  videoUrl?: string; // Course introduction video
  duration: number; // Total course duration in minutes
  ageRange?: string;
  tier: string;
  skillLevel: string;
  stripeProductId?: string;
  uniqueId?: string;
  isPublished?: boolean;
  status?: string; // draft, published, archived
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderIndex: number;
  createdAt: string;
}

interface CourseSubmodule {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  content: string;
  orderIndex: number;
  duration: number;
  createdAt: string;
}

export function AdminCourseManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"accordion" | "cards">("accordion");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/admin/courses/detailed"],
  });

  const createCourseMutation = useMutation({
    mutationFn: (course: Partial<Course>) =>
      apiRequest("POST", "/api/courses", course),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Course> }) =>
      apiRequest("PATCH", `/api/courses/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = (courseData: Partial<Course>) => {
    createCourseMutation.mutate(courseData);
  };

  const handleUpdateCourse = (updates: Partial<Course>) => {
    if (!selectedCourse) return;
    updateCourseMutation.mutate({ id: selectedCourse.id, updates });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sleep":
        return "bg-blue-100 text-blue-800";
      case "nutrition":
        return "bg-green-100 text-green-800";
      case "health":
        return "bg-red-100 text-red-800";
      case "freebies":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "platinum":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage courses with chapters and submodules
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "accordion" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("accordion")}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Accordion
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Cards
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#6B9CA3] hover:bg-[#095D66] w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <CourseForm
                onSubmit={handleCreateCourse}
                isLoading={createCourseMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Course Preview Dialog */}
      <Dialog open={!!previewCourse} onOpenChange={(open) => !open && setPreviewCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Course Preview</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewCourse(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewCourse && (
            <div className="space-y-4">
              {/* User View Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Currently viewing as a user</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewCourse(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Back to Admin
                  </Button>
                </div>
              </div>

              {/* Course Preview Content */}
              <CoursePreview course={previewCourse} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Courses List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-4 w-4" />
            Courses ({courses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {viewMode === "accordion" ? (
                <div className="space-y-4">
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map((course: Course) => (
                      <CourseAccordionView 
                        key={course.id} 
                        course={course}
                        onUpdateCourse={handleUpdateCourse}
                        onPreviewCourse={setPreviewCourse}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No courses available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map((course: Course) => (
                      <div
                        key={course.id}
                        className="border rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-start space-x-3">
                          {course.thumbnailUrl && (
                            <div className="w-12 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm truncate mr-2">{course.title}</h3>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewCourse(course)}
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCourse(course)}
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${getCategoryColor(course.category)} text-xs px-2 py-0.5`}>
                                {course.category}
                              </Badge>
                              <Badge className={`${getTierColor(course.tier)} text-xs px-2 py-0.5`}>
                                {course.tier}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${typeof course.price === 'number' ? course.price.toFixed(2) : course.price}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(course.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {course.views}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Heart className="h-3 w-3" />
                                {course.likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No courses available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: Partial<Course>) => void;
  isLoading: boolean;
}

function CourseForm({ course, onSubmit, isLoading }: CourseFormProps) {
  const [activeTab, setActiveTab] = useState<"description" | "overview" | "shared">("description");
  const [formData, setFormData] = useState({
    title: course?.title || "",
    
    // Course Description Page Fields
    description: course?.description || "",
    detailedDescription: course?.detailedDescription || "",
    websiteContent: course?.websiteContent || "",
    keyFeatures: course?.keyFeatures || [],
    whatsCovered: course?.whatsCovered || [],
    price: course?.price || 120,
    discountedPrice: course?.discountedPrice || 0,
    rating: course?.rating || 4.8,
    reviewCount: course?.reviewCount || 0,
    thumbnailUrl: course?.thumbnailUrl || "",
    
    // Course Overview Page Fields
    overviewDescription: course?.overviewDescription || "",
    learningObjectives: course?.learningObjectives || [],
    completionCriteria: course?.completionCriteria || "",
    courseStructureNotes: course?.courseStructureNotes || "",
    
    // Shared Fields
    category: course?.category || "sleep",
    videoUrl: course?.videoUrl || "",
    duration: course?.duration || 0,
    ageRange: course?.ageRange || "",
    tier: course?.tier || "free",
    skillLevel: course?.skillLevel || "beginner",
    stripeProductId: course?.stripeProductId || "",
    uniqueId: course?.uniqueId || "",
    isPublished: course?.isPublished || false,
    status: course?.status || "draft",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Title - Always visible */}
      <div>
        <Label htmlFor="title">Course Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter course title..."
          required
        />
      </div>

      {/* Tabbed Interface for Course Content Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Description Page</TabsTrigger>
          <TabsTrigger value="overview">Overview Page</TabsTrigger>
          <TabsTrigger value="shared">Shared Settings</TabsTrigger>
        </TabsList>

        {/* Course Description Page Fields */}
        <TabsContent value="description" className="space-y-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">Course Description Page</h4>
            <p className="text-sm text-blue-700">These fields are used for the marketing/purchase page when users haven't bought the course.</p>
          </div>
          
          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description for course cards..."
              rows={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="detailedDescription">Detailed Description</Label>
            <Textarea
              id="detailedDescription"
              value={formData.detailedDescription}
              onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
              placeholder="Detailed marketing description for course description page..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="websiteContent">Website Marketing Content</Label>
            <Textarea
              id="websiteContent"
              value={formData.websiteContent}
              onChange={(e) => setFormData({ ...formData, websiteContent: e.target.value })}
              placeholder="Full marketing content for course detail page..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="discountedPrice">Discounted Price ($)</Label>
              <Input
                id="discountedPrice"
                type="number"
                value={formData.discountedPrice}
                onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Course Rating</Label>
              <Input
                id="rating"
                type="number"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                min="0"
                max="5"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="reviewCount">Number of Reviews</Label>
              <Input
                id="reviewCount"
                type="number"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>
        </TabsContent>

        {/* Course Overview Page Fields */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-green-900 mb-2">Course Overview Page</h4>
            <p className="text-sm text-green-700">These fields are used for the purchased course learning experience.</p>
          </div>

          <div>
            <Label htmlFor="overviewDescription">Welcome Message</Label>
            <Textarea
              id="overviewDescription"
              value={formData.overviewDescription}
              onChange={(e) => setFormData({ ...formData, overviewDescription: e.target.value })}
              placeholder="Welcome message for purchased course users..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="completionCriteria">Completion Criteria</Label>
            <Textarea
              id="completionCriteria"
              value={formData.completionCriteria}
              onChange={(e) => setFormData({ ...formData, completionCriteria: e.target.value })}
              placeholder="How course completion is determined..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="courseStructureNotes">Course Structure Notes</Label>
            <Textarea
              id="courseStructureNotes"
              value={formData.courseStructureNotes}
              onChange={(e) => setFormData({ ...formData, courseStructureNotes: e.target.value })}
              placeholder="Notes about course organization and structure..."
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Shared Settings */}
        <TabsContent value="shared" className="space-y-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Shared Settings</h4>
            <p className="text-sm text-gray-700">These fields are used by both description and overview pages.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sleep">Sleep</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="freebies">Freebies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skillLevel">Skill Level</Label>
              <Select
                value={formData.skillLevel}
                onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="ageRange">Age Range</Label>
              <Input
                id="ageRange"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder="e.g., 4-16 Weeks"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="videoUrl">Course Introduction Video URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://example.com/intro-video.mp4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stripeProductId">Stripe Product ID</Label>
              <Input
                id="stripeProductId"
                value={formData.stripeProductId}
                onChange={(e) => setFormData({ ...formData, stripeProductId: e.target.value })}
                placeholder="prod_xxxxx"
              />
            </div>
            <div>
              <Label htmlFor="uniqueId">Unique ID</Label>
              <Input
                id="uniqueId"
                value={formData.uniqueId}
                onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                placeholder="unique-course-identifier"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Course"}
        </Button>
      </div>
    </form>
  );
}

interface CourseEditorProps {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
  isLoading: boolean;
}

function CourseEditor({ course, onUpdate, isLoading }: CourseEditorProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <CourseForm
          course={course}
          onSubmit={onUpdate}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="modules" className="mt-4">
        <CourseModuleManager courseId={course.id} />
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Course Settings</h3>
          <p className="text-gray-600">Advanced course configuration options coming soon...</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface CourseModuleManagerProps {
  courseId: number;
}

function CourseModuleManager({ courseId }: CourseModuleManagerProps) {
  const { data: modules, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId, "modules"],
    queryFn: () => apiRequest("GET", `/api/courses/${courseId}/modules`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Modules</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {modules?.map((module: CourseModule) => (
            <div key={module.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{module.title}</h4>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Book className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseAccordionViewProps {
  course: Course;
  onUpdateCourse: (updates: Partial<Course>) => void;
  onPreviewCourse: (course: Course) => void;
}

function CourseAccordionView({ course, onUpdateCourse, onPreviewCourse }: CourseAccordionViewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch course chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/courses/${course.id}/chapters`],
    enabled: !!course.id,
  });

  // Fetch course lessons
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/courses/${course.id}/lessons`],
    enabled: !!course.id,
  });

  // Update lesson content mutation
  const updateLessonMutation = useMutation({
    mutationFn: ({ lessonId, content }: { lessonId: number; content: string }) =>
      apiRequest("PATCH", `/api/lessons/${lessonId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/lessons`] });
      toast({
        title: "Success",
        description: "Lesson content updated successfully",
      });
      setEditingLesson(null);
      setEditContent('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Title update mutations
  const updateCourseTitleMutation = useMutation({
    mutationFn: (newTitle: string) =>
      apiRequest("PATCH", `/api/courses/${course.id}`, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses/detailed"] });
      toast({
        title: "Success",
        description: "Course title updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateChapterTitleMutation = useMutation({
    mutationFn: ({ chapterId, newTitle }: { chapterId: number; newTitle: string }) =>
      apiRequest("PATCH", `/api/chapters/${chapterId}`, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/chapters`] });
      toast({
        title: "Success",
        description: "Chapter title updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLessonTitleMutation = useMutation({
    mutationFn: ({ lessonId, newTitle }: { lessonId: number; newTitle: string }) =>
      apiRequest("PATCH", `/api/lessons/${lessonId}`, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/lessons`] });
      toast({
        title: "Success",
        description: "Lesson title updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reorderChaptersMutation = useMutation({
    mutationFn: (orderedChapters: any[]) =>
      apiRequest("PUT", `/api/courses/${course.id}/chapters/reorder`, { chapters: orderedChapters }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/chapters`] });
      toast({
        title: "Success",
        description: "Chapter order updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reorderLessonsMutation = useMutation({
    mutationFn: ({ chapterId, orderedLessons }: { chapterId: number; orderedLessons: any[] }) =>
      apiRequest("PUT", `/api/chapters/${chapterId}/lessons/reorder`, { lessons: orderedLessons }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/lessons`] });
      toast({
        title: "Success",
        description: "Lesson order updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleEditLesson = (lessonId: number, currentContent: string) => {
    setEditingLesson(lessonId);
    setEditContent(currentContent || '');
  };

  const handleSaveLesson = (lessonId: number) => {
    updateLessonMutation.mutate({ lessonId, content: editContent });
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
    setEditContent('');
  };

  // Title update handlers
  const handleUpdateCourseTitle = async (newTitle: string) => {
    await updateCourseTitleMutation.mutateAsync(newTitle);
  };

  const handleUpdateChapterTitle = async (chapterId: number, newTitle: string) => {
    await updateChapterTitleMutation.mutateAsync({ chapterId, newTitle });
  };

  const handleUpdateLessonTitle = async (lessonId: number, newTitle: string) => {
    await updateLessonTitleMutation.mutateAsync({ lessonId, newTitle });
  };

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const getLessonsForChapter = (chapterId: number) => {
    return lessons.filter((lesson: any) => lesson.chapter_id === chapterId || lesson.chapterId === chapterId)
      .sort((a: any, b: any) => (a.order_index || a.orderIndex) - (b.order_index || b.orderIndex));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sleep":
        return "bg-blue-100 text-blue-800";
      case "nutrition":
        return "bg-green-100 text-green-800";
      case "health":
        return "bg-red-100 text-red-800";
      case "freebies":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleChapterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = chapters.findIndex((c: any) => c.id === active.id);
    const overIndex = chapters.findIndex((c: any) => c.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newChapters = arrayMove(chapters, activeIndex, overIndex);
      const orderedChapters = newChapters.map((chapter: any, index: number) => ({
        id: chapter.id,
        orderIndex: index + 1,
      }));
      reorderChaptersMutation.mutate(orderedChapters);
    }
  };

  const handleLessonDragEnd = (event: DragEndEvent, chapterId: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const chapterLessons = getLessonsForChapter(chapterId);
    const activeIndex = chapterLessons.findIndex((l: any) => l.id === active.id);
    const overIndex = chapterLessons.findIndex((l: any) => l.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newLessons = arrayMove(chapterLessons, activeIndex, overIndex);
      const orderedLessons = newLessons.map((lesson: any, index: number) => ({
        id: lesson.id,
        orderIndex: index + 1,
      }));
      reorderLessonsMutation.mutate({ chapterId, orderedLessons });
    }
  };

  if (chaptersLoading || lessonsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <InlineEditTitle
                title={course.title}
                onSave={handleUpdateCourseTitle}
                className="text-base sm:text-lg font-bold"
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                <Badge className={`${getCategoryColor(course.category)} text-xs w-fit`}>
                  {course.category}
                </Badge>
                <span className="text-sm text-gray-500">
                  {chapters.length} chapters • {lessons.length} lessons
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              ${typeof course.price === 'number' ? course.price.toFixed(2) : course.price}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreviewCourse(course)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Add course editing functionality
                toast({
                  title: "Coming Soon",
                  description: "Course editing functionality will be added soon",
                });
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChapterDragEnd}
        >
          <SortableContext
            items={chapters.map((c: any) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter: any) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                isExpanded={expandedChapters[chapter.id]}
                onToggle={() => toggleChapter(chapter.id)}
                onUpdateTitle={(newTitle) => handleUpdateChapterTitle(chapter.id, newTitle)}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleLessonDragEnd(event, chapter.id)}
                >
                  <SortableContext
                    items={getLessonsForChapter(chapter.id).map((l: any) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getLessonsForChapter(chapter.id).map((lesson: any) => (
                      <SortableLesson
                        key={lesson.id}
                        lesson={lesson}
                        isExpanded={expandedLessons[lesson.id]}
                        onToggle={() => toggleLesson(lesson.id)}
                        onUpdateTitle={(newTitle) => handleUpdateLessonTitle(lesson.id, newTitle)}
                        onEditContent={() => handleEditLesson(lesson.id, lesson.content || '')}
                        isEditing={editingLesson === lesson.id}
                        editContent={editContent}
                        onContentChange={setEditContent}
                        onSave={() => handleSaveLesson(lesson.id)}
                        onCancel={handleCancelEdit}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </SortableChapter>
            ))}
          </SortableContext>
        </DndContext>
        
        {chapters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Book className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No chapters in this course yet</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add Chapter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// CoursePreview component to show course as a user would see it
function CoursePreview({ course }: { course: Course }) {
  const { data: chapters = [] } = useQuery({
    queryKey: [`/api/courses/${course.id}/chapters`],
    enabled: !!course.id,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: [`/api/courses/${course.id}/lessons`],
    enabled: !!course.id,
  });

  const getLessonsForChapter = (chapterId: number) => {
    return lessons.filter((lesson: any) => lesson.chapter_id === chapterId || lesson.chapterId === chapterId)
      .sort((a: any, b: any) => (a.order_index || a.orderIndex) - (b.order_index || b.orderIndex));
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {course.thumbnailUrl && (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-teal-600">${course.price}</span>
              <Badge className="bg-teal-100 text-teal-800">
                {course.category}
              </Badge>
              <span className="text-sm text-gray-500">
                {chapters.length} chapters • {lessons.length} lessons
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
        <div className="space-y-3">
          {chapters.map((chapter: any, index: number) => (
            <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-teal-600">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                  <p className="text-sm text-gray-500">
                    {getLessonsForChapter(chapter.id).length} lessons
                  </p>
                </div>
              </div>
              <div className="ml-11 space-y-2">
                {getLessonsForChapter(chapter.id).map((lesson: any, lessonIndex: number) => (
                  <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>{lessonIndex + 1}. {lesson.title}</span>
                    {lesson.videoUrl && (
                      <Badge variant="outline" className="ml-2">
                        <Play className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
          Access Course
        </Button>
        <Button variant="outline" className="flex-1">
          Add to Wishlist
        </Button>
      </div>
    </div>
  );
}