import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, User, Phone, Users } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface SignupFormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  // Step 2: Contact & Preferences
  phoneNumber: string;
  userRole: string;
  primaryConcerns: string[];
  
  // Step 3: Terms & Marketing
  acceptedTerms: boolean;
  marketingOptIn: boolean;
  smsMarketingOptIn: boolean;
}

const CONCERN_OPTIONS = [
  { id: 'baby-sleep', label: 'Baby Sleep' },
  { id: 'toddler-sleep', label: 'Toddler Sleep' },
  { id: 'toddler-behaviour', label: 'Toddler Behaviour' },
  { id: 'partner-discounts', label: 'Partner Discounts' }
];

const ROLE_OPTIONS = [
  { id: 'parent', label: 'Parent' },
  { id: 'grandparent', label: 'Grandparent' },
  { id: 'carer', label: 'Carer' }
];

export default function EnhancedSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    userRole: '',
    primaryConcerns: [],
    acceptedTerms: false,
    marketingOptIn: false,
    smsMarketingOptIn: false
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
      setPhoneValidationError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Special validation for phone number
    if (field === 'phoneNumber') {
      validatePhoneNumber(value);
    }
  };

  const handleConcernToggle = (concernId: string) => {
    setFormData(prev => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concernId)
        ? prev.primaryConcerns.filter(id => id !== concernId)
        : [...prev.primaryConcerns, concernId]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
          toast({
            title: "Required Fields",
            description: "Please fill in all required fields",
            variant: "destructive"
          });
          return false;
        }
        if (formData.password.length < 6) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 6 characters long",
            variant: "destructive"
          });
          return false;
        }
        return true;
        
      case 2:
        if (!formData.userRole) {
          toast({
            title: "Please Select Role",
            description: "Please tell us your role so we can personalize your experience",
            variant: "destructive"
          });
          return false;
        }
        if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
          return false;
        }
        return true;
        
      case 3:
        if (!formData.acceptedTerms) {
          toast({
            title: "Terms Required",
            description: "Please accept the terms and conditions to continue",
            variant: "destructive"
          });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit all data in final step
      await apiRequest('POST', '/api/auth/enhanced-signup', {
        ...formData,
        signupSource: 'Enhanced Web Signup',
        signupStep: 3,
        signupCompleted: true
      });

      toast({
        title: "Welcome to Dr. Golly!",
        description: "Your account has been created successfully. Welcome to our community!",
        variant: "default"
      });

      // Redirect to home after successful signup
      setTimeout(() => {
        setLocation('/');
      }, 1000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-brand-teal mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tell us about yourself</h3>
              <p className="text-sm text-gray-600">Let's start with the basics</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Create Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a secure password (min 6 characters)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Phone className="h-12 w-12 text-brand-teal mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">Help us personalize your experience</h3>
              <p className="text-sm text-gray-600">This helps us provide content that matters to you</p>
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+61 4XX XXX XXX or +1 (XXX) XXX-XXXX"
              />
              {phoneValidationError && (
                <p className="text-sm text-red-600 mt-1">{phoneValidationError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Including your phone number allows us to send you important updates via SMS
              </p>
            </div>
            
            <div>
              <Label className="text-base font-medium">What's your role? *</Label>
              <RadioGroup
                value={formData.userRole}
                onValueChange={(value) => handleInputChange('userRole', value)}
                className="mt-3"
              >
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={role.id} id={role.id} />
                    <Label htmlFor={role.id} className="font-normal">{role.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label className="text-base font-medium">What are your main interests? (Optional)</Label>
              <p className="text-sm text-gray-600 mb-3">Select all that apply to get personalized content</p>
              <div className="space-y-3">
                {CONCERN_OPTIONS.map((concern) => (
                  <div key={concern.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={concern.id}
                      checked={formData.primaryConcerns.includes(concern.id)}
                      onCheckedChange={() => handleConcernToggle(concern.id)}
                    />
                    <Label htmlFor={concern.id} className="font-normal">{concern.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-brand-teal mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">Almost there!</h3>
              <p className="text-sm text-gray-600">Just a few final preferences to complete your setup</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptedTerms', checked)}
                />
                <Label htmlFor="acceptedTerms" className="text-sm leading-relaxed">
                  I accept the{' '}
                  <a href="/terms" className="text-brand-teal hover:underline" target="_blank">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-brand-teal hover:underline" target="_blank">
                    Privacy Policy
                  </a>{' '}
                  *
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => handleInputChange('marketingOptIn', checked)}
                />
                <Label htmlFor="marketingOptIn" className="text-sm leading-relaxed">
                  I want to receive helpful parenting tips and updates via email
                </Label>
              </div>
              
              {formData.phoneNumber && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="smsMarketingOptIn"
                    checked={formData.smsMarketingOptIn}
                    onCheckedChange={(checked) => handleInputChange('smsMarketingOptIn', checked)}
                  />
                  <Label htmlFor="smsMarketingOptIn" className="text-sm leading-relaxed">
                    I want to receive occasional SMS updates and reminders
                  </Label>
                </div>
              )}
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Ready to join Dr. Golly!</h4>
              <p className="text-sm text-green-800">
                Welcome {formData.firstName}! Click "Complete Signup" to start your parenting journey with us.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
            alt="Dr. Golly Sleep" 
            className="h-16 mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join Dr. Golly
          </CardTitle>
          
          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-2 rounded-full ${
                  step <= currentStep ? 'bg-brand-teal' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">Step {currentStep} of 3</p>
        </CardHeader>

        <CardContent>
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                className="cta-button flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="cta-button flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingAnimation size="sm" />
                ) : (
                  <>
                    <span>Complete Signup</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-brand-teal hover:underline font-medium">
                Sign in here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}