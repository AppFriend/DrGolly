import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Heart, Baby, Users, Gift } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface PreferenceOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: 'baby-sleep',
    label: 'Baby Sleep',
    description: 'Help with newborn and infant sleep patterns',
    icon: <Baby className="w-6 h-6" />,
    color: 'bg-blue-100 border-blue-300 text-blue-700'
  },
  {
    id: 'toddler-sleep',
    label: 'Toddler Sleep',
    description: 'Sleep training and routines for toddlers',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-pink-100 border-pink-300 text-pink-700'
  },
  {
    id: 'toddler-behaviour',
    label: 'Toddler Behaviour',
    description: 'Managing challenging toddler behaviors',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-purple-100 border-purple-300 text-purple-700'
  },
  {
    id: 'partner-discounts',
    label: 'Partner Discounts',
    description: 'Access to exclusive partner offers and deals',
    icon: <Gift className="w-6 h-6" />,
    color: 'bg-green-100 border-green-300 text-green-700'
  }
];

export default function PreferencesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleComplete = async () => {
    if (selectedPreferences.length === 0) {
      toast({
        title: "Select Preferences",
        description: "Please select at least one area of interest",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/auth/complete-signup', {
        preferences: selectedPreferences,
        signupStep: 3,
        signupCompleted: true
      });

      if (response.ok) {
        toast({
          title: "Welcome!",
          description: "Your profile is complete. Redirecting to app...",
        });
        
        // Small delay to show success message
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      } else {
        const errorData = await response.json();
        toast({
          title: "Setup Failed",
          description: errorData.message || "Failed to complete setup",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup completion error:', error);
      toast({
        title: "Setup Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setLocation('/createprofile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            What interests you most?
          </CardTitle>
          <p className="text-gray-600">Choose your areas of focus to personalize your experience</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Preference Options */}
          <div className="space-y-4">
            {PREFERENCE_OPTIONS.map(option => (
              <div
                key={option.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPreferences.includes(option.id)
                    ? option.color + ' border-current'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePreferenceToggle(option.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedPreferences.includes(option.id)}
                    onChange={() => handlePreferenceToggle(option.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`p-1 rounded ${selectedPreferences.includes(option.id) ? option.color.split(' ')[0] : 'bg-gray-100'}`}>
                        {option.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Count */}
          {selectedPreferences.length > 0 && (
            <div className="text-center text-sm text-gray-600">
              {selectedPreferences.length} area{selectedPreferences.length !== 1 ? 's' : ''} selected
            </div>
          )}

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
              onClick={handleComplete}
              disabled={isSubmitting || selectedPreferences.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <LoadingAnimation size="sm" className="mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Complete Setup
            </Button>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}