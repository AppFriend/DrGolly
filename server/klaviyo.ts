import { User } from "@shared/schema";

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_LIST_ID = "XBRBuN"; // Superapp users list ID
const KLAVIYO_APP_SIGNUPS_LIST_ID = "WyGwy9"; // App_signups_all list ID
const KLAVIYO_BASE_URL = "https://a.klaviyo.com/api";

interface KlaviyoProfile {
  type: "profile";
  attributes: {
    email?: string;
    first_name?: string;
    last_name?: string;
    properties?: {
      signup_source?: string;
      user_id?: string;
      signup_date?: string;
    };
  };
}

interface KlaviyoListRelationship {
  type: "profile-subscription-bulk-create-job";
  attributes: {
    profiles: {
      data: Array<{
        type: "profile";
        attributes: {
          email?: string;
          subscriptions?: {
            email?: {
              marketing?: {
                consent?: "SUBSCRIBED";
              };
            };
          };
        };
      }>;
    };
  };
}

export class KlaviyoService {
  private headers = {
    "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
    "Content-Type": "application/json",
    "revision": "2024-10-15"
  };

  async createOrUpdateProfile(user: User, children?: any[]): Promise<string | null> {
    if (!KLAVIYO_API_KEY) {
      console.error("Klaviyo API key not configured");
      return null;
    }

    try {
      // Build comprehensive custom properties
      const customProperties: any = {
        // Core user info
        user_id: user.id,
        signup_source: user.signupSource || "App",
        signup_date: user.createdAt?.toISOString() || new Date().toISOString(),
        last_sign_in: user.lastSignIn?.toISOString(),
        sign_in_count: user.signInCount || 0,
        
        // Subscription info
        subscription_tier: user.subscriptionTier || "free",
        subscription_status: user.subscriptionStatus || "active",
        plan_tier: user.subscriptionTier || "free", // Alternative naming
        
        // Contact info
        phone_number: user.phoneNumber || user.phone,
        phone_number_region: user.country,
        
        // Profile and preferences
        user_role: user.userRole,
        primary_concerns: user.primaryConcerns,
        marketing_opt_in: user.marketingOptIn || false,
        accepted_terms: user.acceptedTerms || false,
        
        // Course and engagement data
        courses_purchased_previously: user.coursesPurchasedPreviously,
        count_courses: user.countCourses || 0,
        
        // Migration and admin status
        migrated: user.migrated || false,
        is_admin: user.isAdmin || false,
        
        // Onboarding status
        onboarding_completed: user.onboardingCompleted || false,
        new_member_offer_shown: user.newMemberOfferShown || false,
        new_member_offer_accepted: user.newMemberOfferAccepted || false,
        
        // Billing info
        billing_period: user.billingPeriod,
        next_billing_date: user.nextBillingDate?.toISOString(),
        stripe_customer_id: user.stripeCustomerId,
        stripe_subscription_id: user.stripeSubscriptionId,
        
        // Children info (if provided)
        ...(children && children.length > 0 && {
          children_count: children.length,
          child_1_birthdate: children[0]?.dateOfBirth?.toISOString().split('T')[0],
          child_1_name: children[0]?.name,
          child_1_gender: children[0]?.gender,
          ...(children[1] && {
            child_2_birthdate: children[1]?.dateOfBirth?.toISOString().split('T')[0],
            child_2_name: children[1]?.name,
            child_2_gender: children[1]?.gender,
          }),
          ...(children[2] && {
            child_3_birthdate: children[2]?.dateOfBirth?.toISOString().split('T')[0],
            child_3_name: children[2]?.name,
            child_3_gender: children[2]?.gender,
          })
        }),
        
        // Profile update timestamp
        profile_updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(customProperties).forEach(key => {
        if (customProperties[key] === undefined) {
          delete customProperties[key];
        }
      });

      const profile: KlaviyoProfile = {
        type: "profile",
        attributes: {
          email: user.email || undefined,
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
          phone_number: user.phoneNumber || user.phone,
          properties: customProperties
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: profile })
      });

      if (response.status === 409) {
        // Profile already exists, let's get the existing profile ID and update it
        const errorResponse = await response.json();
        const existingProfileId = errorResponse.errors?.[0]?.meta?.duplicate_profile_id;
        if (existingProfileId) {
          console.log("Klaviyo profile already exists, updating existing profile:", existingProfileId);
          
          // Update existing profile with latest data
          const updateResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/${existingProfileId}/`, {
            method: "PATCH",
            headers: this.headers,
            body: JSON.stringify({
              data: {
                type: "profile",
                id: existingProfileId,
                attributes: {
                  first_name: user.firstName || undefined,
                  last_name: user.lastName || undefined,
                  phone_number: user.phoneNumber || user.phone,
                  properties: customProperties
                }
              }
            })
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error("Failed to update existing Klaviyo profile:", updateResponse.status, errorText);
          } else {
            console.log("Klaviyo profile updated successfully");
          }
          
          return existingProfileId;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create Klaviyo profile:", response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log("Klaviyo profile created successfully:", result.data?.id);
      return result.data?.id || null;
    } catch (error) {
      console.error("Error creating Klaviyo profile:", error);
      return null;
    }
  }

  async addToAppSignupsList(user: User): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // First get or create the profile to get the profile ID
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to get profile ID for list subscription");
        return false;
      }

      // Use the correct format for adding profiles to lists
      const relationshipData = [{
        type: "profile",
        id: profileId
      }];

      const response = await fetch(`${KLAVIYO_BASE_URL}/lists/${KLAVIYO_APP_SIGNUPS_LIST_ID}/relationships/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: relationshipData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to add to App Signups list:", response.status, errorText);
        return false;
      }

      console.log("Successfully added to App Signups list");
      return true;
    } catch (error) {
      console.error("Error adding to App Signups list:", error);
      return false;
    }
  }

