import { useState } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, CheckCircle, Mail, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { FreebieImage } from "@/components/FreebieImageLoader";
import { PdfViewer } from "@/components/PdfViewer";
import type { BlogPost } from "@shared/schema";
import logoImage from "@assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png";

export default function Share() {
  const [, params] = useRoute("/share/:slug");
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog-posts/slug', params?.slug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/blog-posts/slug/${params?.slug}`);
      return response.json();
    },
    enabled: !!params?.slug
  });

  const captureLead = useMutation({
    mutationFn: async (data: { firstName: string; email: string; freebieId: number }) => {
      const response = await apiRequest('POST', '/api/lead-capture', data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    captureLead.mutate({
      firstName: formData.firstName,
      email: formData.email,
      freebieId: post.id
    });
  };

  const handleDownload = () => {
    if (post?.pdfUrl) {
      setShowPdfViewer(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#095D66] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post || post.category !== "freebies") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Freebie Not Found</h1>
          <p className="text-gray-600">The freebie you're looking for doesn't exist or isn't available for sharing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Dr. Golly" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Download</h1>
          <p className="text-gray-600">Get instant access to this valuable resource</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Freebie Image */}
          <div className="relative">
            {post.imageUrl?.startsWith('@/assets/freebies/') || post.imageUrl?.startsWith('@assets/App Freebies-') ? (
              <FreebieImage
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-64 object-cover"
              />
            ) : (
              <img
                src={post.imageUrl || "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"}
                alt={post.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-4 right-4">
              <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                FREE
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{post.excerpt}</p>

            {isSubmitted ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Thank you, {formData.firstName}!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Your download is ready. We've also sent you a copy via email.
                  </p>
                </div>
                
                <button 
                  onClick={handleDownload}
                  className="w-full bg-[#095D66] hover:bg-[#074A52] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Your PDF</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#095D66] focus:border-transparent"
                      placeholder="Your first name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#095D66] focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={captureLead.isPending}
                  className={cn(
                    "w-full font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors",
                    captureLead.isPending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#095D66] hover:bg-[#074A52] text-white"
                  )}
                >
                  {captureLead.isPending ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Get My Free Download</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Want access to more resources? 
            <a href="/signup" className="text-[#095D66] hover:underline ml-1">
              Sign up for free
            </a>
          </p>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPdfViewer && post.pdfUrl && (
        <PdfViewer
          pdfUrl={post.pdfUrl}
          title={post.title}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  );
}