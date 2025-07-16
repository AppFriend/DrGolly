import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 2, // Retry twice on failure
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 1000 * 60 * 5, // 5 minutes
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Handle authentication errors
  if (error && error.message.includes('401')) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
