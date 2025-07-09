import { Eye, Heart, Clock, ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@shared/schema";

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
  className?: string;
}

export function BlogCard({ post, onClick, className }: BlogCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sleep":
        return "bg-dr-teal";
      case "nutrition":
        return "bg-orange-500";
      case "health":
        return "bg-purple-500";
      case "parenting":
        return "bg-green-500";
      case "freebies":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.pdfUrl) {
      // Open PDF in new window for viewing and downloading
      window.open(post.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="relative p-3">
        <img
          src={post.imageUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
          alt={post.title}
          className="w-full h-32 object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => window.location.href = `/blog/${post.slug}`}
            className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-dr-teal" />
          </button>
        </div>
        <span className={cn(
          "absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-medium capitalize",
          getCategoryColor(post.category)
        )}>
          {post.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{formatDate(post.publishedAt)}</span>
          {post.readTime && (
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {post.readTime} min read
            </span>
          )}
        </div>
        {post.category === "freebies" && post.pdfUrl ? (
          <button 
            onClick={handleDownload}
            className="w-full bg-[#095D66] hover:bg-[#074A52] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download Now</span>
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {post.likes || 0}
              </span>
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {post.views || 0}
              </span>
            </div>
            <button 
              onClick={() => window.location.href = `/blog/${post.slug}`}
              className="text-dr-teal font-medium text-sm flex items-center hover:text-dr-teal-dark transition-colors"
            >
              Read More
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}