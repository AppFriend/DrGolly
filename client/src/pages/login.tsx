import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', '/api/auth/public-login', {
        email: formData.email,
        password: formData.password
      });

      // Clear any cached user data and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Wait a moment for session to be established, then navigate
      setTimeout(() => {
        setLocation("/");
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingAnimation size="xl" />
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setLocation("/reset-password")}
                  className="text-sm text-[#095D66] hover:text-[#0a434a] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#095D66] hover:bg-[#074A52] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setLocation('/signup')}
                className="text-[#095D66] hover:underline font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Forgot your password?{' '}
              <button
                onClick={() => setLocation('/reset-password')}
                className="text-[#095D66] hover:underline"
              >
                Reset here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}