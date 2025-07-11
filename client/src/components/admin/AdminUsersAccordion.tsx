import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Edit3, 
  Save, 
  X, 
  Crown, 
  CreditCard,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import UserCourseManagement from './UserCourseManagement';

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

interface AdminUsersAccordionProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  isLoading: boolean;
}

export function AdminUsersAccordion({ users, onUpdateUser, isLoading }: AdminUsersAccordionProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<User | null>(null);
  const [isCourseManagementOpen, setIsCourseManagementOpen] = useState(false);
  const { toast } = useToast();

  // Group users by subscription tier
  const usersByTier = users.reduce((acc, user) => {
    const tier = user.subscriptionTier || 'free';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // Sort tiers: platinum, gold, free
  const sortedTiers = Object.keys(usersByTier).sort((a, b) => {
    const tierOrder = { platinum: 0, gold: 1, free: 2 };
    return (tierOrder[a as keyof typeof tierOrder] || 3) - (tierOrder[b as keyof typeof tierOrder] || 3);
  });

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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "gold":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "platinum":
        return <Crown className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleManageCourses = (user: User) => {
    setSelectedUserForCourses(user);
    setIsCourseManagementOpen(true);
  };

  const handleCloseCourseManagement = () => {
    setIsCourseManagementOpen(false);
    setSelectedUserForCourses(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-2"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management by Subscription Tier
          </CardTitle>
          <CardDescription>
            Organize and manage users grouped by their subscription levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {sortedTiers.map((tier) => (
              <AccordionItem key={tier} value={tier}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    {getTierIcon(tier)}
                    <span className="font-semibold capitalize">{tier} Users</span>
                    <Badge className={`${getTierColor(tier)} text-xs`}>
                      {usersByTier[tier].length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-3">
                    {usersByTier[tier].map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onUpdateUser={onUpdateUser}
                        onManageCourses={handleManageCourses}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

interface UserCardProps {
  user: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onManageCourses: (user: User) => void;
}

function UserCard({ user, onUpdateUser, onManageCourses }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    subscriptionTier: user.subscriptionTier || "free",
    subscriptionStatus: user.subscriptionStatus || "active",
    country: user.country || "",
    phone: user.phone || "",
  });

  const { toast } = useToast();

  const handleSave = () => {
    onUpdateUser(user.id, formData);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "User updated successfully",
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      subscriptionTier: user.subscriptionTier || "free",
      subscriptionStatus: user.subscriptionStatus || "active",
      country: user.country || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-[#6B9CA3] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.firstName?.[0] || user.email[0].toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="subscriptionTier" className="text-xs">Subscription</Label>
                      <Select value={formData.subscriptionTier} onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}>
                        <SelectTrigger className="h-8 text-sm">
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
                      <Label htmlFor="subscriptionStatus" className="text-xs">Status</Label>
                      <Select value={formData.subscriptionStatus} onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="country" className="text-xs">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge className={`${getTierColor(user.subscriptionTier)} text-xs px-2 py-0.5`}>
                      {user.subscriptionTier}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                    {user.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.country}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {user.signInCount} logins
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="h-7 w-7 p-0"
                  title="Save Changes"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="h-7 w-7 p-0"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageCourses(user)}
                  className="h-7 w-7 p-0"
                  title="Manage Courses"
                >
                  <BookOpen className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 w-7 p-0"
                  title="Edit User"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}