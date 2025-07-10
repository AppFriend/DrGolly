import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

interface WelcomeBackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  firstName: string;
  onLoginSuccess: () => void;
  onPasswordReset: () => void;
}

export function WelcomeBackPopup({ 
  isOpen, 
  onClose, 
  userEmail, 
  firstName, 
  onLoginSuccess, 
  onPasswordReset 
}: WelcomeBackPopupProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/public-login", {
        email: userEmail,
        password
      });

      if (response.success) {
        toast({
          title: "Welcome Back!",
          description: "Successfully logged in. Redirecting to checkout...",
        });
        onLoginSuccess();
        onClose();
      }
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please check your password.";
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    onPasswordReset();
    onClose();
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={drGollyLogo} alt="Dr. Golly" className="h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold text-[#095D66]">
            Welcome Back{firstName ? `, ${firstName}` : ""}!
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            We found an account with this email. Please log in to complete your purchase.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-email"
                type="email"
                value={userEmail}
                className="pl-10 bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter your password"
                required
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#095D66] hover:bg-[#095D66]/90 text-white font-medium"
            >
              {isLoading ? "Logging in..." : "Log In & Continue to Checkout"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-[#095D66] hover:underline"
              >
                Forgotten password? Reset it here
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}