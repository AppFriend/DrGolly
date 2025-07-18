import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Shield, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PasswordSetupBannerProps {
  userId: string;
  userName: string;
  tempPassword: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function PasswordSetupBanner({ 
  userId, 
  userName, 
  tempPassword, 
  onComplete, 
  onDismiss 
}: PasswordSetupBannerProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    
    if (!/[A-Za-z]/.test(password)) {
      errors.push("Password must contain at least one letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    const validationErrors = validatePassword(password);
    setErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (errors.length > 0) {
      toast({
        title: "Password Requirements",
        description: "Please fix the password requirements before continuing.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/set-password", {
        userId,
        newPassword,
        tempPassword
      });

      // Invalidate user cache to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "Password Set Successfully",
        description: "Your new password has been saved. You can now use it to log in.",
        variant: "default"
      });

      onComplete();
    } catch (error) {
      console.error("Password setup error:", error);
      toast({
        title: "Setup Failed",
        description: "Failed to set up your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-amber-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-amber-900">
                  Welcome, {userName}!
                </CardTitle>
                <CardDescription className="text-amber-700">
                  You'll need to set your new password
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              For your security, please create a new password to replace your temporary one.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="pr-10"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {errors.length > 0 && (
                <div className="text-sm text-red-600 space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
              
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                  Passwords do not match
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || errors.length > 0 || newPassword !== confirmPassword}
                className="flex-1 bg-[#095D66] hover:bg-[#074a52] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Setting Password...
                  </div>
                ) : (
                  "Set New Password"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onDismiss}
                disabled={isLoading}
                className="px-4"
              >
                Later
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Your temporary password will be disabled once you set a new one.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}