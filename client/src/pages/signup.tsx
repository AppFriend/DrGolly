import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, User, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "wouter";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For now, redirect to the signup endpoint
      // In a full implementation, this would be a custom email/password auth
      window.location.href = '/api/signup';
    } catch (error) {
      console.error('Sign up error:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    try {
      window.location.href = '/api/signup';
    } catch (error) {
      console.error('Google sign up error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header */}
      <div className="max-w-md mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-xl font-bold text-gray-800">
            dr. Golly
          </div>
          <div className="w-9"></div> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pb-8">
        {/* Profile Image */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-br from-[#83CFCC]/20 to-[#83CFCC]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <img
                src={drGollyImage}
                alt="Dr. Golly - Professional headshot"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Dr Golly
          </h1>
          <p className="text-gray-600 text-sm">
            Start your family's sleep journey today
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Google Sign Up */}
          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full py-3 text-base font-medium rounded-full border-2 border-gray-200 hover:bg-gray-50"
          >
            <FcGoogle className="mr-3 h-5 w-5" />
            Continue with Google
          </Button>
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 py-3 rounded-full border-2 border-gray-200 focus:border-[#83CFCC] focus:ring-[#83CFCC]"
                    placeholder="First"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="py-3 rounded-full border-2 border-gray-200 focus:border-[#83CFCC] focus:ring-[#83CFCC]"
                    placeholder="Last"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 rounded-full border-2 border-gray-200 focus:border-[#83CFCC] focus:ring-[#83CFCC]"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 py-3 rounded-full border-2 border-gray-200 focus:border-[#83CFCC] focus:ring-[#83CFCC]"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#83CFCC] hover:bg-[#73BFB9] text-white py-3 text-base font-semibold rounded-full mt-6"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          
          {/* Terms */}
          <div className="text-center text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <button className="text-[#83CFCC] hover:text-[#73BFB9] underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button className="text-[#83CFCC] hover:text-[#73BFB9] underline">
              Privacy Policy
            </button>
          </div>
          
          {/* Sign In Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login">
              <button className="text-[#83CFCC] hover:text-[#73BFB9] font-medium">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}