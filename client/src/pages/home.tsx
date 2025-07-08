import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Play } from "lucide-react";
import drGollyImage from "@assets/drgolly_1751955955105.jpg";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
        <div className="flex items-center space-x-3">
          <img 
            src={user?.profileImageUrl || drGollyImage} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg font-semibold">Good Morning</h1>
            <p className="text-sm text-gray-600">{user?.firstName || 'User'}</p>
          </div>
        </div>
        <Bell className="w-6 h-6 text-gray-600" />
      </div>

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <div className="bg-teal-600 rounded-lg p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome to Dr. Golly</h2>
          <p className="text-teal-100 mb-4">Your comprehensive guide to parenting and child development</p>
          <Button className="bg-white text-teal-600 hover:bg-gray-100">
            Get Started
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Play className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Sleep Training</h3>
            <p className="text-sm text-gray-600">Expert guidance for better sleep</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Nutrition</h3>
            <p className="text-sm text-gray-600">Healthy eating for growing kids</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold mb-3">Continue Learning</h3>
          <p className="text-sm text-gray-600">Check out our courses to continue your parenting journey</p>
        </div>
      </div>
    </div>
  );
}
