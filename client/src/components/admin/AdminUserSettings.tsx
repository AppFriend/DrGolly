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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin User Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage admin permissions and user roles
        </p>
      </div>

      {/* Admin Users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-4 w-4 text-[#6B9CA3]" />
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
            <div className="space-y-3">
              {adminUsers.map((user: AdminUser) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-3 bg-[#6B9CA3]/5"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#6B9CA3] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate mr-2">
                          {user.firstName} {user.lastName}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, false)}
                          disabled={updateUserMutation.isPending}
                          className="h-7 w-7 p-0 flex-shrink-0"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#6B9CA3] text-white text-xs px-2 py-0.5">
                          Admin
                        </Badge>
                        <Badge variant="outline" className="text-yellow-600 text-xs px-2 py-0.5">
                          {user.subscriptionTier}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {user.email} • Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Role Assignment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-4 w-4" />
            Admin Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            To promote a user to admin, use the "Users" tab to find the user and edit their permissions.
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Admin Assignment Process</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Go to the "Users" tab</li>
              <li>2. Find the user you want to promote</li>
              <li>3. Click the edit button</li>
              <li>4. Enable admin permissions</li>
              <li>5. Save changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Admin Permissions Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-4 w-4" />
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