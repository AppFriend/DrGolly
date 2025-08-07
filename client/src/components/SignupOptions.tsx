import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, User } from "lucide-react";

interface SignupOptionsProps {
  onSelectSignup: (type: 'basic' | 'enhanced') => void;
}

export function SignupOptions({ onSelectSignup }: SignupOptionsProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img 
            src="/attached_assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png" 
            alt="Dr. Golly Sleep" 
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Dr. Golly
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to create your account. We've designed a personalized experience 
            to help us better support your parenting journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Basic Signup Option */}
          <Card className="border-2 hover:border-gray-300 transition-colors cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Quick Signup
              </CardTitle>
              <p className="text-sm text-gray-600">
                Get started quickly with the essentials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Name and email setup
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Secure password creation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Immediate access to free content
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Personalize later in your profile
                </li>
              </ul>
              
              <div className="pt-4">
                <Button 
                  onClick={() => onSelectSignup('basic')}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <span>Quick Signup</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Takes 1 minute
              </p>
            </CardContent>
          </Card>

          {/* Enhanced Signup Option */}
          <Card className="border-2 border-brand-teal bg-brand-teal/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="bg-brand-teal text-white px-3 py-1 rounded-full text-xs font-medium">
                Recommended
              </div>
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-brand-teal/10 rounded-full w-fit">
                <Sparkles className="h-8 w-8 text-brand-teal" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Personalized Setup
              </CardTitle>
              <p className="text-sm text-gray-600">
                Get the full Dr. Golly experience from day one
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Personalized content recommendations
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  SMS updates and reminders (optional)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Tailored tips based on your role
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-brand-teal rounded-full mr-3 flex-shrink-0"></div>
                  Curated content for your interests
                </li>
              </ul>
              
              <div className="pt-4">
                <Button 
                  onClick={() => onSelectSignup('enhanced')}
                  className="cta-button w-full flex items-center justify-center space-x-2"
                >
                  <span>Personalized Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Takes 3 minutes • 3 easy steps
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-brand-teal hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}