import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Check, Eye, EyeOff } from "lucide-react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function CompletePage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<any>(null);

  // Check for pending purchase data in session/URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const purchaseId = urlParams.get('purchaseId');
    
    if (courseId || purchaseId) {
      setPendingPurchase({ courseId, purchaseId });
    }
  }, []);

  // Handle existing users - redirect them immediately
  useEffect(() => {
    if (!isLoading && user) {
      // User is already logged in, redirect to their dashboard
      toast({
        title: "Welcome back!",
        description: "Your purchase has been added to your account.",
      });
      
      if (pendingPurchase?.courseId) {
        setLocation(`/courses/${pendingPurchase.courseId}`);
      } else {
        setLocation("/courses");
      }
    }
  }, [user, isLoading, pendingPurchase, setLocation, toast]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Set password for new user and complete purchase
      const response = await apiRequest('POST', '/api/auth/complete-purchase-signup', {
        password,
        purchaseData: pendingPurchase
      });

      if (!response.ok) {
        throw new Error('Failed to complete account setup');
      }

      const result = await response.json();

      toast({
        title: "Account Created Successfully!",
        description: "You're now logged in and ready to start your course.",
      });

      // Redirect to purchased course or courses dashboard
      if (result.courseId) {
        setLocation(`/courses/${result.courseId}`);
      } else {
        setLocation("/courses");
      }

    } catch (error: any) {
      console.error('Account setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete account setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user is already authenticated, this will be handled in useEffect
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-[#095D66] px-4 py-4">
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <img src={drGollyLogo} alt="Dr Golly" className="h-8" />
        </div>
      </div>

      <div className="flex items-center justify-center p-4 mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>

          {/* Success Message */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Welcome to Dr. Golly! Your account has been created and your course is ready.
            </p>
          </div>

          {/* Set Password Form */}
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Set Your Password</h2>
              <p className="text-sm text-gray-600">Create a secure password to access your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full bg-[#095D66] hover:bg-[#074952] text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Setting up your account...</span>
                </div>
              ) : (
                "Complete Account Setup"
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Once your password is set, you'll be automatically logged in and can start your course immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}