  async addToSuperAppList(user: User): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // First get or create the profile to get the profile ID
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to get profile ID for list subscription");
        return false;
      }

      // Use the correct format for adding profiles to lists
      const relationshipData = [{
        type: "profile",
        id: profileId
      }];

      const response = await fetch(`${KLAVIYO_BASE_URL}/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: relationshipData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to add user to Klaviyo list:", response.status, errorText);
        return false;
      }

      console.log("User added to Klaviyo superapp list successfully");
      return true;
    } catch (error) {
      console.error("Error adding user to Klaviyo list:", error);
      return false;
    }
  }

  async syncUserToKlaviyo(user: User, children?: any[]): Promise<boolean> {
    try {
      // First create or update the profile with comprehensive data
      const profileId = await this.createOrUpdateProfile(user, children);
      
      // Then add to superapp list if profile was created successfully
      if (profileId && user.email) {
        await this.addToSuperAppList(user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error syncing user to Klaviyo:", error);
      return false;
    }
  }

  async sendFamilyInvite(user: User, tempPassword: string, familyOwnerName: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for family invite");
        return false;
      }

      // Send family invite email via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Family Invite"
          },
          properties: {
            invitee_name: user.firstName,
            family_owner_name: familyOwnerName,
            temp_password: tempPassword,
            login_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/login`,
            invite_type: "family"
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send family invite via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Family invite sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending family invite via Klaviyo:", error);
      return false;
    }
  }

  async sendAdminInvite(user: User, tempPassword: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for admin invite");
        return false;
      }

      // Send admin invite email via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Admin Invite"
          },
          properties: {
            invitee_name: user.firstName,
            temp_password: tempPassword,
            login_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/login`,
            invite_type: "admin"
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send admin invite via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Admin invite sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending admin invite via Klaviyo:", error);
      return false;
    }
  }

  async sendPublicCheckoutWelcome(user: User, tempPassword: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for public checkout welcome");
        return false;
      }

      // Send public checkout welcome email via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Public Checkout Welcome"
          },
          properties: {
            customer_name: user.firstName,
            temp_password: tempPassword,
            login_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/login`,
            course_purchased: "Big Baby Sleep Program",
            signup_source: "public_checkout"
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send public checkout welcome via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Public checkout welcome sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending public checkout welcome via Klaviyo:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for password reset");
        return false;
      }

      // Send password reset email via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Password Reset"
          },
          properties: {
            customer_name: user.firstName,
            reset_token: resetToken,
            reset_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/reset-password?token=${resetToken}`,
            request_time: new Date().toISOString(),
            expires_in: "1 hour"
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send password reset email via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Password reset email sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending password reset email via Klaviyo:", error);
      return false;
    }
  }

  async sendOTPEmail(user: User, otpCode: string, purpose: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for OTP");
        return false;
      }

      // Send OTP email via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "OTP Verification"
          },
          properties: {
            customer_name: user.firstName,
            otp_code: otpCode,
            purpose: purpose, // e.g., "email_verification", "login_verification", "account_security"
            request_time: new Date().toISOString(),
            expires_in: "10 minutes"
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send OTP email via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("OTP email sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending OTP email via Klaviyo:", error);
      return false;
    }
  }

  async syncBigBabySignupToKlaviyo(user: User, customerDetails: any): Promise<boolean> {
    try {
      // Update user with Big Baby signup details temporarily for profile creation
      const userWithDetails = {
        ...user,
        signupSource: "Big Baby Public Checkout"
      };

      // Create or update profile, which will handle duplicates gracefully
      const profileId = await this.createOrUpdateProfile(userWithDetails);
      
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for Big Baby signup");
        return false;
      }

      // Add additional Big Baby properties to the profile
      const updateResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          data: {
            type: "profile",
            id: profileId,
            attributes: {
              properties: {
                signup_source: "Big Baby Public Checkout",
                due_date: customerDetails.dueDate || undefined,
                course_purchased: "Big Baby Sleep Program",
                purchase_amount: "$120",
                purchase_date: new Date().toISOString(),
              }
            }
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update Klaviyo profile with Big Baby details:", updateResponse.status, errorText);
        // Continue anyway since the profile was created
      }

      // Add to App Signups list
      const addedToList = await this.addToAppSignupsList(user);
      
      return addedToList;
    } catch (error) {
      console.error("Error syncing Big Baby signup to Klaviyo:", error);
      return false;
    }
  }

  async updateSubscriptionStatus(user: User, subscriptionData: any): Promise<boolean> {
    try {
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to get profile ID for subscription update");
        return false;
      }

      // Update profile with subscription changes
      const updateResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          data: {
            type: "profile",
            id: profileId,
            attributes: {
              properties: {
                subscription_tier: subscriptionData.tier,
                subscription_status: subscriptionData.status,
                plan_tier: subscriptionData.tier,
                billing_period: subscriptionData.billingPeriod,
                next_billing_date: subscriptionData.nextBillingDate?.toISOString(),
                subscription_updated_at: new Date().toISOString()
              }
            }
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update Klaviyo profile with subscription data:", updateResponse.status, errorText);
        return false;
      }

      console.log("Klaviyo profile updated with subscription changes");
      return true;
    } catch (error) {
      console.error("Error updating subscription status in Klaviyo:", error);
      return false;
    }
  }

  async syncLoginToKlaviyo(user: User, children?: any[]): Promise<boolean> {
    try {
      // Update profile with latest login info and all user data
      const profileId = await this.createOrUpdateProfile(user, children);
      
      if (!profileId) {
        console.error("Failed to sync login to Klaviyo");
        return false;
      }

      // Send login event for tracking
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "User Login"
          },
          properties: {
            login_time: new Date().toISOString(),
            user_id: user.id,
            subscription_tier: user.subscriptionTier || "free",
            sign_in_count: user.signInCount || 0
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send login event to Klaviyo:", response.status, errorText);
        // Don't return false here as profile update was successful
      }

      return true;
    } catch (error) {
      console.error("Error syncing login to Klaviyo:", error);
      return false;
    }
  }
}

export const klaviyoService = new KlaviyoService();