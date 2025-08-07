import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, Instagram, Globe, Users, Mail, Camera } from "lucide-react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

const affiliateApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  instagramHandle: z.string().min(1, "Instagram handle is required").regex(/^@?[a-zA-Z0-9_.]+$/, "Invalid Instagram handle format"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  followers: z.number().min(0, "Followers must be a positive number"),
  profilePhotoUrl: z.string().url("Invalid profile photo URL").optional().or(z.literal("")),
});

type AffiliateApplicationForm = z.infer<typeof affiliateApplicationSchema>;

const countries = [
  "Australia", "United States", "United Kingdom", "Canada", "New Zealand", 
  "Germany", "France", "Italy", "Spain", "Netherlands", "Sweden", "Norway",
  "Denmark", "Finland", "Ireland", "Switzerland", "Austria", "Belgium",
  "Other"
];

export default function AffiliateApply() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<AffiliateApplicationForm>({
    resolver: zodResolver(affiliateApplicationSchema),
    defaultValues: {
      fullName: "",
      instagramHandle: "",
      email: "",
      country: "",
      followers: 0,
      profilePhotoUrl: "",
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: AffiliateApplicationForm) => {
      // Clean up Instagram handle
      const cleanHandle = data.instagramHandle.replace('@', '');
      
      return await apiRequest("POST", "/api/affiliate/apply", {
        ...data,
        instagramHandle: cleanHandle,
        profilePhotoUrl: data.profilePhotoUrl || undefined,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 2-3 business days.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AffiliateApplicationForm) => {
    applicationMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <UserCheck className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Application Submitted!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for your interest in joining the Dr. Golly affiliate program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We'll review your application and get back to you within 2-3 business days.
            </p>
            <p className="text-sm text-gray-500">
              If approved, you'll receive an email with your unique referral links and onboarding information.
            </p>
            <Button asChild className="w-full">
              <a href="https://drgolly.com">
                Return to Dr. Golly
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={drGollyLogo} 
            alt="Dr. Golly" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Affiliate Program Application
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our community of trusted influencers and earn commissions promoting 
            evidence-based parenting and sleep solutions.
          </p>
        </div>

        {/* Application Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Application Details
              </CardTitle>
              <CardDescription>
                Please fill out all fields to apply for our affiliate program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram Handle
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@yourusername" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Instagram username (with or without @)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Follower Count
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10000" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Your current Instagram follower count
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Country
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profilePhotoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Profile Photo URL (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://example.com/photo.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Link to your professional profile photo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• We'll review your application within 2-3 business days</li>
                      <li>• If approved, you'll receive unique referral links</li>
                      <li>• Start earning commissions on every sale you generate</li>
                      <li>• Access to exclusive marketing materials and support</li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-brand-teal hover:bg-brand-teal/90"
                    disabled={applicationMutation.isPending}
                  >
                    {applicationMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}