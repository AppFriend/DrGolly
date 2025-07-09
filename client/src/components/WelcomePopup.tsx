import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, BookOpen, CheckCircle } from 'lucide-react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function WelcomePopup({ isOpen, onClose, userName = "there" }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full mx-auto bg-white rounded-lg shadow-xl">
        <CardHeader className="relative text-center bg-gradient-to-r from-[#095D66] to-[#0A7A87] text-white rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">
            Welcome to the Dr. Golly App!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Hi {userName}! Thanks for joining us. Your course is ready and waiting for you.
          </p>
          
          <div className="bg-[#095D66] bg-opacity-10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-[#095D66]" />
              <span className="font-semibold text-[#095D66]">Find Your Course</span>
            </div>
            <p className="text-sm text-gray-600">
              You'll find the course you purchased under <strong>Courses → Purchases</strong>
            </p>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full bg-[#095D66] hover:bg-[#095D66]/90 text-white"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}