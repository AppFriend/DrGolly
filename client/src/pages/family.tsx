import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Baby, Edit, Trash, Users, Mail, UserPlus, Crown, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Child, FamilyMember, FamilyInvite } from "@shared/schema";

export default function Family() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showAddChild, setShowAddChild] = useState(false);
  const [showInviteAdult, setShowInviteAdult] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "not-specified" as "male" | "female" | "not-specified",
    profilePicture: ""
  });
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    role: "parent" as "parent" | "carer"
  });

  // Fetch user's children
  const { data: children = [], isLoading: isChildrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  // Fetch family members (Gold subscribers only)
  const { data: familyMembers = [], isLoading: isFamilyMembersLoading } = useQuery({
    queryKey: ["/api/family/members"],
    enabled: isAuthenticated && user?.subscriptionTier === 'gold',
  });

  // Fetch pending invites (Gold subscribers only)
  const { data: pendingInvites = [], isLoading: isPendingInvitesLoading } = useQuery({
    queryKey: ["/api/family/invites"],
    enabled: isAuthenticated && user?.subscriptionTier === 'gold',
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (childData: typeof formData) => {
      return await apiRequest('POST', '/api/children', childData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setShowAddChild(false);
      setFormData({ name: "", dateOfBirth: "", gender: "not-specified", profilePicture: "" });
      toast({
        title: "Success",
        description: "Child added successfully!",
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
        description: "Failed to add child. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit child mutation
  const editChildMutation = useMutation({
    mutationFn: async (childData: typeof formData & { id: number }) => {
      return await apiRequest('PUT', `/api/children/${childData.id}`, childData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingChild(null);
      setFormData({ name: "", dateOfBirth: "", gender: "not-specified", profilePicture: "" });
      toast({
        title: "Success",
        description: "Child updated successfully!",
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
        description: "Failed to update child. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: number) => {
      return await apiRequest('DELETE', `/api/children/${childId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Success",
        description: "Child deleted successfully!",
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
        description: "Failed to delete child. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete family member mutation
  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return await apiRequest('DELETE', `/api/family/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      toast({
        title: "Success",
        description: "Family member removed successfully!",
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
        description: "Failed to remove family member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Invite adult mutation (Gold only)
  const inviteAdultMutation = useMutation({
    mutationFn: async (inviteData: typeof inviteData) => {
      return await apiRequest('POST', '/api/family/invite', inviteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family/invites"] });
      setShowInviteAdult(false);
      setInviteData({ name: "", email: "", role: "parent" });
      toast({
        title: "Success",
        description: "Family invitation sent successfully!",
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

  // Authorization check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isAuthLoading, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dateOfBirth) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (editingChild) {
      editChildMutation.mutate({ ...formData, id: editingChild.id });
    } else {
      addChildMutation.mutate(formData);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender || "not-specified",
      profilePicture: child.profilePicture || "",
    });
    setShowAddChild(true);
  };

  const handleDeleteChild = (childId: number) => {
    if (window.confirm("Are you sure you want to delete this child? This action cannot be undone.")) {
      deleteChildMutation.mutate(childId);
    }
  };

  const handleDeleteFamilyMember = (memberId: number) => {
    if (window.confirm("Are you sure you want to remove this family member? This action cannot be undone.")) {
      deleteFamilyMemberMutation.mutate(memberId);
    }
  };

  const handleCancelEdit = () => {
    setEditingChild(null);
    setShowAddChild(false);
    setFormData({ name: "", dateOfBirth: "", gender: "not-specified", profilePicture: "" });
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
    inviteAdultMutation.mutate(inviteData);
  };

  // Calculate baby's age
  const calculateAge = (dateOfBirth: string) => {
    const now = new Date();
    const birth = new Date(dateOfBirth);
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days old`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} old`;
    }
  };

  if (isAuthLoading || isChildrenLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200"></div>
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold flex items-center font-heading">
          <Users className="mr-2 h-5 w-5 text-[#83CFCC]" />
          Family
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Invite Adult Button for Gold subscribers */}
        {!showInviteAdult && user?.subscriptionTier === 'gold' && (
          <Button 
            onClick={() => setShowInviteAdult(true)}
            className="w-full cta-button-pill cta-primary font-heading"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Adult
          </Button>
        )}
        
        {/* Upgrade prompt for non-Gold users */}
        {user?.subscriptionTier !== 'gold' && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Gold Feature</h3>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                Invite family members to share your Dr Golly experience. Available with Gold subscription.
              </p>
              <Button 
                size="sm" 
                className="cta-button-pill cta-gold"
                onClick={() => window.location.href = '/manage'}
              >
                Upgrade to Gold
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Child Form */}
        {showAddChild && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">
                {editingChild ? "Edit Child" : "Add New Child"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter child's name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="not-specified">Not Specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setFormData(prev => ({ ...prev, profilePicture: e.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  {formData.profilePicture && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={formData.profilePicture} 
                        alt="Profile preview" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, profilePicture: "" }))}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={addChildMutation.isPending || editChildMutation.isPending}
                    className="flex-1 bg-[#83CFCC] hover:bg-[#095D66]"
                  >
                    {editingChild 
                      ? (editChildMutation.isPending ? "Updating..." : "Update Child")
                      : (addChildMutation.isPending ? "Adding..." : "Add Child")
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invite Adult Form */}
        {showInviteAdult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-[#83CFCC]" />
                Invite Family Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="inviteName">Full Name *</Label>
                  <Input
                    id="inviteName"
                    type="text"
                    value={inviteData.name}
                    onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="inviteEmail">Email Address *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="inviteRole">Role *</Label>
                  <select
                    id="inviteRole"
                    value={inviteData.role}
                    onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="parent">Parent</option>
                    <option value="carer">Carer</option>
                  </select>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Invitation Details</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    The invited person will receive an email with temporary login credentials and full access to your Gold subscription features.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={inviteAdultMutation.isPending}
                    className="flex-1 bg-[#095D66] hover:bg-[#83CFCC]"
                  >
                    {inviteAdultMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowInviteAdult(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pending Invites Section (Gold subscribers only) */}
        {user?.subscriptionTier === 'gold' && pendingInvites.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold font-heading">Pending Invites</h2>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {pendingInvites.length} Pending
              </Badge>
            </div>
            {pendingInvites.map((invite: FamilyInvite) => (
              <Card key={invite.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold font-heading">{invite.inviteeName}</h3>
                        <p className="text-sm text-gray-600 font-sans">
                          {invite.inviteeEmail}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {invite.inviteeRole}
                          </Badge>
                          <Badge className="text-xs bg-orange-100 text-orange-800">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Invited {new Date(invite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Resend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Children List */}
        {children.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-heading">Your Children</h2>
              {!showAddChild && (
                <Button 
                  onClick={() => setShowAddChild(true)}
                  size="sm"
                  className="bg-[#83CFCC] hover:bg-[#095D66] text-white font-heading"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Child
                </Button>
              )}
            </div>
            {children.map((child: Child) => (
              <Card key={child.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {child.profilePicture ? (
                        <img 
                          src={child.profilePicture} 
                          alt={child.name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#83CFCC]/10 rounded-full flex items-center justify-center">
                          <Baby className="h-6 w-6 text-[#83CFCC]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold font-heading">{child.name}</h3>
                        <p className="text-sm text-gray-600 font-sans">
                          {calculateAge(child.dateOfBirth)}
                        </p>
                        {child.gender !== "not-specified" && (
                          <p className="text-xs text-gray-500 capitalize">
                            {child.gender}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditChild(child)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteChild(child.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showAddChild ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-heading">Your Children</h2>
              <Button 
                onClick={() => setShowAddChild(true)}
                size="sm"
                className="bg-[#83CFCC] hover:bg-[#095D66] text-white font-heading"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
            </div>
            <div className="text-center py-12">
              <Baby className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2 font-heading">No Children Added</h2>
              <p className="text-gray-600 mb-6 font-sans">
                Add your children to start tracking their growth, development, and milestones.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-heading">Your Children</h2>
            </div>
          </div>
        )}

        {/* Family Members List (Gold subscribers only) */}
        {user?.subscriptionTier === 'gold' && familyMembers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold font-heading">Family Members</h2>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Gold Feature
              </Badge>
            </div>
            {familyMembers.map((member: FamilyMember) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#095D66]/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#095D66]" />
                      </div>
                      <div>
                        <h3 className="font-semibold font-heading">{member.name}</h3>
                        <p className="text-sm text-gray-600 font-sans">
                          {member.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteFamilyMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}