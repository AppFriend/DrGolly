import { User } from "@shared/schema";

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_LIST_ID = "XBRBuN"; // Superapp users list ID
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

  async createOrUpdateProfile(user: User): Promise<boolean> {
    if (!KLAVIYO_API_KEY) {
      console.error("Klaviyo API key not configured");
      return false;
    }

    try {
      const profile: KlaviyoProfile = {
        type: "profile",
        attributes: {
          email: user.email || undefined,
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
          properties: {
            signup_source: "Dr Golly App",
            user_id: user.id,
            signup_date: new Date().toISOString(),
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: profile })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create Klaviyo profile:", response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log("Klaviyo profile created successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("Error creating Klaviyo profile:", error);
      return false;
    }
  }

  async addToSuperAppList(user: User): Promise<boolean> {
    if (!KLAVIYO_API_KEY || !user.email) {
      console.error("Klaviyo API key not configured or user email missing");
      return false;
    }

    try {
      const subscription = {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [{
              type: "profile",
              attributes: {
                email: user.email,
                subscriptions: {
                  email: {
                    marketing: {
                      consent: "SUBSCRIBED" as const
                    }
                  }
                }
              }
            }]
          }
        }
      };

      const response = await fetch(`${KLAVIYO_BASE_URL}/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ data: subscription })
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

  async syncUserToKlaviyo(user: User): Promise<boolean> {
    try {
      // First create or update the profile
      const profileCreated = await this.createOrUpdateProfile(user);
      
      // Then add to superapp list if profile was created successfully
      if (profileCreated && user.email) {
        await this.addToSuperAppList(user);
      }

      return profileCreated;
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
      await this.createOrUpdateProfile(user);

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
      await this.createOrUpdateProfile(user);

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
}

export const klaviyoService = new KlaviyoService();