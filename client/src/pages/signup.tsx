import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Mail, User, ArrowLeft, ArrowRight, Baby, Clock, Heart, Moon } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link, useLocation } from "wouter";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";

interface PersonalizationData {
  primaryConcern: string;
  childAge: string;
  childName: string;
  sleepChallenges: string;
  previousExperience: string;
  parentingStyle: string;
  timeCommitment: string;
  supportNetwork: string;
  additionalNotes: string;
}

export default function Signup() {
  const [, setLocation] = useLocation();
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
    primaryConcern: "",
    childAge: "",
    childName: "",
    sleepChallenges: "",
    previousExperience: "",
    parentingStyle: "",
    timeCommitment: "",
    supportNetwork: "",
    additionalNotes: ""
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleBasicSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    setStep(2);
  };

  const handlePersonalizationUpdate = (field: keyof PersonalizationData, value: string) => {
    setPersonalization(prev => ({ ...prev, [field]: value }));
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
      personalization
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
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    required
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
                  placeholder="Enter your email"
                  required
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

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
              <h2 className="text-2xl font-bold text-gray-900">What can we help you with first?</h2>
              <p className="text-gray-600">This helps us personalize your experience</p>
            </div>

            <RadioGroup
              value={personalization.primaryConcern}
              onValueChange={(value) => handlePersonalizationUpdate('primaryConcern', value)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="sleep-training" id="sleep-training" />
                <Label htmlFor="sleep-training" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Moon className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Sleep Training & Settling</div>
                    <div className="text-sm text-gray-600">Help your baby learn to sleep independently</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="routine-building" id="routine-building" />
                <Label htmlFor="routine-building" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Daily Routines & Schedules</div>
                    <div className="text-sm text-gray-600">Create predictable daily patterns</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="night-waking" id="night-waking" />
                <Label htmlFor="night-waking" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Baby className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Night Waking & Sleep Issues</div>
                    <div className="text-sm text-gray-600">Address frequent night wakings</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="gentle-approach" id="gentle-approach" />
                <Label htmlFor="gentle-approach" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <div>
                    <div className="font-medium">Gentle & Responsive Methods</div>
                    <div className="text-sm text-gray-600">Gentle approaches to sleep improvements</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

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
                disabled={!personalization.primaryConcern}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your child</h2>
              <p className="text-gray-600">This helps us provide age-appropriate guidance</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Child's Name (Optional)</Label>
                <Input
                  id="childName"
                  value={personalization.childName}
                  onChange={(e) => handlePersonalizationUpdate('childName', e.target.value)}
                  placeholder="What do you call your little one?"
                />
              </div>

              <div>
                <Label htmlFor="childAge">Child's Age</Label>
                <Select
                  value={personalization.childAge}
                  onValueChange={(value) => handlePersonalizationUpdate('childAge', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newborn">Newborn (0-4 weeks)</SelectItem>
                    <SelectItem value="little-baby">Little Baby (4-16 weeks)</SelectItem>
                    <SelectItem value="big-baby">Big Baby (4-8 months)</SelectItem>
                    <SelectItem value="pre-toddler">Pre-Toddler (8-12 months)</SelectItem>
                    <SelectItem value="toddler">Toddler (1-2 years)</SelectItem>
                    <SelectItem value="preschooler">Preschooler (2-5 years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sleepChallenges">Current Sleep Challenges</Label>
                <Textarea
                  id="sleepChallenges"
                  value={personalization.sleepChallenges}
                  onChange={(e) => handlePersonalizationUpdate('sleepChallenges', e.target.value)}
                  placeholder="What specific sleep issues are you experiencing?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="previousExperience">Previous Sleep Training Experience</Label>
                <Select
                  value={personalization.previousExperience}
                  onValueChange={(value) => handlePersonalizationUpdate('previousExperience', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No previous experience</SelectItem>
                    <SelectItem value="some">Some experience with sleep training</SelectItem>
                    <SelectItem value="experienced">Experienced with sleep training</SelectItem>
                    <SelectItem value="tried-failed">Tried before but didn't work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                disabled={!personalization.childAge}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Almost there!</h2>
              <p className="text-gray-600">A few more details to personalize your journey</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="parentingStyle">Preferred Parenting Style</Label>
                <Select
                  value={personalization.parentingStyle}
                  onValueChange={(value) => handlePersonalizationUpdate('parentingStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">Gentle & Responsive</SelectItem>
                    <SelectItem value="structured">Structured & Consistent</SelectItem>
                    <SelectItem value="flexible">Flexible & Adaptable</SelectItem>
                    <SelectItem value="mixed">Mixed Approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeCommitment">Time Available for Sleep Training</Label>
                <Select
                  value={personalization.timeCommitment}
                  onValueChange={(value) => handlePersonalizationUpdate('timeCommitment', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal (15-30 minutes/day)</SelectItem>
                    <SelectItem value="moderate">Moderate (30-60 minutes/day)</SelectItem>
                    <SelectItem value="dedicated">Dedicated (1-2 hours/day)</SelectItem>
                    <SelectItem value="intensive">Intensive (2+ hours/day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supportNetwork">Partner Support Level</Label>
                <Select
                  value={personalization.supportNetwork}
                  onValueChange={(value) => handlePersonalizationUpdate('supportNetwork', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-support">Full partner support</SelectItem>
                    <SelectItem value="some-support">Some partner support</SelectItem>
                    <SelectItem value="minimal-support">Minimal partner support</SelectItem>
                    <SelectItem value="single-parent">Single parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="additionalNotes">Anything else we should know?</Label>
                <Textarea
                  id="additionalNotes"
                  value={personalization.additionalNotes}
                  onChange={(e) => handlePersonalizationUpdate('additionalNotes', e.target.value)}
                  placeholder="Any other details that might help us provide better guidance..."
                  rows={3}
                />
              </div>
            </div>

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
                onClick={handleCompleteSignup}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Header */}
      <div className="max-w-md mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-xl font-bold text-gray-800">
            Dr. Golly
          </div>
          <div className="text-sm text-gray-600">
            {step}/{totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Account</span>
            <span>Preferences</span>
            <span>Child Info</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
    </div>
  );
}