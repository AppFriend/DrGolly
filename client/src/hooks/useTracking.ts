import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface PurchaseData {
  value?: number;
  currency?: string;
  transactionId?: string;
  eventId?: string;
  [key: string]: any;
}
import { 
  initAllTracking, 
  trackPageView, 
  trackSignUp, 
  trackPurchase 
} from '@/utils/tracking.js';

/**
 * Custom hook for tracking initialization and page view tracking
 */
export const useTracking = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Initialize all tracking pixels once
  useEffect(() => {
    const userEmail = user?.email || '';
    initAllTracking(userEmail);
  }, [user]);

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return {
    trackSignUp,
    trackPurchase,
    trackPageView
  };
};

/**
 * Hook specifically for tracking user events
 */
export const useEventTracking = () => {
  const handleSignUpTracking = (additionalData: any = {}) => {
    trackSignUp({
      eventId: `signup_${Date.now()}`,
      ...additionalData
    });
  };

  const handlePurchaseTracking = (purchaseData: PurchaseData) => {
    trackPurchase({
      eventId: `purchase_${Date.now()}`,
      ...purchaseData
    });
  };

  return {
    trackSignUp: handleSignUpTracking,
    trackPurchase: handlePurchaseTracking
  };
};