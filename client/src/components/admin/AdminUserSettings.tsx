import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Plus, 
  Edit, 
  Shield, 
  Users, 
  Crown,
  UserCheck,
  UserX
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  subscriptionTier: string;
  createdAt: string;
  lastSignIn: string;
}

export function AdminUserSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<AdminUser> }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleAdmin = (userId: string, isAdmin: boolean) => {
    updateUserMutation.mutate({ 
      userId, 
      updates: { isAdmin } 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const adminUsers = users?.filter((user: AdminUser) => user.isAdmin) || [];
  const regularUsers = users?.filter((user: AdminUser) => !user.isAdmin) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin User Management</h2>
          <p className="text-muted-foreground">
            Manage admin permissions and user roles
          </p>
        </div>
      </div>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#6B9CA3]" />
            Admin Users ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((user: AdminUser) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-[#6B9CA3]/5"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#6B9CA3] rounded-full flex items-center justify-center text-white font-semibold">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <Badge className="bg-[#6B9CA3] text-white">
                          Admin
                        </Badge>
                        <Badge variant="outline" className="text-yellow-600">
                          {user.subscriptionTier}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.email} • Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(user.id, false)}
                      disabled={updateUserMutation.isPending}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Remove Admin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular Users - Potential Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Regular Users ({regularUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {regularUsers.map((user: AdminUser) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <Badge variant="outline" className="text-gray-600">
                          {user.subscriptionTier}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.email} • Last login: {user.lastSignIn ? formatDate(user.lastSignIn) : "Never"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(user.id, true)}
                      disabled={updateUserMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Make Admin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dashboard Access</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Management</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Management</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Billing Management</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analytics Access</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}