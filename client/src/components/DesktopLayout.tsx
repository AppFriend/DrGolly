import { ReactNode } from "react";
import { Home, GraduationCap, TrendingUp, Percent, Users, Settings, User, LogOut, Bell, HelpCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { SupportModal } from "@/components/SupportModal";
import { useState } from "react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

interface DesktopLayoutProps {
  children: ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "courses", label: "Courses", icon: GraduationCap, path: "/courses" },
    { id: "services", label: "Services", icon: Calendar, path: "/services" },
    { id: "discounts", label: "Partner Deals", icon: Percent, path: "/discounts" },
    { id: "tracking", label: "Growth Tracking", icon: TrendingUp, path: "/track" },
    { id: "family", label: "Family Sharing", icon: Users, path: "/family" },
    { id: "settings", label: "Settings", icon: Settings, path: "/profile" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  const isPlanActive = (tier: string) => {
    return user?.subscriptionTier === tier;
  };

  const getPlanDisplayName = () => {
    if (isPlanActive('gold')) return 'Gold Plan';
    if (isPlanActive('platinum')) return 'Platinum Plan';
    return 'Free Plan';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        {/* Logo */}
        <div className="flex items-center justify-center px-6 py-8 border-b border-gray-200">
          <img 
            src={drGollyLogo} 
            alt="Dr. Golly" 
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (location === "/" && item.id === "home") || (location.startsWith(item.path) && item.path !== "/");
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#095D66] text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-t border-gray-200">
          {/* Plan Badge */}
          <div className="mb-4">
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
              isPlanActive('gold') ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black" :
              isPlanActive('platinum') ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white" :
              "bg-gray-100 text-gray-600"
            )}>
              {getPlanDisplayName()}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => navigate("/profile")}
            >
              {(user?.profileImageUrl || user?.profilePictureUrl || user?.profile_picture_url) ? (
                <img 
                  src={user.profileImageUrl || user.profilePictureUrl || user.profile_picture_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <HelpCircle className="mr-3 h-4 w-4" />
              Get Support
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {children}
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal 
          isOpen={showSupportModal} 
          onClose={() => setShowSupportModal(false)} 
        />
      )}
    </div>
  );
}