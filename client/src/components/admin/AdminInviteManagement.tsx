import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export function AdminInviteManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "moderator"
  });

  // Invite admin mutation
  const inviteAdminMutation = useMutation({
    mutationFn: async (inviteData: typeof inviteData) => {
      return await apiRequest('POST', '/api/admin/invite', inviteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowInviteForm(false);
      setInviteData({ name: "", email: "", role: "admin" });
      toast({
        title: "Success",
        description: "Admin invitation sent successfully!",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to send invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email || !inviteData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    inviteAdminMutation.mutate(inviteData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Invite Management</h2>
        {!showInviteForm && (
          <Button
            onClick={() => setShowInviteForm(true)}
            className="bg-[#095D66] hover:bg-[#83CFCC] text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Admin
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Shield className="mr-2 h-5 w-5 text-[#095D66]" />
              Invite New Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminName">Full Name *</Label>
                  <Input
                    id="adminName"
                    type="text"
                    value={inviteData.name}
                    onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="adminEmail">Email Address *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adminRole">Role *</Label>
                <select
                  id="adminRole"
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Admin Invitation Details</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The invited person will receive an email with temporary login credentials</li>
                  <li>• They will have full admin access to the Dr. Golly platform</li>
                  <li>• They can manage users, content, and system settings</li>
                  <li>• The invitation includes a Gold subscription by default</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={inviteAdminMutation.isPending}
                  className="bg-[#095D66] hover:bg-[#83CFCC] text-white"
                >
                  {inviteAdminMutation.isPending ? "Sending..." : "Send Admin Invitation"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Invites Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Admin Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No recent admin invitations</p>
            <p className="text-sm">Invited admins will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}