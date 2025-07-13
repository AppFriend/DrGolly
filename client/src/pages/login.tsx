import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = () => {
    // Redirect to the Dr. Golly authentication URL
    window.location.href = '/api/auth/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
            alt="Dr. Golly Sleep" 
            className="h-16 mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome back to Dr. Golly Sleep
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Access your personalized sleep program and track your family's progress
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Sign in to access your courses, tracking tools, and family management features
            </p>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-3 text-lg font-medium"
            >
              Sign In with Dr. Golly
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <a href="/signup" className="text-brand-teal hover:text-brand-teal/80">
                Sign up here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}