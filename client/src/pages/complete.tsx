import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function CompletePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For new users after purchase, create a simpler password setup flow
      await apiRequest('POST', '/api/auth/complete-setup', {
        password: formData.password
      });

      // Clear any cached user data and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Account Setup Complete!",
        description: "Welcome to Dr. Golly! Redirecting to your courses...",
        variant: "default"
      });
      
      // Wait a moment for session to be established, then navigate to home
      setTimeout(() => {
        setLocation("/home");
      }, 1000);
      
    } catch (error: any) {
      console.error('Complete setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <img 
            src={drGollyLogo} 
            alt="Dr. Golly Sleep" 
            className="h-16 mx-auto mb-4"
          />
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Purchase Complete!</h1>
          </div>
          <p className="text-gray-600">
            Thank you for your purchase. To complete your account setup, please create a password.
          </p>
        </div>

        {/* Password Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg text-[#095D66]">
              Set Your Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#095D66] hover:bg-[#095D66]/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up your account...
                  </div>
                ) : (
                  "Complete Setup & Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Once you complete setup, you'll be automatically logged into your Dr. Golly account 
            where you can access all your purchased courses and content.
          </p>
        </div>
      </div>
    </div>
  );
}