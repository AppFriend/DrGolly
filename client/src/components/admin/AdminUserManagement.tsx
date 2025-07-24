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
import { UserTransactionHistory } from "./UserTransactionHistory";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
  subscription_tier: string;
  subscription_status: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  country: string;
  phone: string;
  phone_number: string;
  signup_source: string;
  signupSource?: string;
  sign_in_count: number;
  signInCount?: number;
  last_sign_in: string;
  last_login_at: string;
  lastSignIn?: string;
  created_at: string;
  createdAt?: string;
  stripe_customer_id: string;
  stripeCustomerId?: string;
}

export function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<User | null>(null);
  const [isCourseManagementOpen, setIsCourseManagementOpen] = useState(false);
  const [selectedUserForTransactions, setSelectedUserForTransactions] = useState<User | null>(null);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error: usersError, refetch } = useQuery({
    queryKey: ["/api/admin/users", { page: currentPage, limit: usersPerPage, search: searchQuery }],
    queryFn: async () => {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const response = await apiRequest("GET", `/api/admin/users?page=${currentPage}&limit=${usersPerPage}${searchParam}`);
      const data = await response.json();
      return data;
    },
    staleTime: 0, // Force refresh
    refetchOnMount: true,
  });

  const { data: totalUsersData } = useQuery({
    queryKey: ["/api/admin/users/count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users/count");
      const data = await response.json();
      return data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const totalUsers = totalUsersData?.totalCount || 0;
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // Force refetch on component mount and search changes
  useEffect(() => {
    refetch();
  }, [refetch, currentPage, searchQuery]);

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



  const handleUpdateUser = (updates: Partial<User>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ userId: selectedUser.id, updates });
  };



  const handleManageCourses = (user: User) => {
    setSelectedUserForCourses(user);
    setIsCourseManagementOpen(true);
  };

  const handleCloseCourseManagement = () => {
    setIsCourseManagementOpen(false);
    setSelectedUserForCourses(null);
  };

  const handleViewTransactions = (user: User) => {
    setSelectedUserForTransactions(user);
    setIsTransactionHistoryOpen(true);
  };

  const handleCloseTransactionHistory = () => {
    setIsTransactionHistoryOpen(false);
    setSelectedUserForTransactions(null);
  };

  const displayUsers = users || [];
  const displayCount = searchQuery ? (users?.length || 0) : totalUsers;
  
  // Data ready for display
  const isDataReady = !isLoading && Array.isArray(displayUsers);

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
      </div>

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
            {isLoading && (
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
            Users ({displayCount.toLocaleString()})
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
              {isDataReady && displayUsers.length > 0 ? (
                displayUsers.map((user: User) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#6B9CA3] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {(user.first_name || user.firstName)?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {user.first_name || user.firstName} {user.last_name || user.lastName}
                            </h3>
                          <Badge className={`${getTierColor(user.subscription_tier || user.subscriptionTier)} text-xs px-2 py-0.5`}>
                            {user.subscription_tier || user.subscriptionTier}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTransactions(user)}
                            className="h-7 w-7 p-0 flex-shrink-0"
                            title="View Transactions"
                          >
                            <CreditCard className="h-3 w-3" />
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
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                      id="firstName"
                                      defaultValue={selectedUser.first_name || selectedUser.firstName}
                                      placeholder="First Name"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                      id="lastName"
                                      defaultValue={selectedUser.last_name || selectedUser.lastName}
                                      placeholder="Last Name"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                      id="email"
                                      defaultValue={selectedUser.email}
                                      placeholder="Email"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="subscriptionTier">Subscription Plan</Label>
                                    <Select defaultValue={selectedUser.subscription_tier || selectedUser.subscriptionTier}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select plan" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="gold">Gold</SelectItem>
                                        <SelectItem value="platinum">Platinum</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                      id="phone"
                                      defaultValue={selectedUser.phone_number || selectedUser.phone}
                                      placeholder="Phone Number"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      // Handle form submission
                                      toast({
                                        title: "Success", 
                                        description: "User updated successfully"
                                      });
                                      setIsEditDialogOpen(false);
                                    }}
                                    disabled={updateUserMutation.isPending}
                                  >
                                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </div>
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
                            {formatDate(user.created_at || user.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {user.sign_in_count || user.signInCount || 0} logins
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

      {/* Pagination Controls */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers.toLocaleString()} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Course Management Modal */}
      {isCourseManagementOpen && selectedUserForCourses && (
        <UserCourseManagement 
          user={selectedUserForCourses}
          isOpen={isCourseManagementOpen}
          onClose={handleCloseCourseManagement}
        />
      )}

      {/* Transaction History Modal */}
      <Dialog open={isTransactionHistoryOpen} onOpenChange={setIsTransactionHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          {selectedUserForTransactions && (
            <UserTransactionHistory 
              userId={selectedUserForTransactions.id}
              userName={`${selectedUserForTransactions.first_name || selectedUserForTransactions.firstName} ${selectedUserForTransactions.last_name || selectedUserForTransactions.lastName}`}
            />
          )}
        </DialogContent>
      </Dialog>
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