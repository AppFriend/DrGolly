// Referral tracking utility for affiliate attribution
// Uses cookies and session storage for reliable tracking across the purchase flow

const REFERRAL_COOKIE_NAME = 'drgolly_referral';
const REFERRAL_SESSION_KEY = 'drgolly_referral_session';
const REFERRAL_EXPIRY_DAYS = 30; // 30 day attribution window

export interface ReferralData {
  affiliateCode: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  landingPage: string;
}

// Set referral tracking when user arrives via affiliate link
export function setReferralTracking(affiliateCode: string, landingPage: string = '/home') {
  const referralData: ReferralData = {
    affiliateCode,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    landingPage
  };

  // Store in cookie for persistence across sessions
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS);
  
  document.cookie = `${REFERRAL_COOKIE_NAME}=${JSON.stringify(referralData)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  
  // Store in session storage for current session
  sessionStorage.setItem(REFERRAL_SESSION_KEY, JSON.stringify(referralData));
  
  console.log('Referral tracking set:', { affiliateCode, landingPage });
}

// Get current referral data
export function getReferralData(): ReferralData | null {
  // First check session storage (most recent)
  const sessionData = sessionStorage.getItem(REFERRAL_SESSION_KEY);
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      console.error('Error parsing session referral data:', e);
    }
  }

  // Fallback to cookie
  const cookies = document.cookie.split(';');
  const referralCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${REFERRAL_COOKIE_NAME}=`)
  );
  
  if (referralCookie) {
    try {
      const cookieValue = referralCookie.split('=')[1];
      const referralData = JSON.parse(decodeURIComponent(cookieValue));
      
      // Check if referral is still valid (within attribution window)
      const daysSinceReferral = (Date.now() - referralData.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceReferral <= REFERRAL_EXPIRY_DAYS) {
        return referralData;
      } else {
        // Expired, clear it
        clearReferralTracking();
      }
    } catch (e) {
      console.error('Error parsing cookie referral data:', e);
    }
  }

  return null;
}

// Clear referral tracking
export function clearReferralTracking() {
  // Clear cookie
  document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  // Clear session storage
  sessionStorage.removeItem(REFERRAL_SESSION_KEY);
}

// Check if user came from affiliate link and set tracking
export function handleAffiliateReferral() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    setReferralTracking(refCode, window.location.pathname);
    
    // Clean URL by removing ref parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ref');
    window.history.replaceState({}, '', newUrl.toString());
    
    return refCode;
  }
  
  return null;
}

// Get referral data for API calls (e.g., during checkout)
export function getReferralForPurchase(): { affiliateCode?: string } {
  const referralData = getReferralData();
  return referralData ? { affiliateCode: referralData.affiliateCode } : {};
}