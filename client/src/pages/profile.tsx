import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, CreditCard, Receipt, Share2, LogOut, Camera, Edit2, ArrowLeft, Home, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  downloadUrl?: string;
  description: string;
  invoiceNumber: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  created?: string;
}

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Add Payment Method Form Component
const AddPaymentMethodForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/profile',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Method Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Method Added",
          description: "Your payment method has been successfully added.",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <PaymentElement />
      </div>
      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="bg-dr-teal hover:bg-dr-teal/90"
        >
          {isProcessing ? "Processing..." : "Add Payment Method"}
        </Button>
      </div>
    </form>
  );
};

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [setupIntentSecret, setSetupIntentSecret] = useState<string | null>(null);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/profile/invoices"],
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["/api/profile/payment-methods"],
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set default payment method mutation
  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest("PATCH", `/api/profile/payment-methods/${paymentMethodId}/default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/payment-methods"] });
      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update default payment method. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove payment method mutation
  const removePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest("DELETE", `/api/profile/payment-methods/${paymentMethodId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/payment-methods"] });
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Remove Failed",
        description: "Failed to remove payment method. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSetupIntentMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/profile/payment-methods/setup-intent"),
    onSuccess: (data) => {
      setSetupIntentSecret(data.clientSecret);
      setIsAddPaymentMethodOpen(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payment method setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Copy referral code
  const copyReferralCode = () => {
    const referralCode = "DRG-015";
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Referral Code Copied",
      description: "Your referral code has been copied to clipboard.",
    });
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        
        // Update profile data with the preview URL for immediate display
        setProfileData(prev => prev ? {
          ...prev,
          profileImageUrl: result
        } : null);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input to allow re-selecting the same file
    event.target.value = '';
  };

  // Handle profile save
  const handleSaveProfile = () => {
    if (profileData) {
      // If there's a new image, use the preview URL; otherwise keep existing
      const dataToSave = {
        ...profileData,
        profileImageUrl: imagePreview || profileData.profileImageUrl
      };
      updateProfileMutation.mutate(dataToSave);
    }
  };

  // Initialize profile data when loaded
  useEffect(() => {
    if (profile && !profileData) {
      setProfileData(profile);
    }
  }, [profile, profileData]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dr-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert cents to dollars
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'platinum':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/home")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={imagePreview || profileData?.profileImageUrl} />
                  <AvatarFallback className="bg-dr-teal text-white text-xl">
                    {profileData?.firstName?.[0]}{profileData?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="absolute -bottom-1 -right-1 bg-dr-teal text-white p-1.5 rounded-full hover:bg-dr-teal/90 cursor-pointer"
                    >
                      <Camera className="h-3 w-3" />
                    </label>
                  </>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData?.firstName} {profileData?.lastName}
                </h1>
                <p className="text-gray-600">{profileData?.email}</p>
                <Badge className={getTierColor(profileData?.subscriptionTier || 'free')}>
                  {profileData?.subscriptionTier || 'Free'} Plan
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (isEditing) {
                  // Reset form when canceling
                  setProfileData(profile);
                  setImageFile(null);
                  setImagePreview(null);
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Referral
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData?.firstName || ""}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData?.lastName || ""}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profileData?.email || ""}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, email: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData?.phone || ""}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="bg-dr-teal hover:bg-dr-teal/90"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData(profile);
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{profileData?.subscriptionTier || 'Free'} Plan</h3>
                      <p className="text-gray-600">
                        {profileData?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <Badge className={getTierColor(profileData?.subscriptionTier || 'free')}>
                      {profileData?.subscriptionTier || 'Free'}
                    </Badge>
                  </div>
                  {profileData?.subscriptionEndDate && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Next billing date: {formatDate(profileData.subscriptionEndDate)}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <Button className="bg-dr-teal hover:bg-dr-teal/90">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-dr-teal border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No invoices found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice: InvoiceData) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium">{invoice.description}</p>
                          <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                          {invoice.invoiceNumber && (
                            <p className="text-xs text-gray-500">Invoice #{invoice.invoiceNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                            {invoice.downloadUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.downloadUrl, '_blank')}
                                className="text-xs"
                              >
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Methods
                  <Button
                    onClick={() => createSetupIntentMutation.mutate()}
                    disabled={createSetupIntentMutation.isPending}
                    className="bg-dr-teal hover:bg-dr-teal/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createSetupIntentMutation.isPending ? "Loading..." : "Add Card"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-dr-teal border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="space-y-2">
                      <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                      <p>No payment methods found</p>
                      <p className="text-sm">Add a payment method to make purchases</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method: PaymentMethod) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                            {method.brand.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">**** **** **** {method.last4}</p>
                            <p className="text-sm text-gray-600">
                              Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {!method.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultPaymentMethodMutation.mutate(method.id)}
                              disabled={setDefaultPaymentMethodMutation.isPending}
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this payment method?')) {
                                removePaymentMethodMutation.mutate(method.id);
                              }
                            }}
                            disabled={removePaymentMethodMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Payment Method Dialog */}
            <Dialog open={isAddPaymentMethodOpen} onOpenChange={setIsAddPaymentMethodOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                </DialogHeader>
                {setupIntentSecret && (
                  <Elements 
                    stripe={stripePromise} 
                    options={{
                      clientSecret: setupIntentSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0ea5e9',
                        },
                      },
                    }}
                  >
                    <AddPaymentMethodForm 
                      onSuccess={() => {
                        setIsAddPaymentMethodOpen(false);
                        setSetupIntentSecret(null);
                        queryClient.invalidateQueries({ queryKey: ["/api/profile/payment-methods"] });
                      }}
                    />
                  </Elements>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-4">
                      Share your referral code with friends and family to earn rewards when they sign up.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value="DRG-015"
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        onClick={copyReferralCode}
                        className="bg-dr-teal hover:bg-dr-teal/90"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Referral Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-dr-teal">0</p>
                        <p className="text-sm text-gray-600">Total Referrals</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-dr-teal">$0</p>
                        <p className="text-sm text-gray-600">Rewards Earned</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}