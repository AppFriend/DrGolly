import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, ArrowLeft, ArrowRight, GraduationCap, BookOpen, Heart, Gift, Upload, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

interface PersonalizationData {
  primaryConcerns: string[];
  phoneNumber: string;
  profilePictureUrl: string;
  userRole: string;
  acceptedTerms: boolean;
  marketingOptIn: boolean;
  newMemberOfferShown: boolean;
  newMemberOfferAccepted: boolean;
}

const COUNTRY_CODES = [
  { code: "+61", flag: "🇦🇺", country: "Australia" },
  { code: "+1", flag: "🇺🇸", country: "USA" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Personalization data
  const [personalization, setPersonalization] = useState<PersonalizationData>({
    primaryConcerns: [],
    phoneNumber: "",
    profilePictureUrl: "",
    userRole: "",
    acceptedTerms: false,
    marketingOptIn: false,
    newMemberOfferShown: false,
    newMemberOfferAccepted: false
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState("+61");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleBasicSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    setStep(2);
  };

  const handlePersonalizationUpdate = (field: keyof PersonalizationData, value: any) => {
    setPersonalization(prev => ({ ...prev, [field]: value }));
    
    // If marketing opt-in is updated, sync with Klaviyo
    if (field === 'marketingOptIn' && email) {
      handleMarketingOptInUpdate(value);
    }
  };

  const handleMarketingOptInUpdate = async (optIn: boolean) => {
    try {
      const response = await fetch('/api/klaviyo/marketing-opt-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          optIn
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update marketing opt-in status');
      }
    } catch (error) {
      console.error('Error updating marketing opt-in:', error);
    }
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setProfilePictureUrl(dataUrl);
        handlePersonalizationUpdate('profilePictureUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureClick = () => {
    const input = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const toggleConcern = (concern: string) => {
    const currentConcerns = personalization.primaryConcerns;
    if (currentConcerns.includes(concern)) {
      handlePersonalizationUpdate('primaryConcerns', currentConcerns.filter(c => c !== concern));
    } else {
      handlePersonalizationUpdate('primaryConcerns', [...currentConcerns, concern]);
    }
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    try {
      // Store signup data with personalization for the login flow
      localStorage.setItem('signupData', JSON.stringify({
        firstName,
        lastName,
        email,
        personalization: {
          ...personalization,
          phoneNumber: selectedCountryCode + phoneNumber,
          onboardingCompleted: true
        }
      }));
      
      // Redirect to login with our enhanced flow
      window.location.href = '/api/login';
    } catch (error) {
      console.error('Complete signup error:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Store current step for later completion
    localStorage.setItem('signupStep', step.toString());
    localStorage.setItem('signupData', JSON.stringify({
      firstName,
      lastName,
      email,
      personalization: {
        ...personalization,
        phoneNumber: selectedCountryCode + phoneNumber
      }
    }));
    
    window.location.href = '/api/login';
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="text-gray-600">Join thousands of parents getting better sleep</p>
            </div>

            <form onSubmit={handleBasicSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                    className="rounded-xl border-gray-300 py-3 px-4"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                    className="rounded-xl border-gray-300 py-3 px-4"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="rounded-xl border-gray-300 py-3 px-4"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="rounded-xl border-gray-300 py-3 px-4 pr-12"
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

              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-3">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Tell us a little about yourself?</h2>
            </div>

            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div 
                    onClick={handleProfilePictureClick}
                    className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    {profilePictureUrl ? (
                      <img 
                        src={profilePictureUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    id="profilePictureInput"
                  />
                  <button
                    type="button"
                    onClick={handleProfilePictureClick}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#095D66] rounded-full flex items-center justify-center text-white hover:bg-[#0A6B74] transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600">Add a Profile Picture</span>
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex rounded-xl border-2 border-red-300 focus-within:border-red-500 overflow-hidden">
                  <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                    <SelectTrigger className="w-20 border-0 border-r border-red-300 rounded-r-none focus:ring-0 bg-white">
                      <SelectValue>
                        {COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag} {selectedCountryCode}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(({ code, flag, country }) => (
                        <SelectItem key={code} value={code}>
                          {flag} {code} {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="412 345 678"
                    className="border-0 rounded-l-none focus:ring-0 py-3 px-4"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <Label>Which Best Describes You?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Parent', 'Grandparent', 'Carer'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handlePersonalizationUpdate('userRole', role)}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 transition-all duration-200",
                        personalization.userRole === role
                          ? "border-[#095D66] bg-[#095D66]/10 text-[#095D66]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={personalization.acceptedTerms}
                  onCheckedChange={(checked) => handlePersonalizationUpdate('acceptedTerms', checked)}
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  By signing up you agree to the <Link href="/terms" className="text-[#095D66] hover:text-[#0A6B74] underline">Dr Golly Terms of Service</Link>
                </Label>
              </div>

              {/* Marketing Opt-in */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={personalization.marketingOptIn}
                  onCheckedChange={(checked) => handlePersonalizationUpdate('marketingOptIn', checked)}
                />
                <Label htmlFor="marketing" className="text-sm text-gray-600 leading-relaxed">
                  By opting in, you agree to receive marketing materials.
                </Label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!personalization.acceptedTerms || !personalization.userRole}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-3"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Where can we help you first?</h2>
              <p className="text-gray-600">You can select multiple & we'll personalise your experience!<br />
                <span className="text-sm">(Don't worry - you'll still see everything)</span>
              </p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'baby-sleep', label: 'Baby Sleep', icon: GraduationCap },
                { id: 'toddler-sleep', label: 'Toddler Sleep', icon: BookOpen },
                { id: 'toddler-behaviour', label: 'Toddler Behaviour', icon: Heart },
                { id: 'partner-discounts', label: 'Partner discounts', icon: Gift }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleConcern(id)}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 transition-all duration-200 hover:border-[#095D66]/30",
                    personalization.primaryConcerns.includes(id)
                      ? "border-[#095D66] bg-[#095D66]/10"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Icon className="h-8 w-8 text-gray-600" />
                    <span className="text-lg font-medium text-gray-900">{label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-3"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">New Member Offer: Free Month of Gold 🤩</h2>
              <p className="text-gray-600">
                First-time users can try gold our Gold Subscription half price for one month, and unlock 50% of all courses.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                If you choose to continue after 1 month, Gold subscription will be automatically charged at $19.99 per month. 
                You can cancel any time by clicking "manage my subscription"
              </p>
            </div>

            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handlePersonalizationUpdate('newMemberOfferAccepted', false)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200",
                  !personalization.newMemberOfferAccepted
                    ? "border-gray-400 bg-gray-50 text-gray-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Free</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handlePersonalizationUpdate('newMemberOfferAccepted', true)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200",
                  personalization.newMemberOfferAccepted
                    ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Gold</div>
                </div>
              </button>
            </div>

            {/* Gold Plan Details */}
            {personalization.newMemberOfferAccepted && (
              <div className="border-2 border-yellow-400 rounded-2xl p-6 bg-yellow-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-yellow-800">Gold</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-yellow-700">Monthly</span>
                    <div className="w-8 h-4 bg-yellow-300 rounded-full"></div>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-yellow-800 mb-2">
                  $199 <span className="text-lg font-normal">per month</span>
                </div>
                <div className="text-sm text-yellow-700 mb-4">
                  (Billed annually, cancel any time)
                </div>
                
                <div className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm mb-4">
                  50% off for 30 days
                </div>
                
                <div className="border-t border-yellow-300 pt-4">
                  <div className="text-sm font-medium text-yellow-800 mb-2">What's included</div>
                  <ul className="space-y-2 text-sm text-yellow-700">
                    <li className="flex items-center space-x-2">
                      <span>📚</span>
                      <span>Limited Articles, 1-2 Free Courses</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>📊</span>
                      <span>Basic Milestones, Limited Data</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>✉️</span>
                      <span>Email Support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>🏷️</span>
                      <span>Limited Deals with Restrictions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>👥</span>
                      <span>1 Additional Family Member</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handlePersonalizationUpdate('newMemberOfferShown', true);
                  setStep(5);
                }}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-3"
              >
                {personalization.newMemberOfferAccepted ? 'Try Gold' : 'Continue'}
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome to Dr. Golly!</h2>
              <p className="text-gray-600">
                Your account is almost ready. Complete your signup to get started.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                <p><strong>Selected Plan:</strong> {personalization.newMemberOfferAccepted ? 'Gold (50% off first month)' : 'Free'}</p>
                <p><strong>Areas of Interest:</strong> {personalization.primaryConcerns.join(', ') || 'None selected'}</p>
                <p><strong>Role:</strong> {personalization.userRole}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(4)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleCompleteSignup}
                disabled={isLoading}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-3"
              >
                {isLoading ? "Creating Account..." : "Complete Signup"}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-md mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <img 
            src={drGollyLogo} 
            alt="Dr. Golly" 
            className="h-8 w-auto object-contain"
          />
          <div className="text-sm text-gray-500">
            {step}/{totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Account</span>
            <span>Profile</span>
            <span>Interests</span>
            <span>Offer</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 hover:text-teal-800 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}