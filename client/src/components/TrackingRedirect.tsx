import { useEffect } from 'react';
import { useParams, useSearch } from 'wouter';

export function TrackingRedirect() {
  const params = useParams();
  const search = useSearch();
  
  useEffect(() => {
    // Get the slug from the URL params
    const slug = params.slug;
    const trackingParams = new URLSearchParams(search);
    const trackid = trackingParams.get('trackid');
    
    if (slug) {
      // Construct the backend tracking URL
      let redirectUrl = `/t/of/blog/${slug}`;
      if (trackid) {
        redirectUrl += `?trackid=${trackid}`;
      }
      
      // Redirect to the backend tracking endpoint
      // This will update the click count and then redirect to the blog post
      window.location.href = redirectUrl;
    } else {
      // Fallback to home if no slug is provided
      window.location.href = '/';
    }
  }, [params.slug, search]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}