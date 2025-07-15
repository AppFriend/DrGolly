import { WebClient } from "@slack/web-api";

// Allow the app to run without Slack credentials in development
const SLACK_ENABLED = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C08D5C0UEHW';

if (!SLACK_ENABLED) {
  console.warn("Slack integration disabled - SLACK_BOT_TOKEN not configured");
} else {
  console.log(`Slack integration enabled - Channel: ${SLACK_CHANNEL_ID}`);
}

const slack = SLACK_ENABLED ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

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
  private client: WebClient;
  private defaultChannel: string;

  private constructor() {
    this.client = slack;
    this.defaultChannel = SLACK_CHANNEL_ID;
  }

  static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService();
    }
    return SlackNotificationService.instance;
  }

  async sendSignupNotification(signupData: {
    name: string;
    email: string;
    marketingOptIn: boolean;
    primaryConcerns: string[];
    userRole: string;
    phoneNumber?: string;
    signupSource?: string;
    signupType?: 'new_customer' | 'existing_customer_reactivation';
  }): Promise<boolean> {
    try {
      // Return early if Slack is not enabled
      if (!SLACK_ENABLED || !this.client) {
        console.log('Slack notification skipped - not configured');
        return false;
      }

      const concernsText = signupData.primaryConcerns.length > 0 
        ? signupData.primaryConcerns.join(', ')
        : 'None selected';

      const marketingStatus = signupData.marketingOptIn ? '✅ Opted In' : '❌ Not Opted In';
      
      // Determine signup type display
      const signupTypeText = signupData.signupType === 'existing_customer_reactivation' 
        ? '🔄 Existing Customer (Profile reactivation)'
        : '✨ New Customer';

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 New User Signup'
          }
        },
        {
          type: 'section',
          fields: [
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
              text: `*Signup Type:*\n${signupTypeText}`
            },
            {
              type: 'mrkdwn',
              text: `*Marketing Opt-in:*\n${marketingStatus}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*User Role:*\n${signupData.userRole || 'Not specified'}`
            },
            {
              type: 'mrkdwn',
              text: `*App Preferences:*\n${concernsText}`
            },
            {
              type: 'mrkdwn',
              text: `*Phone:*\n${signupData.phoneNumber || 'Not provided'}`
            }
          ]
        }
      ];

      if (signupData.signupSource) {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📱 Source: ${signupData.signupSource}`
            }
          ]
        });
      }

      const result = await this.client.chat.postMessage({
        channel: this.defaultChannel,
        blocks,
        text: `New user signup: ${signupData.name} (${signupData.email})`
      });

      console.log('Slack signup notification sent successfully:', result.ts);
      return true;
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
      const blocks = [
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
      ];

      const result = await this.client.chat.postMessage({
        channel: this.defaultChannel,
        blocks,
        text: `Payment received: $${(paymentData.amount / 100).toFixed(2)} from ${paymentData.name}`
      });

      console.log('Slack payment notification sent successfully:', result.ts);
      return true;
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
      const blocks = [
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
      ];

      const result = await this.client.chat.postMessage({
        channel: this.defaultChannel,
        blocks,
        text: `Support request from ${supportData.name}: ${supportData.subject}`
      });

      console.log('Slack support notification sent successfully:', result.ts);
      return true;
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
      const blocks = [
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
      ];

      const result = await this.client.chat.postMessage({
        channel: this.defaultChannel,
        blocks,
        text: `Admin action: ${adminData.action} by ${adminData.adminUser}`
      });

      console.log('Slack admin notification sent successfully:', result.ts);
      return true;
    } catch (error) {
      console.error('Failed to send Slack admin notification:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      console.log('Slack connection test successful:', result.user);
      return true;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }
}

export const slackNotificationService = SlackNotificationService.getInstance();