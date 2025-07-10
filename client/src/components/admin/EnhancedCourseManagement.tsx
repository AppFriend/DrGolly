import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff,
  Save,
  Calendar,
  Tag,
  Play,
  FileText,
  Book,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  tier: string;
  price: number;
  skillLevel: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  likes: number;
  isPublished: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: number;
  courseId: number;
  title: string;
  description: string;
  chapterNumber: string;
  orderIndex: number;
  isCompleted: boolean;
  createdAt: string;
}

interface Module {
  id: number;
  courseId: number;
  chapterId: number;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  orderIndex: number;
  contentType: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

interface SortableItemProps {
  id: number;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
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
      <div className="flex items-center gap-2">
        <div {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function EnhancedCourseManagement() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'sleep',
    tier: 'free',
    price: 0,
    skillLevel: 'beginner',
    status: 'draft'
  });
  const [newChapter, setNewChapter] = useState({
    title: '',
    description: '',
    chapterNumber: '1'
  });
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    content: '',
    contentType: 'text',
    duration: 0,
    videoUrl: ''
  });
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: () => apiRequest("GET", "/api/courses"),
  });

  // Ensure courses is always an array
  const coursesList = Array.isArray(courses) ? courses : [];

  // Fetch chapters for selected course
  const { data: courseChapters } = useQuery({
    queryKey: ["/api/courses", selectedCourse?.id, "chapters"],
    queryFn: () => apiRequest("GET", `/api/courses/${selectedCourse?.id}/chapters`),
    enabled: !!selectedCourse,
  });

  // Fetch modules for expanded chapters
  const { data: chapterModules } = useQuery({
    queryKey: ["/api/chapters", expandedChapters, "modules"],
    queryFn: async () => {
      const modulesData: Record<number, Module[]> = {};
      for (const chapterId of expandedChapters) {
        const modules = await apiRequest("GET", `/api/chapters/${chapterId}/modules`);
        modulesData[chapterId] = modules;
      }
      return modulesData;
    },
    enabled: expandedChapters.length > 0,
  });

  useEffect(() => {
    if (courseChapters) {
      setChapters(courseChapters);
    }
  }, [courseChapters]);

  useEffect(() => {
    if (chapterModules) {
      const allModules = Object.values(chapterModules).flat();
      setModules(allModules);
    }
  }, [chapterModules]);

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: (course: any) => apiRequest("POST", "/api/courses", course),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course created successfully" });
      setIsCreateDialogOpen(false);
      setNewCourse({ title: '', description: '', category: 'sleep', tier: 'free', price: 0, skillLevel: 'beginner', status: 'draft' });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...course }: any) => apiRequest("PUT", `/api/courses/${id}`, course),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Chapter mutations
  const createChapterMutation = useMutation({
    mutationFn: (chapter: any) => apiRequest("POST", `/api/courses/${selectedCourse?.id}/chapters`, chapter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse?.id, "chapters"] });
      toast({ title: "Success", description: "Chapter created successfully" });
      setNewChapter({ title: '', description: '', chapterNumber: '1' });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateChapterOrderMutation = useMutation({
    mutationFn: ({ chapters }: { chapters: Chapter[] }) => 
      apiRequest("PUT", `/api/courses/${selectedCourse?.id}/chapters/reorder`, { chapters }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse?.id, "chapters"] });
      toast({ title: "Success", description: "Chapter order updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: ({ chapterId, module }: { chapterId: number; module: any }) => 
      apiRequest("POST", `/api/chapters/${chapterId}/modules`, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", expandedChapters, "modules"] });
      toast({ title: "Success", description: "Module created successfully" });
      setNewModule({ title: '', description: '', content: '', contentType: 'text', duration: 0, videoUrl: '' });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, ...module }: any) => apiRequest("PUT", `/api/modules/${id}`, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", expandedChapters, "modules"] });
      toast({ title: "Success", description: "Module updated successfully" });
      setEditingModule(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateModuleOrderMutation = useMutation({
    mutationFn: ({ chapterId, modules }: { chapterId: number; modules: Module[] }) => 
      apiRequest("PUT", `/api/chapters/${chapterId}/modules/reorder`, { modules }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", expandedChapters, "modules"] });
      toast({ title: "Success", description: "Module order updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Drag and drop handlers
  const handleChapterDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = chapters.findIndex(chapter => chapter.id === active.id);
      const newIndex = chapters.findIndex(chapter => chapter.id === over.id);
      
      const newChapters = arrayMove(chapters, oldIndex, newIndex).map((chapter, index) => ({
        ...chapter,
        orderIndex: index
      }));
      
      setChapters(newChapters);
      updateChapterOrderMutation.mutate({ chapters: newChapters });
    }
  };

  const handleModuleDragEnd = (event: any, chapterId: number) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const chapterModules = chapterModules?.[chapterId] || [];
      const oldIndex = chapterModules.findIndex(module => module.id === active.id);
      const newIndex = chapterModules.findIndex(module => module.id === over.id);
      
      const newModules = arrayMove(chapterModules, oldIndex, newIndex).map((module, index) => ({
        ...module,
        orderIndex: index
      }));
      
      updateModuleOrderMutation.mutate({ chapterId, modules: newModules });
    }
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const publishCourse = (courseId: number) => {
    updateCourseMutation.mutate({ id: courseId, isPublished: true, status: 'published' });
  };

  const unpublishCourse = (courseId: number) => {
    updateCourseMutation.mutate({ id: courseId, isPublished: false, status: 'draft' });
  };

  const getStatusBadge = (course: Course) => {
    if (course.isPublished && course.status === 'published') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Live</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Create and manage courses with chapters and modules</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#095D66] hover:bg-[#074A52]">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter course description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newCourse.category} onValueChange={(value) => setNewCourse(prev => ({ ...prev, category: value }))}>
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
                  <Select value={newCourse.tier} onValueChange={(value) => setNewCourse(prev => ({ ...prev, tier: value }))}>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select value={newCourse.skillLevel} onValueChange={(value) => setNewCourse(prev => ({ ...prev, skillLevel: value }))}>
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createCourseMutation.mutate(newCourse)}>
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coursesList.map((course: Course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                </div>
                {getStatusBadge(course)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Book className="w-4 h-4" />
                <span>{course.category}</span>
                <Tag className="w-4 h-4 ml-2" />
                <span>{course.tier}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign className="w-4 h-4" />
                <span>${course.price}</span>
                <Users className="w-4 h-4 ml-2" />
                <span>{course.views} views</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourse(course)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {course.isPublished ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unpublishCourse(course.id)}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishCourse(course.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Details */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              {selectedCourse.title}
              {getStatusBadge(selectedCourse)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chapters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chapters">Chapters & Modules</TabsTrigger>
                <TabsTrigger value="settings">Course Settings</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-4">
                {/* Add Chapter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Chapter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="chapterTitle">Chapter Title</Label>
                        <Input
                          id="chapterTitle"
                          value={newChapter.title}
                          onChange={(e) => setNewChapter(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter chapter title..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="chapterNumber">Chapter Number</Label>
                        <Input
                          id="chapterNumber"
                          value={newChapter.chapterNumber}
                          onChange={(e) => setNewChapter(prev => ({ ...prev, chapterNumber: e.target.value }))}
                          placeholder="e.g., 1, 1.1, 1.2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="chapterDescription">Description</Label>
                      <Textarea
                        id="chapterDescription"
                        value={newChapter.description}
                        onChange={(e) => setNewChapter(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter chapter description..."
                        rows={2}
                      />
                    </div>
                    <Button onClick={() => createChapterMutation.mutate(newChapter)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Chapter
                    </Button>
                  </CardContent>
                </Card>

                {/* Chapters List */}
                <div className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleChapterDragEnd}
                  >
                    <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      {chapters.map((chapter) => (
                        <SortableItem key={chapter.id} id={chapter.id}>
                          <Card className="flex-1">
                            <Collapsible
                              open={expandedChapters.includes(chapter.id)}
                              onOpenChange={() => toggleChapter(chapter.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline">{chapter.chapterNumber}</Badge>
                                      <div>
                                        <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                        <p className="text-sm text-gray-600">{chapter.description}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">
                                        {chapterModules?.[chapter.id]?.length || 0} modules
                                      </span>
                                      {expandedChapters.includes(chapter.id) ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  {/* Add Module */}
                                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium mb-3">Add New Module</h4>
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label htmlFor="moduleTitle">Module Title</Label>
                                          <Input
                                            id="moduleTitle"
                                            value={newModule.title}
                                            onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Enter module title..."
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="moduleType">Content Type</Label>
                                          <Select value={newModule.contentType} onValueChange={(value) => setNewModule(prev => ({ ...prev, contentType: value }))}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="text">Text</SelectItem>
                                              <SelectItem value="video">Video</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor="moduleDescription">Description</Label>
                                        <Textarea
                                          id="moduleDescription"
                                          value={newModule.description}
                                          onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                                          placeholder="Enter module description..."
                                          rows={2}
                                        />
                                      </div>
                                      {newModule.contentType === 'video' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <Label htmlFor="videoUrl">Video URL</Label>
                                            <Input
                                              id="videoUrl"
                                              value={newModule.videoUrl}
                                              onChange={(e) => setNewModule(prev => ({ ...prev, videoUrl: e.target.value }))}
                                              placeholder="Enter video URL..."
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="duration">Duration (minutes)</Label>
                                            <Input
                                              id="duration"
                                              type="number"
                                              value={newModule.duration}
                                              onChange={(e) => setNewModule(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <Label htmlFor="moduleContent">Content</Label>
                                        <RichTextEditor
                                          content={newModule.content}
                                          onChange={(content) => setNewModule(prev => ({ ...prev, content }))}
                                          placeholder="Enter module content..."
                                          className="mt-2"
                                        />
                                      </div>
                                      <Button onClick={() => createModuleMutation.mutate({ chapterId: chapter.id, module: newModule })}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Module
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Modules List */}
                                  <div className="space-y-2">
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={(event) => handleModuleDragEnd(event, chapter.id)}
                                    >
                                      <SortableContext items={chapterModules?.[chapter.id]?.map(m => m.id) || []} strategy={verticalListSortingStrategy}>
                                        {chapterModules?.[chapter.id]?.map((module) => (
                                          <SortableItem key={module.id} id={module.id}>
                                            <Card className="flex-1">
                                              <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                    {module.contentType === 'video' ? (
                                                      <Play className="w-4 h-4 text-blue-500" />
                                                    ) : (
                                                      <FileText className="w-4 h-4 text-gray-500" />
                                                    )}
                                                    <div>
                                                      <CardTitle className="text-md">{module.title}</CardTitle>
                                                      <p className="text-sm text-gray-600">{module.description}</p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    {module.contentType === 'video' && (
                                                      <Badge variant="outline" className="text-xs">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {module.duration}min
                                                      </Badge>
                                                    )}
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setEditingModule(module)}
                                                    >
                                                      <Edit className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </CardHeader>
                                              {module.content && (
                                                <CardContent className="pt-0">
                                                  <div 
                                                    className="prose prose-sm max-w-none text-gray-700"
                                                    dangerouslySetInnerHTML={{ __html: module.content }}
                                                  />
                                                </CardContent>
                                              )}
                                            </Card>
                                          </SortableItem>
                                        ))}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Course settings panel coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Analytics panel coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Edit Module Dialog */}
      {editingModule && (
        <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Module: {editingModule.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editTitle">Title</Label>
                  <Input
                    id="editTitle"
                    value={editingModule.title}
                    onChange={(e) => setEditingModule(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editType">Content Type</Label>
                  <Select value={editingModule.contentType} onValueChange={(value) => setEditingModule(prev => prev ? { ...prev, contentType: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingModule.description}
                  onChange={(e) => setEditingModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={2}
                />
              </div>
              {editingModule.contentType === 'video' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editVideoUrl">Video URL</Label>
                    <Input
                      id="editVideoUrl"
                      value={editingModule.videoUrl || ''}
                      onChange={(e) => setEditingModule(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDuration">Duration (minutes)</Label>
                    <Input
                      id="editDuration"
                      type="number"
                      value={editingModule.duration}
                      onChange={(e) => setEditingModule(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="editContent">Content</Label>
                <RichTextEditor
                  content={editingModule.content || ''}
                  onChange={(content) => setEditingModule(prev => prev ? { ...prev, content } : null)}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingModule(null)}>
                  Cancel
                </Button>
                <Button onClick={() => updateModuleMutation.mutate(editingModule)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}