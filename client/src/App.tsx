import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useState, useEffect } from "react";
import { validateRoutingConfiguration, getRedirectPath } from "@/utils/authGuards";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Checkout from "@/pages/checkout";
import BigBabyPublic from "@/pages/big-baby-public";
import PaymentSuccess from "@/pages/payment-success";
import BlogPost from "@/pages/blog-post";
import Discounts from "@/pages/discounts";
import Subscription from "@/pages/subscription";
import Track from "@/pages/track";
import Family from "@/pages/family";
import FeatureDemo from "@/pages/feature-demo";
import Manage from "@/pages/manage";
import CheckoutSubscription from "@/pages/checkout-subscription";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import KlaviyoTest from "@/pages/klaviyo-test";

function AuthenticatedApp() {
  const [location] = useLocation();
  const { isOpen, closeUpgradeModal } = useUpgradeModal();
  
  // Determine active tab based on current location
  const getActiveTab = () => {
    if (location.startsWith('/courses')) return 'courses';
    if (location.startsWith('/track')) return 'tracking'; 
    if (location.startsWith('/discounts')) return 'discounts';
    if (location.startsWith('/family')) return 'family';
    if (location.startsWith('/home') || location === '/') return 'home';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTab());

  const showBottomNavigation = location !== "/subscription" && !location.startsWith("/checkout") && location !== "/payment-success";

  const handleUpgrade = (billingPeriod: "monthly" | "yearly") => {
    window.location.href = `/checkout-subscription?period=${billingPeriod}&tier=gold`;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Switch>
        <Route path="/subscription" component={Subscription} />
        <Route path="/checkout/:courseId" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/courses">
          <Courses />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/track">
          <Track />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/discounts">
          <Discounts />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/family">
          <Family />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/checkout" component={Checkout} />
        <Route path="/manage" component={Manage} />
        <Route path="/feature-demo" component={FeatureDemo} />
        <Route path="/checkout-subscription" component={CheckoutSubscription} />
        <Route path="/admin" component={Admin} />
        <Route path="/profile" component={Profile} />
        <Route path="/klaviyo-test" component={KlaviyoTest} />
        <Route path="/big-baby-public" component={BigBabyPublic} />
        <Route path="/home">
          <Home />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/">
          <Home />
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeUpgradeModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  // Validate routing configuration on mount
  useEffect(() => {
    if (!validateRoutingConfiguration()) {
      console.error('Routing configuration validation failed');
    }
  }, []);

  // Handle redirects based on authentication state
  useEffect(() => {
    const redirectPath = getRedirectPath(location, { isAuthenticated, isLoading, user });
    if (redirectPath && redirectPath !== location) {
      setLocation(redirectPath);
    }
  }, [location, isAuthenticated, isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dr-teal"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/klaviyo-test" component={KlaviyoTest} />
          <Route path="/big-baby-public" component={BigBabyPublic} />
          <Route component={Landing} />
        </Switch>
      </div>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
