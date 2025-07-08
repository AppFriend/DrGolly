import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PasswordSetupModal } from "./PasswordSetupModal";

interface TempLoginFormProps {
  onSuccess: () => void;
}

export function TempLoginForm({ onSuccess }: TempLoginFormProps) {
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !tempPassword) {
      setError("Please enter both email and temporary password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/temp-login", {
        email,
        tempPassword
      });

      if (response.requiresPasswordSetup) {
        setAuthenticatedUser(response.user);
        setShowPasswordSetup(true);
      } else {
        // User has already set up their password
        toast({
          title: "Login Successful",
          description: "Welcome back to Dr. Golly!",
        });
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please check your credentials.";
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

  const handlePasswordSetupSuccess = () => {
    toast({
      title: "Account Setup Complete",
      description: "You can now access your Dr. Golly account with your new password.",
    });
    onSuccess();
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <KeyRound className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            First-Time Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and temporary password to set up your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempPassword">Temporary Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="tempPassword"
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                Use the temporary password provided to you during account setup
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Setup Modal */}
      {showPasswordSetup && authenticatedUser && (
        <PasswordSetupModal
          isOpen={showPasswordSetup}
          onClose={() => setShowPasswordSetup(false)}
          userId={authenticatedUser.id}
          tempPassword={tempPassword}
          userName={authenticatedUser.firstName}
          onSuccess={handlePasswordSetupSuccess}
        />
      )}
    </>
  );
}