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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const response = await apiRequest('POST', '/api/auth/signup-step1', {
        email: formData.email,
        password: formData.password,
        marketingOptIn: marketingOptIn
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
        <CardHeader className="text-center px-8 pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <img 
              src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
              alt="Dr. Golly" 
              className="h-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Dr. Golly Sleep
          </h1>
          <p className="text-gray-600 text-sm">
            Start your personalized sleep journey with expert guidance
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input
                  type="text"
                  placeholder="Enter your first name"
                  className="h-12 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input
                  type="text"
                  placeholder="Enter your last name"
                  className="h-12 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                />
              </div>
            </div>
            
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
            
            <Button
              type="submit"
              className="w-full h-12 bg-[#7DD3D8] hover:bg-[#6BC5CB] text-white font-medium rounded-full text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="my-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
          >
            <FcGoogle className="w-5 h-5 mr-3" />
            Sign up with Google
          </Button>
          
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
          
          <div className="mt-6 flex items-start space-x-3">
            <Checkbox
              id="marketing"
              checked={marketingOptIn}
              onCheckedChange={(checked) => setMarketingOptIn(checked as boolean)}
            />
            <label htmlFor="marketing" className="text-sm text-gray-600 leading-5">
              By opting in, you agree to receive marketing materials.
            </label>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-[#7DD3D8] hover:underline">
                Terms
              </a>
              ,{' '}
              <a href="/privacy" className="text-[#7DD3D8] hover:underline">
                Privacy Policy
              </a>{' '}
              and Cookie use
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}