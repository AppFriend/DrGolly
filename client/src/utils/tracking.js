/**
 * Centralized Tracking & Analytics Utility
 * Handles Google Ads, Pinterest, TikTok, LinkedIn, Meta, and Reddit tracking
 * @typedef {Object} PurchaseData
 * @property {number} value
 * @property {string} currency
 * @property {string} transactionId
 * @property {string} eventId
 */

// Initialize tracking flags to prevent duplicate loading
const trackingLoaded = {
  google: false,
  pinterest: false,
  tiktok: false,
  linkedin: false,
  meta: false,
  reddit: false
};

/**
 * Google Ads Tracking
 */
export const initGoogleAds = () => {
  if (trackingLoaded.google || window.gtag) return;
  
  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-389499988';
  document.head.appendChild(script);
  
  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'AW-389499988');
  
  trackingLoaded.google = true;
};

export const trackGoogleSignUp = (callback) => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-389499988/OswFCJr7icsaENSY3bkB',
      event_callback: callback,
    });
  }
};

export const trackGooglePurchase = (value = 100.0, currency = 'AUD', transactionId = '') => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-389499988/Oe6QCJmi5P8BENSY3bkB',
      value: value,
      currency: currency,
      transaction_id: transactionId,
    });
  }
};

/**
 * Pinterest Tracking
 */
export const initPinterest = (userEmail = '') => {
  if (trackingLoaded.pinterest || window.pintrk) return;
  
  !function(e){if(!window.pintrk){window.pintrk = function () {
  window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
  
  window.pintrk('load', '2612380559141', {em: userEmail});
  window.pintrk('page');
  
  trackingLoaded.pinterest = true;
};

export const trackPinterestSignUp = (eventId = 'eventId0001') => {
  if (window.pintrk) {
    window.pintrk('track', 'signup', {
      event_id: eventId,
      lead_type: 'App'
    });
  }
};

export const trackPinterestPurchase = (value = 100, currency = 'USD', eventId = 'eventId0001') => {
  if (window.pintrk) {
    window.pintrk('track', 'checkout', {
      event_id: eventId,
      value: value,
      order_quantity: 1,
      currency: currency
    });
  }
};

/**
 * TikTok Tracking
 */
export const initTikTok = () => {
  if (trackingLoaded.tiktok || window.ttq) return;
  
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;
    var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){
      var i="https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,
      ttq._t=ttq._t||{},ttq._t[e]=+new Date,
      ttq._o=ttq._o||{},ttq._o[e]=n||{};
      n=document.createElement("script");
      n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;
      e=document.getElementsByTagName("script")[0];
      e.parentNode.insertBefore(n,e)
    };
    ttq.load('CCO0N03C77U3QS7T8KLG');
    ttq.page();
  }(window, document, 'ttq');
  
  trackingLoaded.tiktok = true;
};

export const trackTikTokEvent = (eventName, eventData = {}) => {
  if (window.ttq) {
    window.ttq.track(eventName, eventData);
  }
};

/**
 * LinkedIn Tracking
 */
export const initLinkedIn = () => {
  if (trackingLoaded.linkedin || window.lintrk) return;
  
  window._linkedin_partner_id = "3257164";
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
  
  (function(l) {
  if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
  window.lintrk.q=[]}
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);})(window.lintrk);
  
  trackingLoaded.linkedin = true;
};

export const trackLinkedInEvent = (eventType, eventData = {}) => {
  if (window.lintrk) {
    window.lintrk('track', eventType, eventData);
  }
};

/**
 * Meta (Facebook) Tracking
 */
export const initMeta = () => {
  if (trackingLoaded.meta || window.fbq) return;
  
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  
  window.fbq('init', '1778915552268946'); 
  window.fbq('track', 'PageView');
  
  trackingLoaded.meta = true;
};

export const trackMetaEvent = (eventName, eventData = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, eventData);
  }
};

/**
 * Reddit Tracking
 */
export const initReddit = () => {
  if (trackingLoaded.reddit || window.rdt) return;
  
  !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
  
  window.rdt('init','a2_ewlw2m7ljx7d');
  window.rdt('track', 'PageVisit');
  
  trackingLoaded.reddit = true;
};

export const trackRedditEvent = (eventName, eventData = {}) => {
  if (window.rdt) {
    window.rdt('track', eventName, eventData);
  }
};

/**
 * Universal Initialization
 * Call this once in your app's root component
 */
export const initAllTracking = (userEmail = '') => {
  // Only initialize if running in browser
  if (typeof window === 'undefined') return;
  
  try {
    initGoogleAds();
    initPinterest(userEmail);
    initTikTok();
    initLinkedIn();
    initMeta();
    initReddit();
  } catch (error) {
    console.warn('Tracking initialization error:', error);
  }
};

/**
 * Track page views for SPA navigation
 * Call this on route changes
 */
export const trackPageView = (path = window.location.pathname) => {
  try {
    // Google Analytics
    if (window.gtag) {
      window.gtag('config', 'AW-389499988', {
        page_path: path
      });
    }
    
    // Pinterest
    if (window.pintrk) {
      window.pintrk('page');
    }
    
    // TikTok
    if (window.ttq) {
      window.ttq.page();
    }
    
    // Meta
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
    
    // Reddit
    if (window.rdt) {
      window.rdt('track', 'PageVisit');
    }
  } catch (error) {
    console.warn('Page view tracking error:', error);
  }
};

/**
 * Comprehensive event tracking for sign-ups
 */
export const trackSignUp = (eventData = {}) => {
  try {
    trackGoogleSignUp(eventData.callback);
    trackPinterestSignUp(eventData.eventId);
    trackTikTokEvent('CompleteRegistration', eventData);
    trackLinkedInEvent('signup', eventData);
    trackMetaEvent('CompleteRegistration', eventData);
    trackRedditEvent('SignUp', eventData);
  } catch (error) {
    console.warn('Sign-up tracking error:', error);
  }
};

/**
 * Comprehensive event tracking for purchases
 */
export const trackPurchase = (purchaseData = {}) => {
  const {
    value = 100,
    currency = 'AUD',
    transactionId = '',
    eventId = 'purchase_' + Date.now()
  } = purchaseData;
  
  try {
    trackGooglePurchase(value, currency, transactionId);
    trackPinterestPurchase(value, currency, eventId);
    trackTikTokEvent('CompletePayment', purchaseData);
    trackLinkedInEvent('purchase', purchaseData);
    trackMetaEvent('Purchase', purchaseData);
    trackRedditEvent('Purchase', purchaseData);
  } catch (error) {
    console.warn('Purchase tracking error:', error);
  }
};