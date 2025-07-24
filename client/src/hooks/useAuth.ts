import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth() {
  const [showPasswordSetupBanner, setShowPasswordSetupBanner] = useState(false);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 0, // Always fetch fresh data
  });

  // Check if user needs to set up password (from login response)
  useEffect(() => {
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        const response = JSON.parse(loginResponse);
        if (response.showPasswordSetupBanner) {
          setShowPasswordSetupBanner(true);
        }
      } catch (e) {
        console.log('Error parsing login response:', e);
      }
    }
  }, [user]);

  const dismissPasswordSetupBanner = () => {
    setShowPasswordSetupBanner(false);
    sessionStorage.removeItem('loginResponse');
  };

  const completePasswordSetup = () => {
    setShowPasswordSetupBanner(false);
    sessionStorage.removeItem('loginResponse');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    showPasswordSetupBanner,
    dismissPasswordSetupBanner,
    completePasswordSetup,
  };
}
