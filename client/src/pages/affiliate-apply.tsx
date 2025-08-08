import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, Instagram, Globe, Users, Mail, Camera, Upload } from "lucide-react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const affiliateApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  instagramHandle: z.string().min(1, "Instagram handle is required").regex(/^@?[a-zA-Z0-9_.]+$/, "Invalid Instagram handle format"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  followers: z.number().min(0, "Instagram followers must be a positive number"),
  tiktokFollowers: z.number().min(0, "TikTok followers must be a positive number"),
  profilePhotoUrl: z.string().optional().or(z.literal("")),
  // PayPal details for payments
  paypalEmail: z.string().email("Please enter a valid PayPal email address"),
  // Terms acceptance
  acceptedTerms: z.boolean().refine(val => val === true, "You must accept the Terms and Conditions"),
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
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");

  const form = useForm<AffiliateApplicationForm>({
    resolver: zodResolver(affiliateApplicationSchema),
    defaultValues: {
      fullName: "",
      instagramHandle: "",
      email: "",
      country: "",
      followers: 0,
      tiktokFollowers: 0,
      profilePhotoUrl: "",
      paypalEmail: "",
      acceptedTerms: false,
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: AffiliateApplicationForm) => {
      // Clean up Instagram handle
      const cleanHandle = data.instagramHandle.replace('@', '');
      
      return await apiRequest("POST", "/api/affiliate/apply", {
        ...data,
        instagramHandle: cleanHandle,
        profilePhotoUrl: uploadedPhotoUrl || data.profilePhotoUrl || undefined,
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
                          <Instagram className="h-4 w-4" />
                          Instagram Followers
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 5,000" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiktokFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          TikTok Followers
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 5,000" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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

                  {/* Profile Photo Upload */}
                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Camera className="h-4 w-4" />
                      Profile Photo (Optional)
                    </Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={async () => {
                        const response = await apiRequest("POST", "/api/objects/upload");
                        return {
                          method: "PUT" as const,
                          url: response.uploadURL,
                        };
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful[0]) {
                          const uploadURL = result.successful[0].uploadURL;
                          setUploadedPhotoUrl(uploadURL);
                          toast({
                            title: "Photo Uploaded",
                            description: "Your profile photo has been uploaded successfully.",
                          });
                        }
                      }}
                      buttonClassName="w-full"
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload Profile Photo</span>
                      </div>
                    </ObjectUploader>
                    {uploadedPhotoUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Photo uploaded successfully</p>
                    )}
                  </div>

                  {/* PayPal Setup Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-brand-teal">PayPal Setup for Payouts</h3>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                      <div className="space-y-2">
                        <p className="font-medium text-teal-800">Step 1:</p>
                        <p className="text-teal-700">Make sure you have a valid PayPal account (create one if needed)</p>
                        
                        <p className="font-medium text-teal-800 mt-4">Step 2:</p>
                        <p className="text-teal-700">Enter your PayPal account email below.</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="paypalEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Your PayPal Email
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="paypal@email.com" {...field} />
                          </FormControl>
                          <FormDescription className="text-red-600 font-medium">
                            IMPORTANT: Make sure you entered your PayPal email correctly to ensure payments are processed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="border-t pt-6">
                    <FormField
                      control={form.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I accept the{" "}
                              <a 
                                href="/affiliate-terms" 
                                target="_blank" 
                                className="text-brand-teal hover:underline"
                              >
                                Terms and Conditions
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
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