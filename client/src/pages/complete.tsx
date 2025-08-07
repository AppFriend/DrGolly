import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Complete() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user data from URL params or session storage
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || sessionStorage.getItem('pendingUserEmail') || '';
  const tempPasswordToken = urlParams.get('token') || sessionStorage.getItem('tempPasswordToken') || '';

  const completeAccountMutation = useMutation({
    mutationFn: async (data: { password: string; tempPasswordToken: string }) => {
      return await apiRequest("POST", "/api/auth/complete-account-setup", data);
    },
    onSuccess: () => {
      toast({
        title: "Account Setup Complete!",
        description: "You've been logged in and can now access your courses.",
        variant: "default"
      });
      
      // Clear any stored temporary data
      sessionStorage.removeItem('pendingUserEmail');
      sessionStorage.removeItem('tempPasswordToken');
      
      // Redirect to courses page
      setTimeout(() => {
        setLocation('/courses');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Account setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete account setup",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!tempPasswordToken) {
      toast({
        title: "Invalid Request",
        description: "No valid setup token found. Please try the signup process again.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await completeAccountMutation.mutateAsync({
        password,
        tempPasswordToken
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Welcome to Dr. Golly! Your account has been created and your course is ready.
          </p>
        </div>

        {/* Set Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Set Your Password</h2>
            <p className="text-sm text-gray-600">Create a secure password to access your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full"
                minLength={8}
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full"
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              {isSubmitting ? "Setting up..." : "Complete Account Setup"}
            </Button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            Once your password is set, you'll be automatically logged in and can start your course immediately.
          </p>
        </div>
      </div>
    </div>
  );
}