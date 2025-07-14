import { cn } from "@/lib/utils";
import babyLoaderGif from "@assets/Light Green Baby 01 (2)_1752452180911.gif";

interface LoadingAnimationProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  message?: string;
  subMessage?: string;
  overlay?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20"
};

export function LoadingAnimation({ 
  size = "md", 
  className, 
  message, 
  subMessage, 
  overlay = false 
}: LoadingAnimationProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <img
        src={babyLoaderGif}
        alt="Loading..."
        className={cn(sizeClasses[size], "object-contain mb-2")}
      />
      {message && (
        <p className="text-sm font-medium text-gray-700 text-center">{message}</p>
      )}
      {subMessage && (
        <p className="text-xs text-gray-500 text-center mt-1">{subMessage}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// Fallback for backwards compatibility with existing animate-spin usage
export function LoadingSpinner({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img
        src={babyLoaderGif}
        alt="Loading..."
        className={cn(sizeClasses[size], "object-contain")}
      />
    </div>
  );
}