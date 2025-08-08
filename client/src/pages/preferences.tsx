import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { GraduationCap, BookOpen, Heart, Gift } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface PreferenceOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: 'baby-sleep',
    label: 'Baby Sleep',
    icon: <GraduationCap className="w-8 h-8" />
  },
  {
    id: 'toddler-sleep',
    label: 'Toddler Sleep',
    icon: <BookOpen className="w-8 h-8" />
  },
  {
    id: 'toddler-behaviour',
    label: 'Toddler Behaviour',
    icon: <Heart className="w-8 h-8" />
  },
  {
    id: 'partner-discounts',
    label: 'Partner discounts',
    icon: <Gift className="w-8 h-8" />
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Where can we help you first?
          </h1>
          <p className="text-gray-600 text-lg">
            You can select multiple & we'll personalise your experience!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            (Don't worry - you'll still see everything!)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {PREFERENCE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => handlePreferenceToggle(option.id)}
              className={`p-8 rounded-2xl border-2 text-center transition-all hover:shadow-md ${
                selectedPreferences.includes(option.id)
                  ? 'border-[#7DD3D8] bg-[#7DD3D8]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <div className={`mb-4 flex justify-center ${
                selectedPreferences.includes(option.id) ? 'text-[#7DD3D8]' : 'text-gray-400'
              }`}>
                {option.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{option.label}</h3>
            </button>
          ))}
        </div>

        <Button 
          onClick={handleComplete}
          disabled={isSubmitting || selectedPreferences.length === 0}
          className="w-full h-14 bg-[#7DD3D8] hover:bg-[#6BC5CB] text-white font-medium rounded-full text-lg"
        >
          {isSubmitting ? (
            <>
              <LoadingAnimation size="sm" className="mr-2" />
              Setting up...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}