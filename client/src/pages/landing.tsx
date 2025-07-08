import { Button } from "@/components/ui/button";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pt-12 pb-40 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-gray-800">
            dr. Golly
          </div>
        </div>

        {/* Hero Image */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-br from-[#83CFCC]/20 to-[#83CFCC]/30 rounded-full flex items-center justify-center mb-6">
              <img
                src={drGollyImage}
                alt="Dr. Golly - Professional headshot"
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-32 px-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 font-heading leading-tight">
            Hi, I'm Dr Golly
          </h1>
          <div className="bg-gradient-to-r from-[#83CFCC] to-[#CBEFE8] rounded-2xl p-6 mx-4 mb-8">
            <p className="text-gray-700 text-base leading-relaxed font-sans">
              I've created these online learning courses to empower you with the skills and knowledge to ensure your whole family gets a good night's sleep.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Section with Curved Design */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        {/* Curved Background */}
        <div className="relative">
          <svg
            viewBox="0 0 400 280"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0,140 C100,60 300,60 400,140 L400,280 L0,280 Z"
              fill="#83CFCC"
              className="opacity-90"
            />
          </svg>
          
          {/* Buttons Container */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 space-y-4">
            <Button
              onClick={() => {
                try {
                  window.location.href = '/api/login';
                } catch (error) {
                  console.error('Navigation error:', error);
                  // Fallback for development
                  window.open('/api/login', '_self');
                }
              }}
              className="w-full bg-white hover:bg-gray-100 text-[#83CFCC] py-4 text-lg font-semibold rounded-full shadow-lg border-0 font-heading"
            >
              Get Started
            </Button>
            <Button
              onClick={() => {
                try {
                  window.location.href = '/api/login';
                } catch (error) {
                  console.error('Navigation error:', error);
                  // Fallback for development
                  window.open('/api/login', '_self');
                }
              }}
              variant="outline"
              className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#83CFCC] py-4 text-lg font-semibold rounded-full font-heading"
            >
              Sign In
            </Button>
          </div>
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
