import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Edit, 
  Crown, 
  Users, 
  CreditCard, 
  ShoppingCart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  UserPlus,
  Shield
} from "lucide-react";
import UserCourseManagement from "./UserCourseManagement";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  country: string;
  phone: string;
  signupSource: string;
  signInCount: number;
  lastSignIn: string;
  createdAt: string;
  stripeCustomerId: string;
}

export function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<User | null>(null);
  const [isCourseManagementOpen, setIsCourseManagementOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "moderator"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error: usersError, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 0, // Force refresh
    refetchOnMount: true,
    // Use default query function to handle authentication properly
  });

  // Force refetch on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: [`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length > 2,
    // Use default query function to handle authentication properly
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin invite mutation
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
      toast({
        title: "Error",
        description: error.message || "Failed to send invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ userId: selectedUser.id, updates });
  };

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

  const handleManageCourses = (user: User) => {
    setSelectedUserForCourses(user);
    setIsCourseManagementOpen(true);
  };

  const handleCloseCourseManagement = () => {
    setIsCourseManagementOpen(false);
    setSelectedUserForCourses(null);
  };

  const displayUsers = searchQuery.length > 2 ? (searchResults || []) : (users || []);
  
  // Debug logging to see what's happening with the data
  console.log('Admin User Management Debug:', {
    searchQuery,
    searchQueryLength: searchQuery.length,
    users: users,
    searchResults: searchResults,
    displayUsers: displayUsers,
    isLoading: isLoading,
    isSearching: isSearching,
    usersError: usersError
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "platinum":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage users, subscriptions, and view user activity
          </p>
        </div>
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

      {/* Admin Invite Form */}
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
                    placeholder="Enter admin's full name"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email Address *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="Enter admin's email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="adminRole">Role *</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData({ ...inviteData, role: value as "admin" | "moderator" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={inviteAdminMutation.isPending}
                  className="bg-[#095D66] hover:bg-[#83CFCC] text-white"
                >
                  {inviteAdminMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Invite
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

      {/* Search */}
      <Card className="py-2">
        <CardContent className="pt-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email, name, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm"
            />
            {isSearching && (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4" />
            Users ({displayUsers?.length || 0})
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
            <div className="space-y-3">
              {Array.isArray(displayUsers) && displayUsers.length > 0 ? (
                displayUsers.map((user: User) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#6B9CA3] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                          <Badge className={`${getTierColor(user.subscriptionTier)} text-xs px-2 py-0.5`}>
                            {user.subscriptionTier}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageCourses(user)}
                            className="h-7 w-7 p-0 flex-shrink-0"
                            title="Manage Courses"
                          >
                            <BookOpen className="h-3 w-3" />
                          </Button>
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="h-7 w-7 p-0 flex-shrink-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit User: {selectedUser?.email}</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <UserEditForm
                                user={selectedUser}
                                onUpdate={handleUpdateUser}
                                isLoading={updateUserMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 truncate mt-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {user.signInCount} logins
                          </span>
                        </div>
                        {user.country && (
                          <span className="text-xs text-gray-400">
                            {user.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {searchQuery.length > 2 ? "No users found matching your search." : "No users found."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Course Management Modal */}
      {isCourseManagementOpen && selectedUserForCourses && (
        <UserCourseManagement 
          userId={selectedUserForCourses.id}
          userName={`${selectedUserForCourses.firstName} ${selectedUserForCourses.lastName}`}
          onClose={handleCloseCourseManagement}
        />
      )}
    </div>
  );
}

interface UserEditFormProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
  isLoading: boolean;
}

function UserEditForm({ user, onUpdate, isLoading }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    subscriptionTier: user.subscriptionTier || "free",
    subscriptionStatus: user.subscriptionStatus || "active",
    country: user.country || "",
    phone: user.phone || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subscriptionTier">Subscription Tier</Label>
          <Select
            value={formData.subscriptionTier}
            onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subscriptionStatus">Subscription Status</Label>
          <Select
            value={formData.subscriptionStatus}
            onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update User"}
        </Button>
      </div>
    </form>
  );
}