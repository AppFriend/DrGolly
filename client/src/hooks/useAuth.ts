import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 0, // Always fetch fresh data
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
