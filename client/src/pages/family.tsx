import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Settings, Share2, Crown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Family() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock family member data - in real app, this would come from API
  const [familyMembers] = useState([
    {
      id: 1,
      name: user?.firstName || "You",
      email: user?.email || "user@example.com",
      role: "admin",
      avatar: user?.profileImageUrl,
      joinedDate: "2024-01-15",
      isCurrentUser: true,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      joinedDate: "2024-02-01",
      isCurrentUser: false,
    },
  ]);

  const handleInviteMember = () => {
    if (user?.subscriptionTier === "free") {
      toast({
        title: "Subscription Required",
        description: "Family sharing requires a Gold or Platinum subscription.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Invite Sent",
      description: "Family member invitation has been sent via email.",
    });
  };

  const handleRemoveMember = (memberId: number) => {
    toast({
      title: "Member Removed",
      description: "Family member has been removed from your account.",
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "member":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const maxMembers = user?.subscriptionTier === "gold" ? 4 : user?.subscriptionTier === "platinum" ? 6 : 1;

  return (
    <div className="min-h-screen bg-dr-bg pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2 text-dr-teal" />
          Family Sharing
        </h1>
        <p className="text-sm text-gray-600">Manage your family members and sharing settings</p>
      </div>

      {/* Family Overview */}
      <div className="p-4 space-y-4">
        <Card className="border-dr-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Family Plan</span>
              <Badge variant="secondary" className="bg-dr-teal/10 text-dr-teal">
                {familyMembers.length}/{maxMembers} Members
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Plan</span>
                <span className="font-medium capitalize">{user?.subscriptionTier || "Free"} Plan</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Family Sharing</span>
                <span className="font-medium">
                  {user?.subscriptionTier === "free" ? "Not Available" : "Active"}
                </span>
              </div>
              {user?.subscriptionTier === "free" && (
                <div className="bg-dr-teal/10 border border-dr-teal/20 rounded-lg p-3">
                  <p className="text-sm text-dr-teal mb-2">
                    Upgrade to Gold or Platinum to share your account with family members.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/subscription"}
                    size="sm"
                    className="bg-dr-teal hover:bg-dr-teal-dark"
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Family Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Family Members</span>
              {user?.subscriptionTier !== "free" && familyMembers.length < maxMembers && (
                <Button
                  onClick={handleInviteMember}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        {getRoleIcon(member.role)}
                        {member.isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(member.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!member.isCurrentUser && (
                    <Button
                      onClick={() => handleRemoveMember(member.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sharing Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Settings className="h-5 w-5 mr-2 text-dr-teal" />
              Sharing Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Course Progress Sharing</h4>
                  <p className="text-xs text-gray-500">Allow family members to see your progress</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dr-teal"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Purchase Notifications</h4>
                  <p className="text-xs text-gray-500">Notify family members of new purchases</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dr-teal"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2 h-auto py-4"
                onClick={() => toast({ title: "Feature Coming Soon", description: "This feature will be available soon." })}
              >
                <Share2 className="h-5 w-5" />
                <span>Share Course</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 h-auto py-4"
                onClick={() => window.location.href = "/subscription"}
              >
                <Crown className="h-5 w-5" />
                <span>Upgrade Plan</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State for Free Users */}
        {user?.subscriptionTier === "free" && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Family Sharing Available</h3>
            <p className="text-gray-500 mb-4">
              Upgrade to Gold or Platinum to share your Dr. Golly account with up to {maxMembers} family members.
            </p>
            <Button
              onClick={() => window.location.href = "/subscription"}
              className="bg-dr-teal hover:bg-dr-teal-dark"
            >
              View Plans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
