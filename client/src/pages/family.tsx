import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Baby, Edit, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Child } from "@shared/schema";

export default function Family() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showAddChild, setShowAddChild] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "not-specified" as "male" | "female" | "not-specified"
  });

  // Fetch user's children
  const { data: children = [], isLoading: isChildrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (childData: typeof formData) => {
      return await apiRequest('POST', '/api/children', childData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setShowAddChild(false);
      setFormData({ name: "", dateOfBirth: "", gender: "not-specified" });
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
    addChildMutation.mutate(formData);
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
        {/* Add Child Button */}
        {!showAddChild && (
          <Button 
            onClick={() => setShowAddChild(true)}
            className="w-full bg-[#83CFCC] hover:bg-[#095D66] text-white font-heading"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        )}

        {/* Add Child Form */}
        {showAddChild && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Add New Child</CardTitle>
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
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={addChildMutation.isPending}
                    className="flex-1 bg-[#83CFCC] hover:bg-[#095D66]"
                  >
                    {addChildMutation.isPending ? "Adding..." : "Add Child"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddChild(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Children List */}
        {children.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold font-heading">Your Children</h2>
            {children.map((child: Child) => (
              <Card key={child.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#83CFCC]/10 rounded-full flex items-center justify-center">
                        <Baby className="h-6 w-6 text-[#83CFCC]" />
                      </div>
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
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showAddChild ? (
          <div className="text-center py-12">
            <Baby className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2 font-heading">No Children Added</h2>
            <p className="text-gray-600 mb-6 font-sans">
              Add your children to start tracking their growth, development, and milestones.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}