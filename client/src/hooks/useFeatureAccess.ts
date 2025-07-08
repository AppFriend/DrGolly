import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useFeatureAccess() {
  const { isAuthenticated } = useAuth();

  const { data: featureAccess = {}, isLoading } = useQuery({
    queryKey: ["/api/user/feature-access"],
    enabled: isAuthenticated,
  });

  const hasAccess = (featureName: string): boolean => {
    return featureAccess[featureName] || false;
  };

  const checkAccess = (featureName: string) => {
    return {
      hasAccess: hasAccess(featureName),
      isLoading,
    };
  };

  return {
    featureAccess,
    hasAccess,
    checkAccess,
    isLoading,
  };
}

export function useFeatureFlag(featureName: string) {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/user/feature-access", featureName],
    enabled: isAuthenticated && !!featureName,
  });

  return {
    hasAccess: data?.hasAccess || false,
    isLoading,
  };
}