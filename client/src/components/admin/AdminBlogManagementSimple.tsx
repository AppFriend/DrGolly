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
                        <Button variant="outline" size="sm" className="text-xs">
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


    </div>
  );
}