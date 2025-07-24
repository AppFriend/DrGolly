import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ProfileCompletion() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [match] = useRoute('/complete/preferences');
  const { toast } = useToast();
  
  // Determine step based on URL
  const isPreferencesRoute = match;
  const [step, setStep] = useState(isPreferencesRoute ? 2 : 1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    interests: [] as string[],
    marketingOptIn: true,
    smsMarketingOptIn: false,
    termsAccepted: false
  });

  const availableInterests = [
    'Baby Sleep',
    'Toddler Sleep', 
    'Toddler Behaviour',
    'Feeding & Nutrition',
    'Partner Discounts'
  ];

  // Redirect if user is not logged in (with delay for cache refresh)
  useEffect(() => {
    if (!authLoading && !user) {
      // Add a small delay to allow authentication cache to refresh
      setTimeout(() => {
        if (!user) {
          setLocation('/');
        }
      }, 2000);
    }
  }, [user, authLoading, setLocation]);

  // Update step when URL changes
  useEffect(() => {
    if (isPreferencesRoute) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isPreferencesRoute]);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const passwordSetupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/auth/complete-profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Setup Complete!",
        description: "Your account is now ready. Welcome to Dr. Golly!",
      });
      setStep(3); // Move to completion step
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to preferences URL
    setLocation('/complete/preferences');
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    passwordSetupMutation.mutate({
      password: formData.password,
      interests: formData.interests,
      marketingOptIn: formData.marketingOptIn,
      smsMarketingOptIn: formData.smsMarketingOptIn,
      termsAccepted: formData.termsAccepted
    });
  };

  const handleCompleteSetup = () => {
    // Redirect to home with the purchased course
    setLocation('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#095D66] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#095D66]">
            Welcome to Dr. Golly!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {step === 1 && "Next, Set up your account password to access your course!"}
            {step === 2 && "Tell us about your interests"}
            {step === 3 && "You're all set!"}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Password Setup */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                className="w-full bg-[#095D66] hover:bg-[#074A52] text-white"
              >
                Continue
              </Button>
            </form>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label>What are you interested in? (Select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3">
                  {availableInterests.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestToggle(interest)}
                      />
                      <Label htmlFor={interest} className="text-sm">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Communication Preferences</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailMarketing"
                      checked={formData.marketingOptIn}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, marketingOptIn: checked as boolean }))
                      }
                    />
                    <Label htmlFor="emailMarketing" className="text-sm">
                      Email updates and tips
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smsMarketing"
                      checked={formData.smsMarketingOptIn}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, smsMarketingOptIn: checked as boolean }))
                      }
                    />
                    <Label htmlFor="smsMarketing" className="text-sm">
                      SMS updates (optional)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the{' '}
                  <a href="/terms" target="_blank" className="text-[#095D66] hover:underline">
                    Terms & Conditions
                  </a>
                </Label>
              </div>

              <Button 
                type="submit" 
                disabled={passwordSetupMutation.isPending}
                className="w-full bg-[#095D66] hover:bg-[#074A52] text-white"
              >
                {passwordSetupMutation.isPending ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          )}

          {/* Step 3: Completion */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Profile Setup Complete!</h3>
                <p className="text-gray-600">
                  Your account is ready and your Big Baby Sleep Program is now available in your courses.
                </p>
              </div>
              <Button 
                onClick={handleCompleteSetup}
                className="w-full bg-[#095D66] hover:bg-[#074A52] text-white"
              >
                Go to My Courses
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}