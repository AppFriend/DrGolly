import { Home, GraduationCap, TrendingUp, Percent, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [location, navigate] = useLocation();
  
  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "courses", label: "Courses", icon: GraduationCap, path: "/courses" },
    { id: "track", label: "Track", icon: TrendingUp, path: "/track" },
    { id: "discounts", label: "Discounts", icon: Percent, path: "/discounts" },
    { id: "family", label: "Family", icon: Users, path: "/family" },
  ];

  const handleTabClick = (tab: { id: string; path: string }) => {
    navigate(tab.path);
    onTabChange(tab.id);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path || (location === "/" && tab.id === "home");
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center space-y-1 py-2 transition-colors",
                isActive ? "text-dr-teal" : "text-gray-400 hover:text-dr-teal"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
