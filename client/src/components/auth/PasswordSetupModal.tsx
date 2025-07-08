import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Check, X, Lock, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  tempPassword: string;
  userName?: string;
  onSuccess: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export function PasswordSetupModal({ 
  isOpen, 
  onClose, 
  userId, 
  tempPassword, 
  userName,
  onSuccess 
}: PasswordSetupModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const validation = validatePassword(newPassword);
  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setErrors(["Password does not meet requirements"]);
      return;
    }

    if (!passwordsMatch) {
      setErrors(["Passwords do not match"]);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      await apiRequest("POST", "/api/auth/set-password", {
        userId,
        newPassword,
        tempPassword
      });

      toast({
        title: "Password Set Successfully",
        description: "You can now use your new password to access your account.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set password";
      setErrors([errorMessage]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Welcome to Dr. Golly!
          </DialogTitle>
          <DialogDescription>
            {userName ? `Hi ${userName}! ` : ""}
            Please set up your permanent password to secure your account.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg">Create Your Password</CardTitle>
            <CardDescription>
              Your password will be used for all future logins
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </Label>
                <div className="space-y-1">
                  {[
                    { key: 'minLength', label: 'At least 8 characters' },
                    { key: 'hasUppercase', label: 'One uppercase letter' },
                    { key: 'hasLowercase', label: 'One lowercase letter' },
                    { key: 'hasNumber', label: 'One number' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {validation[key as keyof PasswordValidation] ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={validation[key as keyof PasswordValidation] ? 'text-green-600' : 'text-gray-500'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {passwordsMatch ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={passwordsMatch ? 'text-green-600' : 'text-red-500'}>
                    Passwords match
                  </span>
                </div>
              )}

              {/* Error Messages */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!isPasswordValid || !passwordsMatch || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Setting Password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Set Password
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}