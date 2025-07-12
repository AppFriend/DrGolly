import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Eye, Heart, Calendar, Tag, Trash2 } from "lucide-react";

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
  const { toast } = useToast();

  // Direct fetch approach
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("=== FETCHING BLOG POSTS ===");
        
        const response = await apiRequest('GET', '/api/blog-posts?includeUnpublished=true');
        const data = await response.json();
        
        console.log("Fetched data:", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data length:", data?.length);
        
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

    fetchBlogPosts();
  }, []);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
          <p className="text-muted-foreground">
            Create and manage blog posts for the home page
          </p>
        </div>
        <Button className="bg-[#6B9CA3] hover:bg-[#095D66]">
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
                      </div>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.publishedAt 
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : "Not published"
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes} likes
                        </div>
                        {post.author && (
                          <div className="flex items-center gap-1">
                            <span>by {post.author}</span>
                          </div>
                        )}
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <div>Loading: {isLoading ? "true" : "false"}</div>
            <div>Error: {error || "none"}</div>
            <div>Posts count: {blogPosts.length}</div>
            <div>Posts type: {typeof blogPosts}</div>
            <div>Is array: {Array.isArray(blogPosts) ? "true" : "false"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}