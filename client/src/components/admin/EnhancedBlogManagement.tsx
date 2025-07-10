import { useState } from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getFreebieAssetOptions } from "@/components/FreebieImageLoader";
import { PDF_ASSETS } from "@/components/PdfViewer";
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff,
  Save,
  Calendar,
  Tag,
  Users,
  Heart,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  pdfUrl?: string;
  readTime: number;
  publishedAt?: string;
  views: number;
  likes: number;
  isPublished: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function EnhancedBlogManagement() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'sleep',
    tags: [] as string[],
    imageUrl: '',
    pdfUrl: '',
    readTime: 5,
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blog posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: () => apiRequest("GET", "/api/blog-posts"),
  });

  // Ensure posts is always an array
  const blogPosts = Array.isArray(posts) ? posts : [];

  // Blog post mutations
  const createPostMutation = useMutation({
    mutationFn: (post: any) => apiRequest("POST", "/api/blog-posts", post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({ title: "Success", description: "Blog post created successfully" });
      setIsCreateDialogOpen(false);
      resetNewPost();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, ...post }: any) => apiRequest("PUT", `/api/blog-posts/${id}`, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetNewPost = () => {
    setNewPost({
      title: '',
      excerpt: '',
      content: '',
      category: 'sleep',
      tags: [],
      imageUrl: '',
      pdfUrl: '',
      readTime: 5,
      status: 'draft'
    });
    setTagInput('');
  };

  const publishPost = (postId: number) => {
    updatePostMutation.mutate({ 
      id: postId, 
      isPublished: true, 
      status: 'published',
      publishedAt: new Date().toISOString()
    });
  };

  const unpublishPost = (postId: number) => {
    updatePostMutation.mutate({ 
      id: postId, 
      isPublished: false, 
      status: 'draft',
      publishedAt: null
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !newPost.tags.includes(tagInput.trim())) {
      setNewPost(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const getStatusBadge = (post: BlogPost) => {
    if (post.isPublished && post.status === 'published') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Live</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const startEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Create and manage blog posts with rich content</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#095D66] hover:bg-[#074A52]">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Post Title</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title..."
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Enter post excerpt..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newPost.category} onValueChange={(value) => setNewPost(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="parenting">Parenting</SelectItem>
                      <SelectItem value="freebies">Freebies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="readTime">Read Time (minutes)</Label>
                  <Input
                    id="readTime"
                    type="number"
                    value={newPost.readTime}
                    onChange={(e) => setNewPost(prev => ({ ...prev, readTime: parseInt(e.target.value) || 5 }))}
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageUrl">Featured Image URL</Label>
                  {newPost.category === 'freebies' ? (
                    <Select value={newPost.imageUrl} onValueChange={(value) => setNewPost(prev => ({ ...prev, imageUrl: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select freebie image..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFreebieAssetOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="imageUrl"
                      value={newPost.imageUrl}
                      onChange={(e) => setNewPost(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Enter image URL..."
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="pdfUrl">PDF Download URL (for freebies)</Label>
                  {newPost.category === 'freebies' ? (
                    <Select value={newPost.pdfUrl} onValueChange={(value) => setNewPost(prev => ({ ...prev, pdfUrl: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select freebie PDF..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No PDF</SelectItem>
                        {Object.keys(PDF_ASSETS).map((pdfPath) => (
                          <SelectItem key={pdfPath} value={pdfPath}>
                            {pdfPath.split('/').pop()?.replace('.pdf', '') || 'PDF'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="pdfUrl"
                      value={newPost.pdfUrl}
                      onChange={(e) => setNewPost(prev => ({ ...prev, pdfUrl: e.target.value }))}
                      placeholder="Enter PDF URL..."
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag and press Add..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newPost.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  content={newPost.content}
                  onChange={(content) => setNewPost(prev => ({ ...prev, content }))}
                  placeholder="Write your blog post content..."
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createPostMutation.mutate({ 
                    ...newPost, 
                    slug: generateSlug(newPost.title),
                    isPublished: false,
                    status: 'draft'
                  })}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => createPostMutation.mutate({ 
                    ...newPost, 
                    slug: generateSlug(newPost.title),
                    isPublished: true,
                    status: 'published',
                    publishedAt: new Date().toISOString()
                  })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publish Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post: BlogPost) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>
                </div>
                {getStatusBadge(post)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Tag className="w-4 h-4" />
                <span>{post.category}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{post.readTime} min read</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.createdAt)}</span>
                <Eye className="w-4 h-4 ml-2" />
                <span>{post.views} views</span>
                <Heart className="w-4 h-4 ml-2" />
                <span>{post.likes} likes</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              {post.pdfUrl && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Download className="w-4 h-4" />
                  <span>PDF Download Available</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(post)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {post.isPublished ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unpublishPost(post.id)}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishPost(post.id)}
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

      {/* Edit Post Dialog */}
      {selectedPost && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Post Title</Label>
                <Input
                  id="editTitle"
                  value={selectedPost.title}
                  onChange={(e) => setSelectedPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter post title..."
                />
              </div>
              <div>
                <Label htmlFor="editExcerpt">Excerpt</Label>
                <Textarea
                  id="editExcerpt"
                  value={selectedPost.excerpt}
                  onChange={(e) => setSelectedPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                  placeholder="Enter post excerpt..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCategory">Category</Label>
                  <Select value={selectedPost.category} onValueChange={(value) => setSelectedPost(prev => prev ? { ...prev, category: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="parenting">Parenting</SelectItem>
                      <SelectItem value="freebies">Freebies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editReadTime">Read Time (minutes)</Label>
                  <Input
                    id="editReadTime"
                    type="number"
                    value={selectedPost.readTime}
                    onChange={(e) => setSelectedPost(prev => prev ? { ...prev, readTime: parseInt(e.target.value) || 5 } : null)}
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editImageUrl">Featured Image URL</Label>
                  <Input
                    id="editImageUrl"
                    value={selectedPost.imageUrl || ''}
                    onChange={(e) => setSelectedPost(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                    placeholder="Enter image URL..."
                  />
                </div>
                <div>
                  <Label htmlFor="editPdfUrl">PDF Download URL (for freebies)</Label>
                  <Input
                    id="editPdfUrl"
                    value={selectedPost.pdfUrl || ''}
                    onChange={(e) => setSelectedPost(prev => prev ? { ...prev, pdfUrl: e.target.value } : null)}
                    placeholder="Enter PDF URL..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editContent">Content</Label>
                <RichTextEditor
                  content={selectedPost.content}
                  onChange={(content) => setSelectedPost(prev => prev ? { ...prev, content } : null)}
                  placeholder="Write your blog post content..."
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updatePostMutation.mutate({ 
                    ...selectedPost, 
                    slug: generateSlug(selectedPost.title),
                    isPublished: false,
                    status: 'draft'
                  })}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => updatePostMutation.mutate({ 
                    ...selectedPost, 
                    slug: generateSlug(selectedPost.title),
                    isPublished: true,
                    status: 'published',
                    publishedAt: selectedPost.publishedAt || new Date().toISOString()
                  })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {selectedPost.isPublished ? 'Update & Keep Published' : 'Publish Now'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}