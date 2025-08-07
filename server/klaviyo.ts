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

  async createOrUpdateProfile(user: User, children?: any[], coursePurchases?: any[]): Promise<string | null> {
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
        last_login_at: user.lastLoginAt?.toISOString(),
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
        sms_marketing_opt_in: user.smsMarketingOptIn || false,
        accepted_terms: user.acceptedTerms || false,
        
        // Course and engagement data
        courses_purchased_previously: user.coursesPurchasedPreviously,
        count_courses: user.countCourses || 0,
        
        // Real-time course purchase data
        ...(coursePurchases && coursePurchases.length > 0 && {
          courses_purchased_count: coursePurchases.length,
          courses_purchased_list: coursePurchases
            .filter(p => p.status === 'completed')
            .map(p => p.courseName || `Course ${p.courseId}`)
            .join(', '),
          courses_purchased_total_amount: coursePurchases
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0) / 100, // Convert from cents
          last_course_purchase_date: coursePurchases
            .filter(p => p.status === 'completed')
            .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]?.purchasedAt,
          last_course_purchased: coursePurchases
            .filter(p => p.status === 'completed')
            .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]?.courseName
        }),
        
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

      // Format phone number for Klaviyo (requires E.164 format)
      const formatPhoneNumber = (phone: string | null | undefined): string | undefined => {
        if (!phone) return undefined;
        
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // If it's already in E.164 format (starts with +), return as-is
        if (phone.startsWith('+')) {
          return phone;
        }
        
        // If it's an Australian number without country code, add +61
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
          return `+61${cleaned.substring(1)}`;
        }
        
        // If it's a US number, add +1
        if (cleaned.length === 10) {
          return `+1${cleaned}`;
        }
        
        // If it's already formatted with country code but no +, add +
        if (cleaned.length > 10) {
          return `+${cleaned}`;
        }
        
        return undefined; // Invalid format
      };

      const profile: KlaviyoProfile = {
        type: "profile",
        attributes: {
          email: user.email || undefined,
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
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

  async syncUserToKlaviyo(user: User, children?: any[], coursePurchases?: any[]): Promise<boolean> {
    try {
      console.log(`Syncing user to Klaviyo: ${user.email} with ${children?.length || 0} children and ${coursePurchases?.length || 0} course purchases`);
      
      // First create or update the profile with comprehensive data
      const profileId = await this.createOrUpdateProfile(user, children, coursePurchases);
      
      // Then add to superapp list if profile was created successfully
      if (profileId && user.email) {
        await this.addToSuperAppList(user);
        
        // Update email subscription status based on marketing opt-in preference
        await this.updateEmailSubscriptionStatus(user, profileId);
        
        console.log(`Klaviyo sync completed successfully for user: ${user.email}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error syncing user to Klaviyo:", error);
      return false;
    }
  }

  async updateEmailSubscriptionStatus(user: User, profileId: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !profileId) {
      console.error("Klaviyo API key or profile ID missing");
      return false;
    }

    try {
      // Update subscription status based on user's marketing opt-in preference
      const subscriptionData = {
        type: "profile",
        id: profileId,
        attributes: {
          subscriptions: {
            email: {
              marketing: {
                consent: user.marketingOptIn ? "SUBSCRIBED" : "UNSUBSCRIBED"
              }
            }
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ data: subscriptionData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to update email subscription status:", response.status, errorText);
        return false;
      }

      console.log(`Email subscription status updated: ${user.marketingOptIn ? 'SUBSCRIBED' : 'UNSUBSCRIBED'} for ${user.email}`);
      return true;
    } catch (error) {
      console.error("Error updating email subscription status:", error);
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
            data: {
              type: "profile",
              attributes: {
                email: user.email
              }
            }
          },
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: "Public Checkout Welcome"
              }
            }
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

  async sendEnhancedSignupWelcome(user: User): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      // Create profile first
      const profileId = await this.createOrUpdateProfile(user);
      if (!profileId) {
        console.error("Failed to create or update Klaviyo profile for enhanced signup welcome");
        return false;
      }

      // Parse primary concerns for event data
      let primaryConcerns = [];
      try {
        primaryConcerns = user.primaryConcerns ? JSON.parse(user.primaryConcerns) : [];
      } catch (e) {
        primaryConcerns = [];
      }

      // Send enhanced signup welcome event via Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Enhanced Signup Welcome"
          },
          properties: {
            customer_name: user.firstName,
            full_name: `${user.firstName} ${user.lastName}`,
            user_role: user.userRole,
            phone_number: user.phoneNumber,
            primary_concerns: primaryConcerns,
            marketing_opt_in: user.marketingOptIn,
            sms_marketing_opt_in: user.smsMarketingOptIn,
            signup_source: user.signupSource || "Enhanced Web Signup",
            signup_completed: user.signupCompleted,
            onboarding_completed: user.onboardingCompleted,
            login_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/`,
            welcome_type: "enhanced_signup"
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
        console.error("Failed to send enhanced signup welcome via Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Enhanced signup welcome sent successfully via Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending enhanced signup welcome via Klaviyo:", error);
      return false;
    }
  }

  async sendServiceBookingEvent(email: string, bookingData: any): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !email) {
      console.error("Klaviyo API key not configured or email missing");
      return false;
    }

    try {
      // Send service booking event to Klaviyo
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: email
              }
            }
          },
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: "Service Booking"
              }
            }
          },
          properties: {
            service_name: bookingData.service_name,
            service_type: bookingData.service_type,
            booking_date: bookingData.booking_date,
            booking_time: bookingData.booking_time,
            service_duration: bookingData.service_duration,
            service_price: bookingData.service_price,
            booking_status: bookingData.booking_status,
            booking_notes: bookingData.booking_notes,
            customer_name: bookingData.customer_name,
            customer_id: bookingData.customer_id,
            booking_id: bookingData.booking_id
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
        console.error("Failed to send service booking event to Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Service booking event sent successfully to Klaviyo");
      return true;
    } catch (error) {
      console.error("Error sending service booking event to Klaviyo:", error);
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

  async syncLoginToKlaviyo(user: User, children?: any[], stripeData?: any, coursePurchases?: any[]): Promise<boolean> {
    try {
      // Update profile with latest login info and all user data
      const profileId = await this.createOrUpdateProfile(user, children, coursePurchases);
      
      if (!profileId) {
        console.error("Failed to sync login to Klaviyo");
        return false;
      }

      // If Stripe data is provided, update profile with latest Stripe info
      if (stripeData && profileId) {
        const stripeUpdateResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
          method: "PATCH",
          headers: this.headers,
          body: JSON.stringify({
            data: {
              type: "profile",
              id: profileId,
              attributes: {
                properties: {
                  stripe_customer_id: stripeData.customerId,
                  stripe_subscription_id: stripeData.subscriptionId,
                  stripe_subscription_status: stripeData.subscriptionStatus,
                  stripe_next_billing_date: stripeData.nextBillingDate,
                  stripe_payment_method_type: stripeData.paymentMethodType,
                  stripe_last_payment_date: stripeData.lastPaymentDate,
                  stripe_total_spent: stripeData.totalSpent,
                  stripe_updated_at: new Date().toISOString()
                }
              }
            }
          })
        });

        if (!stripeUpdateResponse.ok) {
          const errorText = await stripeUpdateResponse.text();
          console.error("Failed to update Stripe data in Klaviyo:", stripeUpdateResponse.status, errorText);
        }
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
            sign_in_count: user.signInCount || 0,
            ...(stripeData && {
              stripe_customer_id: stripeData.customerId,
              stripe_subscription_status: stripeData.subscriptionStatus
            })
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

  async syncCoursePurchaseToKlaviyo(user: User, coursePurchase: any): Promise<boolean> {
    try {
      // Get user's children and course purchase data for comprehensive sync
      const children = user.id ? await this.getUserChildren(user.id) : [];
      const coursePurchases = user.id ? await this.getUserCoursePurchases(user.id) : [];
      
      // Update profile with latest purchase data
      const profileId = await this.createOrUpdateProfile(user, children, coursePurchases);
      
      if (!profileId) {
        console.error("Failed to sync course purchase to Klaviyo");
        return false;
      }

      // Send course purchase event
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            email: user.email
          },
          metric: {
            name: "Course Purchase"
          },
          properties: {
            course_name: coursePurchase.courseName,
            course_id: coursePurchase.courseId,
            purchase_amount: coursePurchase.amount / 100, // Convert from cents
            currency: coursePurchase.currency || "USD",
            purchase_date: coursePurchase.purchasedAt || new Date().toISOString(),
            payment_intent_id: coursePurchase.paymentIntentId,
            customer_email: coursePurchase.customerEmail,
            customer_name: coursePurchase.customerName,
            purchase_status: coursePurchase.status
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
        console.error("Failed to send course purchase event to Klaviyo:", response.status, errorText);
        return false;
      }

      console.log("Course purchase event sent to Klaviyo successfully");
      return true;
    } catch (error) {
      console.error("Error syncing course purchase to Klaviyo:", error);
      return false;
    }
  }

  // Helper methods for course purchase sync
  private async getUserChildren(userId: string): Promise<any[]> {
    try {
      const { storage } = await import('./storage');
      return await storage.getUserChildren(userId);
    } catch (error) {
      console.error("Error fetching user children:", error);
      return [];
    }
  }

  private async getUserCoursePurchases(userId: string): Promise<any[]> {
    try {
      const { storage } = await import('./storage');
      return await storage.getUserCoursePurchases(userId);
    } catch (error) {
      console.error("Error fetching user course purchases:", error);
      return [];
    }
  }

  async syncLeadToKlaviyo(leadCapture: any, freebieTitle: string): Promise<boolean> {
    if (!KLAVIYO_API_KEY) {
      console.error("Klaviyo API key not configured");
      return false;
    }

    try {
      // Create or update profile with lead capture data
      const profileData = {
        type: "profile",
        attributes: {
          email: leadCapture.email,
          first_name: leadCapture.firstName,
          properties: {
            signup_source: "Freebie Download",
            freebie_downloaded: freebieTitle,
            download_date: new Date().toISOString(),
            top_of_funnel_nurture: true,
            freebie_id: leadCapture.freebieId,
            ip_address: leadCapture.ipAddress,
            user_agent: leadCapture.userAgent,
            referrer_url: leadCapture.referrerUrl,
            lead_capture_id: leadCapture.id,
          }
        }
      };

      // Create or update profile
      const profileResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: profileData })
      });

      let profileId;
      if (!profileResponse.ok) {
        if (profileResponse.status === 409) {
          // Profile already exists, get existing profile ID
          const profileSearchResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/?filter=equals(email,"${leadCapture.email}")`, {
            method: "GET",
            headers: this.headers
          });

          if (profileSearchResponse.ok) {
            const searchResult = await profileSearchResponse.json();
            if (searchResult.data && searchResult.data.length > 0) {
              profileId = searchResult.data[0].id;
              console.log("Using existing Klaviyo profile for lead capture:", profileId);
            }
          }
        } else {
          const errorText = await profileResponse.text();
          console.error("Failed to create lead capture profile:", profileResponse.status, errorText);
          return false;
        }
      } else {
        const profileResult = await profileResponse.json();
        profileId = profileResult.data.id;
      }

      if (!profileId) {
        console.error("Failed to get profile ID for lead capture");
        return false;
      }

      // Send freebie download event
      const eventData = {
        type: "event",
        attributes: {
          profile: {
            data: {
              type: "profile",
              id: profileId
            }
          },
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: "Freebie Download"
              }
            }
          },
          properties: {
            freebie_title: freebieTitle,
            freebie_id: leadCapture.freebieId,
            download_date: new Date().toISOString(),
            top_of_funnel_nurture: true,
            lead_capture_id: leadCapture.id,
            ip_address: leadCapture.ipAddress,
            user_agent: leadCapture.userAgent,
            referrer_url: leadCapture.referrerUrl,
          }
        }
      };

      const eventResponse = await fetch(`${KLAVIYO_BASE_URL}/events/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: eventData })
      });

      if (!eventResponse.ok) {
        const errorText = await eventResponse.text();
        console.error("Failed to send freebie download event:", eventResponse.status, errorText);
        // Continue anyway since profile was created/updated
      }

      // Add to nurture list (App Signups list)
      const addToListResponse = await fetch(`${KLAVIYO_BASE_URL}/profile-subscription-bulk-create-jobs/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              list_id: KLAVIYO_APP_SIGNUPS_LIST_ID,
              subscriptions: [
                {
                  email: leadCapture.email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED"
                      }
                    }
                  }
                }
              ]
            }
          }
        })
      });

      if (!addToListResponse.ok) {
        const errorText = await addToListResponse.text();
        console.error("Failed to add lead to nurture list:", addToListResponse.status, errorText);
        // Continue anyway since profile was created/updated
      }

      console.log("Lead capture successfully synced to Klaviyo");
      return true;
    } catch (error) {
      console.error("Error syncing lead capture to Klaviyo:", error);
      return false;
    }
  }

  async updateMarketingPreferences(email: string, preferences: { emailMarketing: boolean; smsMarketing: boolean }): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !email) {
      console.error("Klaviyo API key not configured or email missing");
      return false;
    }

    try {
      // First, get the profile ID
      const profileSearchResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/?filter=equals(email,"${email}")`, {
        method: "GET",
        headers: this.headers
      });

      if (!profileSearchResponse.ok) {
        console.error("Failed to search for profile:", profileSearchResponse.status);
        return false;
      }

      const profileData = await profileSearchResponse.json();
      if (!profileData.data || profileData.data.length === 0) {
        console.error("Profile not found for email:", email);
        return false;
      }

      const profileId = profileData.data[0].id;

      // Update the profile with marketing preferences
      const updateResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          data: {
            type: "profile",
            id: profileId,
            attributes: {
              properties: {
                marketing_opt_in: preferences.emailMarketing,
                sms_marketing_opt_in: preferences.smsMarketing,
                marketing_preferences_updated_at: new Date().toISOString()
              }
            }
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update marketing preferences in Klaviyo:", updateResponse.status, errorText);
        return false;
      }

      // Handle email subscription status
      if (preferences.emailMarketing) {
        // Subscribe to email marketing
        const subscribeResponse = await fetch(`${KLAVIYO_BASE_URL}/profile-subscription-bulk-create-jobs/`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({
            data: {
              type: "profile-subscription-bulk-create-job",
              attributes: {
                profiles: {
                  data: [{
                    type: "profile",
                    attributes: {
                      email: email,
                      subscriptions: {
                        email: {
                          marketing: {
                            consent: "SUBSCRIBED"
                          }
                        }
                      }
                    }
                  }]
                }
              }
            }
          })
        });

        if (!subscribeResponse.ok) {
          console.error("Failed to subscribe to email marketing:", subscribeResponse.status);
        }
      } else {
        // Unsubscribe from email marketing
        const unsubscribeResponse = await fetch(`${KLAVIYO_BASE_URL}/profile-subscription-bulk-delete-jobs/`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({
            data: {
              type: "profile-subscription-bulk-delete-job",
              attributes: {
                profiles: {
                  data: [{
                    type: "profile",
                    attributes: {
                      email: email,
                      subscriptions: {
                        email: {
                          marketing: {
                            consent: "UNSUBSCRIBED"
                          }
                        }
                      }
                    }
                  }]
                }
              }
            }
          })
        });

        if (!unsubscribeResponse.ok) {
          console.error("Failed to unsubscribe from email marketing:", unsubscribeResponse.status);
        }
      }

      console.log("Marketing preferences updated successfully in Klaviyo");
      return true;
    } catch (error) {
      console.error("Error updating marketing preferences in Klaviyo:", error);
      return false;
    }
  }
}

export const klaviyoService = new KlaviyoService();