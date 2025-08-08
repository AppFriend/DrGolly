import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { User, Plus, Camera } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  userRole: string;
  acceptedTerms: boolean;
  marketingOptIn: boolean;
}

const ROLE_OPTIONS = [
  { id: 'Parent', label: 'Parent' },
  { id: 'Grandparent', label: 'Grandparent' },
  { id: 'Carer', label: 'Carer' }
];

export default function CreateProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '+61',
    userRole: '',
    acceptedTerms: false,
    marketingOptIn: false
  });

  const handleNext = async () => {
    // Validate required fields
    if (!profileData.firstName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.lastName.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter your last name",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.userRole) {
      toast({
        title: "Missing Information",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number with country code if provided
      const fullPhoneNumber = profileData.phoneNumber 
        ? `${profileData.countryCode}${profileData.phoneNumber.replace(/\D/g, '')}`
        : '';

      const response = await apiRequest('POST', '/api/auth/update-profile', {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phoneNumber: fullPhoneNumber,
        userRole: profileData.userRole,
        acceptedTerms: profileData.acceptedTerms,
        marketingOptIn: profileData.marketingOptIn,
        signupStep: 2
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Moving to preferences...",
        });
        setLocation('/preferences');
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: errorData.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us a little about yourself?
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-end">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 text-sm">
              <Plus className="w-4 h-4" />
              <span>Add a Profile Picture</span>
            </button>
          </div>

          {/* Name Fields */}
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="First Name"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                className="h-12 pl-10 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Last Name"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                className="h-12 pl-10 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex space-x-2">
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-3">
              <span className="text-lg mr-2">🇦🇺</span>
              <span className="text-gray-700">+61</span>
            </div>
            <Input
              type="tel"
              placeholder="412 345 678"
              value={profileData.phoneNumber}
              onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="h-12 border-gray-300 focus:border-[#7DD3D8] focus:ring-[#7DD3D8] flex-1"
              disabled={isSubmitting}
            />
          </div>

          {/* Role Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Which Best Describes You?</p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setProfileData(prev => ({ ...prev, userRole: role.id }))}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    profileData.userRole === role.id
                      ? 'border-[#7DD3D8] bg-[#7DD3D8]/10 text-[#7DD3D8]'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                  disabled={isSubmitting}
                >
                  <span className="font-medium text-sm">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={profileData.acceptedTerms}
                onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, acceptedTerms: checked as boolean }))}
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                By signing up you agree to the{' '}
                <a href="/terms" className="text-[#7DD3D8] hover:underline">
                  Dr Golly Terms of Service
                </a>
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing-profile"
                checked={profileData.marketingOptIn}
                onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, marketingOptIn: checked as boolean }))}
              />
              <label htmlFor="marketing-profile" className="text-sm text-gray-600 leading-5">
                By opting in, you agree to receive marketing materials.
              </label>
            </div>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleNext}
            disabled={isSubmitting || !profileData.firstName || !profileData.lastName || !profileData.userRole || !profileData.acceptedTerms}
            className="w-full h-12 bg-[#7DD3D8] hover:bg-[#6BC5CB] text-white font-medium rounded-full"
          >
            {isSubmitting ? (
              <>
                <LoadingAnimation size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}