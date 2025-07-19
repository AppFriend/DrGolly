// User flow logic for checkout-new system
import { apiRequest } from '@/lib/queryClient';

export interface UserFlowResult {
  flowType: 'new-user' | 'existing-user' | 'guest';
  redirectTo: '/complete' | '/home' | '/checkout-success';
  userExists: boolean;
  message: string;
}

export async function detectUserFlow(email: string): Promise<UserFlowResult> {
  try {
    // Check if email exists in system
    const response = await apiRequest('POST', '/api/checkout-new/check-email', {
      email
    });
    
    const data = await response.json();
    
    if (data.exists) {
      return {
        flowType: 'existing-user',
        redirectTo: '/home',
        userExists: true,
        message: 'Welcome back! Redirecting to your dashboard...'
      };
    } else {
      return {
        flowType: 'new-user',
        redirectTo: '/complete',
        userExists: false,
        message: 'Welcome! Please complete your profile setup...'
      };
    }
  } catch (error) {
    console.error('User flow detection error:', error);
    // Default to new user flow on error
    return {
      flowType: 'new-user',
      redirectTo: '/complete',
      userExists: false,
      message: 'Welcome! Please complete your profile setup...'
    };
  }
}

export async function createAccountWithPurchase(
  customerDetails: any,
  paymentIntentId: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/checkout-new/create-account', {
      customerDetails,
      paymentIntentId,
      productId
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: 'Account created successfully!'
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to create account'
      };
    }
  } catch (error) {
    console.error('Account creation error:', error);
    return {
      success: false,
      message: 'Account creation failed'
    };
  }
}

export async function addPurchaseToExistingUser(
  email: string,
  paymentIntentId: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/checkout-new/add-purchase', {
      email,
      paymentIntentId,
      productId
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: 'Purchase added to your account!'
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to add purchase'
      };
    }
  } catch (error) {
    console.error('Purchase addition error:', error);
    return {
      success: false,
      message: 'Failed to add purchase to account'
    };
  }
}