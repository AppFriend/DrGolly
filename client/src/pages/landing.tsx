import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Main Content */}
      <main className="max-w-md mx-auto px-8 pt-16 pb-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="text-4xl font-light text-gray-800 mb-2">
            <span className="text-2xl">dr.</span>
          </div>
          <div className="text-5xl font-light text-gray-800 tracking-wide">
            <span className="font-normal">G</span>olly
          </div>
        </div>

        {/* Hero Image */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-72 h-72 bg-gradient-to-br from-dr-teal/20 to-dr-teal/30 rounded-full flex items-center justify-center mb-8">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
                alt="Dr. Golly holding a baby"
                className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Hi, I'm Dr Golly
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed px-4">
            I've created these online learning courses to empower you with the skills and knowledge to ensure your whole family gets a good night's sleep.
          </p>
        </div>
      </main>

      {/* Bottom Section with Curved Design */}
      <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto">
        {/* Curved Background */}
        <div className="relative">
          <svg
            viewBox="0 0 400 200"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 C100,20 300,20 400,100 L400,200 L0,200 Z"
              fill="rgb(134, 192, 180)"
              className="opacity-90"
            />
          </svg>
          
          {/* Buttons Container */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            <Button
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white py-4 text-lg font-semibold rounded-full shadow-lg border-0"
            >
              Get Started
            </Button>
            <Button
              onClick={() => window.location.href = '/api/login'}
              variant="outline"
              className="w-full bg-transparent border-2 border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white py-4 text-lg font-semibold rounded-full"
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
