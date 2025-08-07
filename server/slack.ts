// Slack webhook integration for Dr. Golly notifications
const SLACK_SIGNUP_WEBHOOK = process.env.SLACK_SIGNUP_WEBHOOK;
const SLACK_PAYMENT_WEBHOOK = process.env.SLACK_WEBHOOK_PAYMENT2;

if (!SLACK_SIGNUP_WEBHOOK) {
  console.warn("Slack signup integration disabled - SLACK_SIGNUP_WEBHOOK not configured");
} else {
  console.log(`Slack signup webhook integration enabled`);
}

if (!SLACK_PAYMENT_WEBHOOK) {
  console.warn("Slack payment integration disabled - SLACK_PAYMENT_WEBHOOK not configured");
} else {
  console.log(`Slack payment webhook integration enabled`);
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
  private signupWebhookUrl: string;
  private paymentWebhookUrl: string;

  private constructor() {
    this.signupWebhookUrl = SLACK_SIGNUP_WEBHOOK;
    this.paymentWebhookUrl = SLACK_PAYMENT_WEBHOOK;
  }

  static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService();
    }
    return SlackNotificationService.instance;
  }

  private async sendWebhookMessage(payload: any, webhookType: 'signup' | 'payment' = 'signup'): Promise<boolean> {
    try {
      const webhookUrl = webhookType === 'signup' ? this.signupWebhookUrl : this.paymentWebhookUrl;
      
      console.log(`Attempting to send ${webhookType} webhook to:`, webhookUrl ? 'URL configured' : 'URL not configured');
      
      if (!webhookUrl) {
        console.log(`Slack ${webhookType} webhook not configured`);
        return false;
      }

      console.log(`Sending ${webhookType} webhook payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`${webhookType} webhook response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Slack ${webhookType} webhook failed:`, response.status, response.statusText, errorText);
        return false;
      }

      console.log(`Slack ${webhookType} webhook message sent successfully`);
      return true;
    } catch (error) {
      console.error('Failed to send Slack webhook message:', error);
      return false;
    }
  }

  async sendSignupNotification(signupData: {
    name: string;
    email: string;
    phoneNumber?: string;
    userRole?: string;
    marketingOptIn: boolean;
    smsMarketingOptIn?: boolean;
    primaryConcerns: string[];
    signupSource?: string;
    signupType?: 'new_customer' | 'existing_customer_reactivation' | 'enhanced_signup';
    previousCourses?: string[];
    coursePurchased?: string;
  }): Promise<boolean> {
    try {
      const concernsText = signupData.primaryConcerns.length > 0 
        ? signupData.primaryConcerns.join(', ')
        : 'None selected';

      const marketingStatus = signupData.marketingOptIn ? '✅ Opted In' : '❌ Not Opted In';
      
      // Determine signup type display
      let signupTypeText = '✨ New Customer';
      if (signupData.signupType === 'existing_customer_reactivation') {
        signupTypeText = '🔄 Existing Customer (Profile reactivation)';
      } else if (signupData.signupType === 'enhanced_signup') {
        signupTypeText = '⭐ Enhanced Signup (3-Step)';
      }

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

      // Add enhanced signup fields if available
      if (signupData.phoneNumber) {
        fields.push({
          type: 'mrkdwn',
          text: `*Phone Number:*\n${signupData.phoneNumber}`
        });
      }

      if (signupData.userRole) {
        fields.push({
          type: 'mrkdwn',
          text: `*Role:*\n${signupData.userRole}`
        });
      }

      if (signupData.smsMarketingOptIn !== undefined) {
        const smsStatus = signupData.smsMarketingOptIn ? '✅ Opted In' : '❌ Not Opted In';
        fields.push({
          type: 'mrkdwn',
          text: `*SMS Marketing:*\n${smsStatus}`
        });
      }

      // Add previous courses field only for existing customer reactivations
      if (signupData.signupType === 'existing_customer_reactivation' && signupData.previousCourses && signupData.previousCourses.length > 0) {
        const coursesText = signupData.previousCourses.join(', ');
        fields.push({
          type: 'mrkdwn',
          text: `*Previous Courses:*\n${coursesText}`
        });
      }

      // Add course purchased field for public checkout users
      if (signupData.signupSource === 'public checkout web>app' && signupData.coursePurchased) {
        fields.push({
          type: 'mrkdwn',
          text: `*Course Purchased:*\n${signupData.coursePurchased}`
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

      return await this.sendWebhookMessage(payload, 'signup');
    } catch (error) {
      console.error('Failed to send Slack signup notification:', error);
      return false;
    }
  }

  async sendPaymentNotification(paymentData: {
    name: string;
    email: string;
    purchaseDetails: string;
    paymentAmount: string;
    downgradeDate?: string;
    promotionalCode?: string;
    discountAmount?: string;
  }): Promise<boolean> {
    try {
      // Determine the header title based on purchase details
      let headerTitle = '💰 Payment Transaction';
      if (paymentData.purchaseDetails.includes('Single Course Purchase')) {
        headerTitle = '💰 Single Course Purchase';
      } else if (paymentData.purchaseDetails.includes('→ Gold Plan Upgrade')) {
        headerTitle = '💰 Plan Upgrade (Free → Gold)';
      } else if (paymentData.purchaseDetails.includes('→ Free Plan Downgrade')) {
        headerTitle = '💰 Plan Downgrade (Gold → Free)';
      } else if (paymentData.purchaseDetails.includes('Cart Checkout')) {
        headerTitle = '💰 Cart Checkout';
      }

      const fields = [
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
          text: `*Details:*\n${paymentData.purchaseDetails}`
        },
        {
          type: 'mrkdwn',
          text: `*Amount:*\n${paymentData.paymentAmount}`
        },
        {
          type: 'mrkdwn',
          text: `*Promotional Code:*\n${paymentData.promotionalCode || 'N/A'}`
        },
        {
          type: 'mrkdwn',
          text: `*Discount Amount:*\n${paymentData.discountAmount || 'N/A'}`
        }
      ];

      // Add downgrade date if provided
      if (paymentData.downgradeDate) {
        fields.push({
          type: 'mrkdwn',
          text: `*Downgrade Date:*\n${paymentData.downgradeDate}`
        });
      }

      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: headerTitle
            }
          },
          {
            type: 'section',
            fields: fields
          }
        ],
        text: `${headerTitle}: ${paymentData.name} (${paymentData.email}) - ${paymentData.paymentAmount}`
      };

      return await this.sendWebhookMessage(payload, 'payment');
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