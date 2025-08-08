import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Upload, User, Phone } from "lucide-react";
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
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧‍👦' },
  { id: 'grandparent', label: 'Grandparent', icon: '👵' },
  { id: 'carer', label: 'Carer', icon: '🤗' }
];

const COUNTRY_CODES = [
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
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
    userRole: ''
  });

  const [phoneValidationError, setPhoneValidationError] = useState<string>('');

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    setPhoneValidationError('');
    if (!phone) return true; // Optional field
    
    // Remove all non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for common formats
    if (cleaned.length < 8 || cleaned.length > 15) {
      setPhoneValidationError('Phone number must be between 8-15 digits');
      return false;
    }
    
    return true;
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

    // Validate phone if provided
    if (profileData.phoneNumber && !validatePhoneNumber(profileData.phoneNumber)) {
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

  const handleBack = () => {
    setLocation('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '66%' }}></div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            <User className="inline-block w-6 h-6 mr-2" />
            Create Your Profile
          </CardTitle>
          <p className="text-gray-600">Tell us a bit about yourself</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                className="border-gray-300 focus:border-green-500"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                className="border-gray-300 focus:border-green-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="inline w-4 h-4 mr-1" />
              Phone Number (Optional)
            </Label>
            <div className="flex gap-2">
              <select
                value={profileData.countryCode}
                onChange={(e) => setProfileData(prev => ({ ...prev, countryCode: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:border-green-500 focus:outline-none"
                disabled={isSubmitting}
              >
                {COUNTRY_CODES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <Input
                id="phone"
                type="tel"
                placeholder="Phone number"
                value={profileData.phoneNumber}
                onChange={(e) => {
                  setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }));
                  setPhoneValidationError('');
                }}
                onBlur={(e) => validatePhoneNumber(e.target.value)}
                className={`flex-1 border-gray-300 focus:border-green-500 ${phoneValidationError ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {phoneValidationError && (
              <p className="text-sm text-red-600">{phoneValidationError}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>I am a... *</Label>
            <RadioGroup
              value={profileData.userRole}
              onValueChange={(value) => setProfileData(prev => ({ ...prev, userRole: value }))}
              className="space-y-2"
              disabled={isSubmitting}
            >
              {ROLE_OPTIONS.map(role => (
                <div key={role.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                  <RadioGroupItem value={role.id} id={role.id} />
                  <label htmlFor={role.id} className="flex items-center cursor-pointer flex-1">
                    <span className="text-xl mr-2">{role.icon}</span>
                    <span className="font-medium">{role.label}</span>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={isSubmitting || !profileData.firstName || !profileData.lastName || !profileData.userRole}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <LoadingAnimation size="sm" className="mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}