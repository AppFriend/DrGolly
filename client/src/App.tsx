import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { DesktopLayout } from "@/components/DesktopLayout";
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
import CourseOverview from "@/pages/course-overview";

import LessonPage from "@/pages/lesson";
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
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Refunds from "@/pages/refunds";
import Contact from "@/pages/contact";
import Shipping from "@/pages/shipping";
import ResetPassword from "@/pages/reset-password";
import Share from "@/pages/share";

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
    <div className="min-h-screen bg-white">
      <Switch>
        {/* Special routes that don't use the desktop layout */}
        <Route path="/subscription" component={Subscription} />
        <Route path="/checkout/:courseId" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/manage" component={Manage} />
        <Route path="/feature-demo" component={FeatureDemo} />
        <Route path="/checkout-subscription" component={CheckoutSubscription} />
        <Route path="/admin" component={Admin} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refunds" component={Refunds} />
        <Route path="/contact" component={Contact} />
        <Route path="/shipping" component={Shipping} />
        <Route path="/klaviyo-test" component={KlaviyoTest} />
        <Route path="/big-baby-public" component={BigBabyPublic} />
        <Route path="/share/:slug" component={Share} />
        
        {/* Routes that use the desktop layout */}
        <Route path="/blog/:slug">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <BlogPost />
            </div>
          </DesktopLayout>
        </Route>
        <Route path="/courses/:courseId">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <CourseOverview />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/lesson/:id">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <LessonPage />
            </div>
          </DesktopLayout>
        </Route>
        <Route path="/courses">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Courses />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/track">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Track />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/discounts">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Discounts />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/family">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Family />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/profile">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Profile />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/home">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Home />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Home />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeUpgradeModal}
        onUpgrade={handleUpgrade}
      />
      <Toaster />
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
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/terms" component={Terms} />
          <Route path="/klaviyo-test" component={KlaviyoTest} />
          <Route path="/big-baby-public" component={BigBabyPublic} />
          <Route path="/share/:slug" component={Share} />
          <Route component={Landing} />
        </Switch>
        <Toaster />
      </div>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <Router />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
