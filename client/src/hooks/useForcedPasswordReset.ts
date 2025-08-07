import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";

export function useForcedPasswordReset() {
  const [showModal, setShowModal] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkPasswordResetRequired = async () => {
      if (isLoading || !user) return;

      try {
        const response = await apiRequest("GET", "/api/auth/check-password-reset");
        const data = await response.json();
        
        if (data.success && data.requiresPasswordReset) {
          setShowModal(true);
        }
      } catch (error) {
        console.error("Error checking password reset requirement:", error);
      }
    };

    checkPasswordResetRequired();
  }, [user, isLoading]);

  const handlePasswordChanged = () => {
    setShowModal(false);
    // Optionally refresh user data
    window.location.reload();
  };

  return {
    showModal,
    handlePasswordChanged,
    userEmail: (user as any)?.email || ""
  };
}