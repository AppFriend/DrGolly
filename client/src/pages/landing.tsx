import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pt-6 pb-32 relative z-10 h-screen flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex-1 flex flex-col justify-start">
          {/* Logo */}
          <div className="text-center mb-4">
            <img 
              src={drGollyLogo} 
              alt="Dr. Golly" 
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Hero Image */}
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <div className="w-48 h-48 bg-gradient-to-br from-[#83CFCC]/20 to-[#83CFCC]/30 rounded-full flex items-center justify-center">
                <img
                  src={drGollyImage}
                  alt="Dr. Golly - Professional headshot"
                  className="w-44 h-44 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center px-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 font-heading leading-tight">
              Hi, I'm Dr Golly
            </h1>
            <div className="bg-gradient-to-r from-[#83CFCC] to-[#CBEFE8] rounded-2xl p-4 mx-2">
              <p className="text-gray-700 text-sm leading-relaxed font-sans">
                I've created these online learning courses to empower you with the skills and knowledge to ensure your whole family gets a good night's sleep.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons Container - Added 10px spacing between text box and buttons */}
        <div className="px-6 pb-[5.5rem] space-y-3 relative z-[60] mt-[10px]">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Get Started button clicked');
              setLocation('/signup');
            }}
            className="w-full bg-white hover:bg-gray-100 text-[#83CFCC] py-3 text-base font-semibold rounded-full shadow-lg border-2 border-gray-300 font-heading cursor-pointer"
          >
            Get Started
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Sign In button clicked');
              setLocation('/login');
            }}
            variant="outline"
            className="w-full bg-transparent border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-[#83CFCC] py-3 text-base font-semibold rounded-full font-heading cursor-pointer"
          >
            Sign In
          </Button>
        </div>
      </main>

      {/* Bottom Section with Curved Design - Reduced height */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-0 pointer-events-none">
        {/* Curved Background */}
        <div className="relative">
          <svg
            viewBox="0 0 400 150"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C100,15 300,15 400,80 L400,150 L0,150 Z"
              fill="#83CFCC"
              className="opacity-90"
            />
          </svg>
        </div>
      </div>

      {/* Decorative curved elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-dr-teal/10 rounded-full"></div>
        <div className="absolute top-32 -right-16 w-32 h-32 bg-dr-teal/5 rounded-full"></div>
      </div>
    </div>
  );
}
