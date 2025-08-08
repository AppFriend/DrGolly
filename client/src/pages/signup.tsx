import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Clear previous errors
    setValidationErrors([]);
    
    // Check if terms are accepted (mandatory)
    if (!termsAccepted) {
      errors.push("terms");
      toast({
        title: "Terms Required",
        description: "You must agree to our terms to continue with signup.",
        variant: "destructive"
      });
    }
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return false;
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }
    
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/signup-step1', {
        email: formData.email,
        password: formData.password,
        termsAccepted: termsAccepted,
        marketingOptIn: marketingOptIn,
        // Only send Klaviyo opt-in data if marketing is checked
        ...(marketingOptIn && {
          emailOptIn: true,
          smsOptIn: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.nextStep) {
          setLocation(data.nextStep);
          return;
        }
      }

      // Invalidate auth cache to refresh user data
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Success!",
        description: "Account created successfully. Moving to profile setup...",
        variant: "default"
      });

      setTimeout(() => {
        setLocation('/createprofile');
      }, 500);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingAnimation size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-teal-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Green cloud background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-20 bg-green-300 rounded-full blur-2xl"></div>
        <div className="absolute top-32 right-20 w-40 h-24 bg-teal-300 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-36 h-22 bg-green-200 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-10 w-28 h-18 bg-teal-200 rounded-full blur-2xl"></div>
      </div>
      
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl border-0 relative z-10">
        {/* Back navigation */}
        <div className="absolute top-4 left-4">
          <button 
            onClick={() => setLocation('/')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            ← Back
          </button>
        </div>
        
        {/* Grey Banner */}
        <div className="bg-gray-100 px-6 py-4 rounded-t-lg flex items-center justify-center">
          <div className="flex items-center ml-16">
            <img 
              src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
              alt="Dr. Golly" 
              className="h-8 mr-3"
            />
            <p className="text-gray-700 text-sm">
              You're one step closer to better sleep for your baby!
            </p>
          </div>
        </div>

        <CardHeader className="px-8 pt-8 pb-6">
          <h1 className="text-xl font-bold uppercase mb-4 text-left" style={{ color: '#0a5d66' }}>
            LET'S GET STARTED
          </h1>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          {/* Google Login Button - Top Option */}
          <div className="mb-6">
            <Button
              type="button"
              onClick={() => window.location.href = '/api/login'}
              className="w-full h-12 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3"
            >
              <FcGoogle className="w-5 h-5" />
              Sign Up with Google
            </Button>
          </div>
          
          {/* OR Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="h-12 pl-10 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min 6 characters)"
                  className="h-12 pr-10 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="h-12 pr-10 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Terms and Marketing Checkboxes */}
            <div className="space-y-4">
              <div className={`flex items-start space-x-3 ${validationErrors.includes('terms') ? 'bg-red-50 p-3 rounded-lg border border-red-200' : ''}`}>
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => {
                    setTermsAccepted(checked as boolean);
                    // Clear validation error when checked
                    if (checked) {
                      setValidationErrors(prev => prev.filter(error => error !== 'terms'));
                    }
                  }}
                  className={validationErrors.includes('terms') ? 'border-red-400' : ''}
                />
                <div className="flex-1">
                  <label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                    By signing up, you agree to the{' '}
                    <a href="/terms" target="_blank" className="text-[#7DD3D8] hover:underline">
                      Dr Golly Terms of Service
                    </a>
                  </label>
                  {validationErrors.includes('terms') && (
                    <p className="text-red-600 text-xs mt-1">
                      You must agree to our terms to continue with signup.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(checked as boolean)}
                />
                <label htmlFor="marketing" className="text-sm text-gray-600 leading-5">
                  By opting in, you agree to receive marketing materials.
                </label>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full h-12 bg-[#7DD3D8] hover:bg-[#6BC5CB] text-white font-medium rounded-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !termsAccepted}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
              

            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already Have an account?{' '}
              <button
                onClick={() => setLocation('/login')}
                className="text-[#7DD3D8] hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}