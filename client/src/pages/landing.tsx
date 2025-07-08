import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Heart, Book, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dr-bg to-white">
      {/* Header */}
      <header className="bg-dr-teal text-white p-6 rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Moon className="h-6 w-6 text-dr-teal" />
            </div>
            <h1 className="text-2xl font-bold">Dr. Golly</h1>
          </div>
          <p className="text-center text-white/90 mb-8">
            Parenting & Sleep Expert
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img
            src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
            alt="Dr. Golly"
            className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-white shadow-lg"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Hi, I'm Dr Golly
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            I've created these online learning courses to empower you with the skills and knowledge to ensure your whole family gets a good night's sleep.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 mb-8">
          <Card className="border-dr-teal/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-dr-teal/10 rounded-full flex items-center justify-center">
                <Book className="h-5 w-5 text-dr-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Expert Courses</h3>
                <p className="text-sm text-gray-600">Sleep, nutrition, and parenting guidance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dr-teal/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-dr-teal/10 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-dr-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Personalized Support</h3>
                <p className="text-sm text-gray-600">Tailored advice for your family's needs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dr-teal/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-dr-teal/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-dr-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Community</h3>
                <p className="text-sm text-gray-600">Join thousands of parents on their journey</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-dr-teal hover:bg-dr-teal-dark text-white py-6 text-lg font-semibold rounded-2xl"
          >
            Get Started
          </Button>
          <Button
            onClick={() => window.location.href = '/api/login'}
            variant="outline"
            className="w-full border-dr-teal text-dr-teal hover:bg-dr-teal hover:text-white py-6 text-lg font-semibold rounded-2xl"
          >
            Sign In
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Join thousands of parents who trust Dr. Golly for expert guidance</p>
        </div>
      </main>
    </div>
  );
}
