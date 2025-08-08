import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: true, // Refetch when user returns to window
    refetchInterval: false,
    staleTime: 1000 * 60, // Cache for 1 minute to improve performance
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
