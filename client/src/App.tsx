import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { DesktopLayout } from "@/components/DesktopLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import PasswordSetupBanner from "@/components/auth/PasswordSetupBanner";
import { useState, useEffect } from "react";
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
import BigBabyCheckout from "@/pages/big-baby-checkout";
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
import Cart from "@/pages/cart";
import CartCheckout from "@/pages/cart-checkout";
import KlaviyoTest from "@/pages/klaviyo-test";
import NotificationTest from "@/pages/notification-test";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Refunds from "@/pages/refunds";
import Contact from "@/pages/contact";
import Shipping from "@/pages/shipping";
import ResetPassword from "@/pages/reset-password";
import ResetPasswordConfirm from "@/pages/reset-password-confirm";
import Share from "@/pages/share";
import ServicesPage from "@/pages/services";
import ServiceDetailPage from "@/pages/service-detail";
import AuthTestPage from "@/pages/auth-test";
import TestCheckout from "@/pages/test-checkout";

function AuthenticatedApp() {
  const [location] = useLocation();
  const { isOpen, closeUpgradeModal } = useUpgradeModal();
  const { user, showPasswordSetupBanner, dismissPasswordSetupBanner, completePasswordSetup } = useAuth();
  
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

  // Get login response data for password setup
  const getLoginResponseData = () => {
    const loginResponse = sessionStorage.getItem('loginResponse');
    if (loginResponse) {
      try {
        return JSON.parse(loginResponse);
      } catch (e) {
        console.log('Error parsing login response:', e);
      }
    }
    return null;
  };

  const loginData = getLoginResponseData();

  return (
    <div className="min-h-screen bg-white">
      <Switch>
        {/* Special routes that don't use the desktop layout */}
        <Route path="/subscription" component={Subscription} />
        <Route path="/checkout/:courseId" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/cart-checkout" component={CartCheckout} />
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
        <Route path="/notification-test" component={NotificationTest} />
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
        <Route path="/services">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <ServicesPage />
            </div>
          </DesktopLayout>
        </Route>
        <Route path="/services/:id">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <ServiceDetailPage />
            </div>
          </DesktopLayout>
        </Route>
        <Route path="/profile">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Profile />
            </div>
          </DesktopLayout>
          {showBottomNavigation && <BottomNavigation activeTab={getActiveTab()} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/cart">
          <DesktopLayout>
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <Cart />
            </div>
          </DesktopLayout>
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
        <Route path="/auth-test" component={AuthTestPage} />
        <Route path="/test-checkout" component={TestCheckout} />
        <Route component={NotFound} />
      </Switch>
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeUpgradeModal}
        onUpgrade={handleUpgrade}
      />
      {showPasswordSetupBanner && user && loginData && (
        <PasswordSetupBanner
          userId={user.id}
          userName={user.firstName || user.email}
          tempPassword={loginData.tempPassword || ""}
          onComplete={completePasswordSetup}
          onDismiss={dismissPasswordSetupBanner}
        />
      )}
      <Toaster />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

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
          <Route path="/reset-password-confirm" component={ResetPasswordConfirm} />
          <Route path="/terms" component={Terms} />
          <Route path="/klaviyo-test" component={KlaviyoTest} />
          <Route path="/big-baby-public" component={BigBabyPublic} />
          <Route path="/big-baby-checkout" component={BigBabyCheckout} />
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
