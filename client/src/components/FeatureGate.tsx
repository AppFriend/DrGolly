import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
}

export function FeatureGate({ 
  featureName, 
  children, 
  fallback, 
  showUpgrade = false,
  upgradeMessage = "Upgrade to access this feature"
}: FeatureGateProps) {
  const { hasAccess, isLoading } = useFeatureAccess();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-20 w-full" />
    );
  }

  const userHasAccess = hasAccess(featureName);

  if (userHasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-4">{upgradeMessage}</p>
        <Button 
          variant="default"
          onClick={() => window.location.href = '/subscription'}
          className="bg-[#095D66] hover:bg-[#095D66]/90"
        >
          Upgrade Plan
        </Button>
      </div>
    );
  }

  return null;
}

interface FeatureToggleProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureToggle({ featureName, children, fallback }: FeatureToggleProps) {
  const { hasAccess, isLoading } = useFeatureAccess();

  if (isLoading) {
    return null;
  }

  if (hasAccess(featureName)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}