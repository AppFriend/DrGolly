import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Eye, Heart, Calendar, Tag, Trash2, Save, X } from "lucide-react";

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

export function AdminBlogManagementSimple() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Direct fetch approach
  const fetchBlogPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest('GET', '/api/blog-posts?includeUnpublished=true');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setBlogPosts(data);
      } else {
        setError("Invalid data format received");
      }
    } catch (err) {
      console.error("Error fetching blog posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch blog posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (updatedPost: BlogPost) => {
      const response = await apiRequest('PUT', `/api/blog-posts/${updatedPost.id}`, updatedPost);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingPost(null);
      // Refresh the local state
      fetchBlogPosts();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = () => {
    if (editingPost) {
      updatePostMutation.mutate(editingPost);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
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
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Blog Management</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create and manage blog posts for the home page
          </p>
        </div>
        <Button className="bg-[#6B9CA3] hover:bg-[#095D66] w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Blog Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Posts ({blogPosts.length})
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
                <p>Error loading blog posts: {error}</p>
                <p className="text-sm text-gray-500 mt-2">Check console for more details</p>
              </div>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="font-semibold">No blog posts found</div>
              <div className="text-sm mt-2">No posts returned from API</div>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg hover:bg-gray-50 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Mobile-first layout */}
                    <div className="space-y-3">
                      {/* Header with image, title, and badges */}
                      <div className="flex items-start gap-3">
                        {post.imageUrl && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg leading-tight">{post.title}</h3>
                            <div className="flex flex-wrap gap-1">
                              <Badge className={getCategoryColor(post.category)} style={{ fontSize: '0.75rem' }}>
                                {post.category}
                              </Badge>
                              {!post.isPublished && (
                                <Badge variant="outline" className="text-gray-600 text-xs">
                                  Draft
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {post.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Stats - Mobile responsive */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">
                            {post.publishedAt 
                              ? new Date(post.publishedAt).toLocaleDateString()
                              : "Not published"
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.likes}</span>
                        </div>
                        {post.author && (
                          <div className="flex items-center gap-1">
                            <span className="truncate">by {post.author}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-start gap-1">
                          <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 text-xs">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Blog Post Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Enter blog post title"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={editingPost.category} 
                  onValueChange={(value) => setEditingPost(prev => prev ? {...prev, category: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="freebies">Freebies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={editingPost.author || ''}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, author: e.target.value} : null)}
                  placeholder="Enter author name"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={editingPost.tags?.join(', ') || ''}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)} : null)}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, excerpt: e.target.value} : null)}
                  placeholder="Enter a brief excerpt"
                  rows={3}
                />
              </div>

              {/* Content - Rich Text Editor */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  content={editingPost.content}
                  onChange={(content) => setEditingPost(prev => prev ? {...prev, content} : null)}
                  placeholder="Start writing your blog post content..."
                />
                <p className="text-sm text-gray-500">
                  Use the toolbar above to format your content. Changes will be saved exactly as they appear and will immediately be visible to users on the /home page.
                </p>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <Label>Content Preview</Label>
                <div className="border rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <div 
                    className="prose-content" 
                    dangerouslySetInnerHTML={{ __html: editingPost.content || '<p class="text-gray-500">Content preview will appear here...</p>' }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  This is how your content will appear to users on the /home page.
                </p>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={editingPost.imageUrl || ''}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, imageUrl: e.target.value} : null)}
                  placeholder="Enter image URL"
                />
              </div>

              {/* PDF URL */}
              <div className="space-y-2">
                <Label htmlFor="pdfUrl">PDF URL</Label>
                <Input
                  id="pdfUrl"
                  value={editingPost.pdfUrl || ''}
                  onChange={(e) => setEditingPost(prev => prev ? {...prev, pdfUrl: e.target.value} : null)}
                  placeholder="Enter PDF URL"
                />
              </div>

              {/* Published Status */}
              <div className="space-y-2">
                <Label htmlFor="isPublished">Publication Status</Label>
                <Select 
                  value={editingPost.isPublished ? 'published' : 'draft'} 
                  onValueChange={(value) => setEditingPost(prev => prev ? {...prev, isPublished: value === 'published'} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updatePostMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePost}
                  disabled={updatePostMutation.isPending}
                  className="bg-[#6B9CA3] hover:bg-[#095D66]"
                >
                  {updatePostMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}