import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import BlogPost from "@/pages/blog-post";
import Discounts from "@/pages/discounts";
import Subscription from "@/pages/subscription";
import Track from "@/pages/track";
import Family from "@/pages/family";
import FeatureDemo from "@/pages/feature-demo";

function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [location] = useLocation();

  const showBottomNavigation = location !== "/subscription" && !location.startsWith("/checkout") && location !== "/payment-success";

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Switch>
        <Route path="/subscription" component={Subscription} />
        <Route path="/checkout/:courseId" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/courses">
          <Courses />
          {showBottomNavigation && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/track">
          <Track />
          {showBottomNavigation && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/discounts">
          <Discounts />
          {showBottomNavigation && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/family">
          <Family />
          {showBottomNavigation && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
        </Route>
        <Route path="/feature-demo" component={FeatureDemo} />
        <Route path="/">
          <Home />
          {showBottomNavigation && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
        <Landing />
      </div>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
