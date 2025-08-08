import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { User, Camera, Upload } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  userRole: string;
  profilePicture?: File;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '+61',
    userRole: ''
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, profilePicture: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const first = profileData.firstName.charAt(0).toUpperCase();
    const last = profileData.lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  };

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
      <Card className="w-full max-w-md bg-white shadow-lg border-0 relative">
        {/* Breadcrumb */}
        <div className="absolute top-4 left-4">
          <button 
            onClick={() => setLocation('/signup')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            ← Step 2 of 3
          </button>
        </div>
        
        <CardHeader className="text-center px-8 pt-8 pb-6">
          {/* Dr Golly Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
              alt="Dr. Golly" 
              className="h-12"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us a little about yourself?
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <button 
                type="button"
                onClick={handleProfilePictureClick}
                className="relative w-20 h-20 bg-gray-100 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center group overflow-hidden"
              >
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : profileData.firstName && profileData.lastName ? (
                  <span className="text-xl font-semibold text-gray-600">
                    {getInitials()}
                  </span>
                ) : (
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#7DD3D8] rounded-full p-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
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
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setProfileData(prev => ({ ...prev, userRole: role.id }))}
                  className={`flex-1 min-w-0 p-4 rounded-lg border text-center transition-all ${
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

          {/* Continue Button */}
          <Button 
            onClick={handleNext}
            disabled={isSubmitting || !profileData.firstName || !profileData.lastName || !profileData.userRole}
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