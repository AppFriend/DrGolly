import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Clock, Heart, Eye, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost } from "@shared/schema";

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const slug = params?.slug;

  // Fetch blog post
  const { data: post, isLoading } = useQuery({
    queryKey: ["/api/blog-posts/slug", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog-posts/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Blog post not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Track view
  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/blog-posts/${postId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/slug", slug] });
    },
  });

  // Like post
  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/blog-posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/slug", slug] });
      toast({
        title: "Thanks for liking this post!",
        description: "Your feedback helps us create better content.",
      });
    },
  });

  // Track view on mount
  React.useEffect(() => {
    if (post && !viewMutation.isSuccess && !viewMutation.isPending) {
      viewMutation.mutate(post.id);
    }
  }, [post]);

  const handleBack = () => {
    setLocation("/");
  };

  const handleLike = () => {
    if (post && !likeMutation.isPending) {
      likeMutation.mutate(post.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: window.location.href,
        });
      } catch (error) {
        // Share failed or was cancelled
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The blog post link has been copied to your clipboard.",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sleep':
        return 'bg-blue-100 text-blue-800';
      case 'nutrition':
        return 'bg-green-100 text-green-800';
      case 'health':
        return 'bg-red-100 text-red-800';
      case 'parenting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={handleBack} className="flex items-center">
          <ArrowLeft className="h-6 w-6 mr-2" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="flex items-center space-x-1 px-3 py-1 rounded-full border hover:bg-gray-50"
          >
            <Heart className={`h-4 w-4 ${likeMutation.isSuccess ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm">{post.likes || 0}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 px-3 py-1 rounded-full border hover:bg-gray-50"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-64 sm:h-80 object-cover rounded-lg mb-6"
          />
        )}

        {/* Category Badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${getCategoryColor(post.category)}`}>
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </span>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{post.readTime} min read</span>
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            <span>{post.views || 0} views</span>
          </div>
          <span>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-base text-gray-600 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="max-w-none">
          <div className="space-y-6">
            {post.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
              } else if (paragraph.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-medium text-gray-900 mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
              } else if (paragraph.startsWith('#### ')) {
                return <h4 key={index} className="text-base font-medium text-gray-900 mt-4 mb-2">{paragraph.replace('#### ', '')}</h4>;
              } else if (paragraph.startsWith('- ')) {
                const listItems = paragraph.split('\n').filter(line => line.startsWith('- '));
                return (
                  <ul key={index} className="list-disc pl-6 space-y-2 mb-4">
                    {listItems.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-base text-gray-700 leading-relaxed">{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              } else if (paragraph.match(/^\d+\./)) {
                const listItems = paragraph.split('\n').filter(line => line.match(/^\d+\./));
                return (
                  <ol key={index} className="list-decimal pl-6 space-y-2 mb-4">
                    {listItems.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-base text-gray-700 leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                  </ol>
                );
              } else if (paragraph.trim()) {
                return <p key={index} className="text-base text-gray-700 leading-relaxed mb-4">{paragraph}</p>;
              }
              return null;
            })}
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 p-6 bg-dr-teal-light rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Want more expert guidance?
          </h3>
          <p className="text-gray-700 mb-4">
            Explore our comprehensive courses designed by Dr. Golly to help you navigate parenting with confidence.
          </p>
          <Button
            onClick={() => setLocation("/courses")}
            className="bg-dr-teal hover:bg-dr-teal-dark text-white"
          >
            Browse Courses
          </Button>
        </div>
      </div>
    </div>
  );
}