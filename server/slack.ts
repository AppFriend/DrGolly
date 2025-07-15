// Slack webhook integration for Dr. Golly notifications
const SLACK_WEBHOOK_URL = process.env.SLACK_SIGNUP_WEBHOOK;

if (!SLACK_WEBHOOK_URL) {
  console.warn("Slack integration disabled - SLACK_SIGNUP_WEBHOOK not configured");
} else {
  console.log(`Slack webhook integration enabled`);
}

export interface SlackNotificationData {
  type: 'signup' | 'payment' | 'support' | 'admin';
  user: {
    name: string;
    email: string;
    id?: string;
  };
  data: any;
}

export class SlackNotificationService {
  private static instance: SlackNotificationService;
  private webhookUrl: string;

  private constructor() {
    this.webhookUrl = SLACK_WEBHOOK_URL;
  }

  static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService();
    }
    return SlackNotificationService.instance;
  }

  private async sendWebhookMessage(payload: any): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Slack webhook not configured');
        return false;
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Slack webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('Slack webhook message sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Slack webhook message:', error);
      return false;
    }
  }

  async sendSignupNotification(signupData: {
    name: string;
    email: string;
    marketingOptIn: boolean;
    primaryConcerns: string[];
    signupSource?: string;
    signupType?: 'new_customer' | 'existing_customer_reactivation';
    previousCourses?: string[];
  }): Promise<boolean> {
    try {
      const concernsText = signupData.primaryConcerns.length > 0 
        ? signupData.primaryConcerns.join(', ')
        : 'None selected';

      const marketingStatus = signupData.marketingOptIn ? '✅ Opted In' : '❌ Not Opted In';
      
      // Determine signup type display
      const signupTypeText = signupData.signupType === 'existing_customer_reactivation' 
        ? '🔄 Existing Customer (Profile reactivation)'
        : '✨ New Customer';

      // Build fields array dynamically
      const fields = [
        {
          type: 'mrkdwn',
          text: `*Name:*\n${signupData.name}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${signupData.email}`
        },
        {
          type: 'mrkdwn',
          text: `*Signup Source:*\n${signupData.signupSource || 'Direct'}`
        },
        {
          type: 'mrkdwn',
          text: `*Marketing Opt-in:*\n${marketingStatus}`
        },
        {
          type: 'mrkdwn',
          text: `*App Preferences:*\n${concernsText}`
        },
        {
          type: 'mrkdwn',
          text: `*Signup Type:*\n${signupTypeText}`
        }
      ];

      // Add previous courses field only for existing customer reactivations
      if (signupData.signupType === 'existing_customer_reactivation' && signupData.previousCourses && signupData.previousCourses.length > 0) {
        const coursesText = signupData.previousCourses.join(', ');
        fields.push({
          type: 'mrkdwn',
          text: `*Previous Courses:*\n${coursesText}`
        });
      }

      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 New User Signup'
            }
          },
          {
            type: 'section',
            fields: fields
          }
        ],
        text: `New user signup: ${signupData.name} (${signupData.email}) - ${signupTypeText}`
      };

      return await this.sendWebhookMessage(payload);
    } catch (error) {
      console.error('Failed to send Slack signup notification:', error);
      return false;
    }
  }

  async sendPaymentNotification(paymentData: {
    name: string;
    email: string;
    amount: number;
    courseName?: string;
    subscriptionTier?: string;
    paymentMethod?: string;
  }): Promise<boolean> {
    try {
      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '💰 Payment Received'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Customer:*\n${paymentData.name}`
              },
              {
                type: 'mrkdwn',
                text: `*Email:*\n${paymentData.email}`
              },
              {
                type: 'mrkdwn',
                text: `*Amount:*\n$${(paymentData.amount / 100).toFixed(2)}`
              },
              {
                type: 'mrkdwn',
                text: `*Item:*\n${paymentData.courseName || paymentData.subscriptionTier || 'Unknown'}`
              }
            ]
          }
        ],
        text: `Payment received: $${(paymentData.amount / 100).toFixed(2)} from ${paymentData.name}`
      };

      return await this.sendWebhookMessage(payload);
    } catch (error) {
      console.error('Failed to send Slack payment notification:', error);
      return false;
    }
  }

  async sendSupportNotification(supportData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    userTier?: string;
  }): Promise<boolean> {
    try {
      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🆘 Support Request'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${supportData.name}`
              },
              {
                type: 'mrkdwn',
                text: `*Email:*\n${supportData.email}`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${supportData.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*User Tier:*\n${supportData.userTier || 'Free'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${supportData.message}`
            }
          }
        ],
        text: `Support request from ${supportData.name}: ${supportData.subject}`
      };

      return await this.sendWebhookMessage(payload);
    } catch (error) {
      console.error('Failed to send Slack support notification:', error);
      return false;
    }
  }

  async sendAdminNotification(adminData: {
    action: string;
    adminUser: string;
    targetUser?: string;
    details: string;
  }): Promise<boolean> {
    try {
      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔧 Admin Action'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Admin:*\n${adminData.adminUser}`
              },
              {
                type: 'mrkdwn',
                text: `*Action:*\n${adminData.action}`
              },
              {
                type: 'mrkdwn',
                text: `*Target:*\n${adminData.targetUser || 'System'}`
              },
              {
                type: 'mrkdwn',
                text: `*Details:*\n${adminData.details}`
              }
            ]
          }
        ],
        text: `Admin action: ${adminData.action} by ${adminData.adminUser}`
      };

      return await this.sendWebhookMessage(payload);
    } catch (error) {
      console.error('Failed to send Slack admin notification:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Slack webhook not configured');
        return false;
      }

      const testPayload = {
        text: '🧪 Slack webhook test successful!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *Slack Webhook Test*\n\nThe Dr. Golly notification system is working correctly!'
            }
          }
        ]
      };

      return await this.sendWebhookMessage(testPayload);
    } catch (error) {
      console.error('Slack webhook test failed:', error);
      return false;
    }
  }
}

export const slackNotificationService = SlackNotificationService.getInstance();