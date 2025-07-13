import { useState, useEffect, useCallback, useRef } from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  FileText,
  Calendar,
  Eye,
  Heart,
  Pin,
  PinOff,
  Upload,
  X,
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  category: string;
  excerpt: string;
  imageUrl?: string;
  pdfUrl?: string;
  author: string;
  readTime: number;
  isPublished: boolean;
  slug: string;
  views: number;
  likes: number;
  isPinned: boolean;
  pinnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Image Upload Button Component
interface ImageUploadButtonProps {
  onImageUploaded: (imageUrl: string) => void;
}

function ImageUploadButton({ onImageUploaded }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('ImageUploadButton rendered');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.imageUrl) {
        onImageUploaded(response.imageUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border-2 border-brand-teal bg-brand-teal text-white hover:bg-brand-teal/90 hover:border-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Image
          </>
        )}
      </button>
    </div>
  );
}

export default function AdminBlogManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
  }, [queryClient]);

  // Fetch blog posts with authentication header
  const { data: blogPosts, isLoading, error } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: async () => {
      const response = await apiRequest("/api/blog-posts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
  });

  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: Partial<BlogPost>) => {
      return await apiRequest("/api/blog-posts", {
        method: "POST",
        body: JSON.stringify(postData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      setIsCreateDialogOpen(false);
      invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (postData: Partial<BlogPost>) => {
      return await apiRequest(`/api/blog-posts/${selectedPost!.id}`, {
        method: "PUT",
        body: JSON.stringify(postData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedPost(null);
      invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete blog post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/blog-posts/${postId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Pin/Unpin blog post mutation
  const pinPostMutation = useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: number; isPinned: boolean }) => {
      return await apiRequest(`/api/blog-posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ isPinned }),
      });
    },
    onSuccess: (_, { isPinned }) => {
      toast({
        title: "Success",
        description: `Blog post ${isPinned ? 'pinned' : 'unpinned'} successfully`,
      });
      invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = (postData: Partial<BlogPost>) => {
    createPostMutation.mutate(postData);
  };

  const handleUpdatePost = (postData: Partial<BlogPost>) => {
    updatePostMutation.mutate(postData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "general":
        return "bg-blue-100 text-blue-800";
      case "pregnancy":
        return "bg-pink-100 text-pink-800";
      case "baby":
        return "bg-green-100 text-green-800";
      case "freebies":
        return "bg-purple-100 text-purple-800";
      case "toddler":
        return "bg-orange-100 text-orange-800";
      case "nutrition":
        return "bg-yellow-100 text-yellow-800";
      case "health":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
          <p className="text-muted-foreground">
            Create and manage blog posts for the home page
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#6B9CA3] hover:bg-[#095D66]">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
            </DialogHeader>
            <BlogPostForm
              onSubmit={handleCreatePost}
              isLoading={createPostMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Blog Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Posts ({blogPosts?.length || 0})
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
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <p>Error loading blog posts: {error.message}</p>
                <p className="text-sm text-gray-500 mt-2">Check console for more details</p>
              </div>
            </div>
          ) : !Array.isArray(blogPosts) ? (
            <div className="text-center py-8 text-gray-500">
              <div className="font-semibold">Invalid blog posts data</div>
              <div className="text-sm mt-2">Expected array, got: {typeof blogPosts}</div>
              <div className="text-xs mt-2">Check console for debugging info</div>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="font-semibold">No blog posts found</div>
              <div className="text-sm mt-2">Empty array returned from API</div>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post: BlogPost) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    {post.imageUrl && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                        {!post.isPublished && (
                          <Badge variant="outline" className="text-gray-600">
                            Draft
                          </Badge>
                        )}
                        {post.isPublished && (
                          <Badge variant="outline" className="text-green-600">
                            Published
                          </Badge>
                        )}
                        {post.isPinned && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {post.excerpt || post.content.substring(0, 150) + "..."}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="text-gray-700">
                          By {post.author || 'Daniel Golshevsky'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes} likes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        pinPostMutation.mutate({ postId: post.id, isPinned: !post.isPinned });
                      }}
                      className={post.isPinned ? "text-yellow-600 hover:text-yellow-700" : "text-gray-600 hover:text-gray-700"}
                    >
                      {post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Blog Post</DialogTitle>
                        </DialogHeader>
                        {selectedPost && (
                          <BlogPostForm
                            post={selectedPost}
                            onSubmit={handleUpdatePost}
                            isLoading={updatePostMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this blog post?")) {
                          deletePostMutation.mutate(post.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BlogPostFormProps {
  post?: BlogPost;
  onSubmit: (data: Partial<BlogPost>) => void;
  isLoading: boolean;
}

function BlogPostForm({ post, onSubmit, isLoading }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    category: post?.category || "general",
    excerpt: post?.excerpt || "",
    imageUrl: post?.imageUrl || "",
    pdfUrl: post?.pdfUrl || "",
    author: post?.author || "Daniel Golshevsky",
    readTime: post?.readTime || 5,
    isDraft: !post?.isPublished,
    isPinned: post?.isPinned || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate slug from title
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    onSubmit({ 
      ...formData, 
      slug,
      isPublished: !formData.isDraft,
      isPinned: formData.isPinned
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter blog post title"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="pregnancy">Pregnancy</SelectItem>
            <SelectItem value="baby">Baby</SelectItem>
            <SelectItem value="freebies">Freebies</SelectItem>
            <SelectItem value="toddler">Toddler</SelectItem>
            <SelectItem value="nutrition">Nutrition</SelectItem>
            <SelectItem value="health">Health</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="Author name"
        />
      </div>

      <div>
        <Label htmlFor="readTime">Read Time (minutes)</Label>
        <Input
          id="readTime"
          type="number"
          value={formData.readTime}
          onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 5 })}
          placeholder="5"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Featured Image</Label>
        <div className="space-y-2">
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton onImageUploaded={(imageUrl) => setFormData({ ...formData, imageUrl })} />
            <span className="text-sm text-gray-500">Or paste URL above</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="pdfUrl">PDF URL</Label>
        <Input
          id="pdfUrl"
          value={formData.pdfUrl}
          onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
          placeholder="https://example.com/document.pdf"
        />
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief description of the blog post"
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <RichTextEditor
          content={formData.content}
          onChange={(value) => setFormData({ ...formData, content: value })}
          placeholder="Write your blog post content here..."
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isDraft"
            checked={formData.isDraft}
            onCheckedChange={(checked) => setFormData({ ...formData, isDraft: checked })}
          />
          <Label htmlFor="isDraft">Save as draft</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isPinned"
            checked={formData.isPinned}
            onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
          />
          <Label htmlFor="isPinned">Pin to top of home page</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
}