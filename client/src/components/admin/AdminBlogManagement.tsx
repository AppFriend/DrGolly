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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Heart, 
  Save,
  Calendar,
  Tag,
  Trash2
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
  pdfUrl?: string;
  readTime?: number;
  author?: string;
  publishedAt?: string;
  views: number;
  likes: number;
  isPublished: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminBlogManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: () => apiRequest("GET", "/api/blog-posts?includeUnpublished=true"),
  });

  const createPostMutation = useMutation({
    mutationFn: (post: Partial<BlogPost>) =>
      apiRequest("POST", "/api/blog-posts", post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Success",
        description: "Blog post created successfully",
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

  const updatePostMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<BlogPost> }) =>
      apiRequest("PUT", `/api/blog-posts/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/blog-posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
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

  const handleCreatePost = (formData: any) => {
    const postData = {
      ...formData,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      isPublished: !formData.isDraft,
      status: !formData.isDraft ? 'published' : 'draft',
      publishedAt: !formData.isDraft ? new Date().toISOString() : null,
    };
    delete postData.isDraft;
    createPostMutation.mutate(postData);
  };

  const handleUpdatePost = (formData: any) => {
    if (selectedPost) {
      const postData = {
        ...formData,
        slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        isPublished: !formData.isDraft,
        status: !formData.isDraft ? 'published' : 'draft',
        publishedAt: !formData.isDraft ? new Date().toISOString() : selectedPost.publishedAt,
      };
      delete postData.isDraft;
      updatePostMutation.mutate({
        id: selectedPost.id,
        updates: postData,
      });
    }
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
      case "development":
        return "bg-purple-100 text-purple-800";
      case "health":
        return "bg-red-100 text-red-800";
      case "freebies":
        return "bg-pink-100 text-pink-800";
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
          ) : (
            <div className="space-y-4">
              {blogPosts?.map((post: BlogPost) => (
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate slug from title
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    onSubmit({ ...formData, slug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter blog post title..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="sleep">Sleep</SelectItem>
              <SelectItem value="nutrition">Nutrition</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="freebies">Freebies</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Daniel Golshevsky"
            required
          />
        </div>
        <div>
          <Label htmlFor="readTime">Read Time (minutes)</Label>
          <Input
            id="readTime"
            type="number"
            value={formData.readTime}
            onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 5 })}
            min="1"
            max="60"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">Featured Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {formData.category === "freebies" && (
        <div>
          <Label htmlFor="pdfUrl">PDF Download URL</Label>
          <Input
            id="pdfUrl"
            value={formData.pdfUrl}
            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
            placeholder="https://example.com/document.pdf"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload your PDF to a cloud storage service and paste the direct download link here. This will enable the "Download Now" button for freebies posts.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="excerpt">Excerpt (Optional)</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief description of the post..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <RichTextEditor
          value={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
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