import { apiRequest } from "@/lib/queryClient";

interface CartTrackingService {
  startTrackingSession(): void;
  markPurchaseCompleted(): void;
  markCartAbandoned(cartData: any): void;
  cleanupTracking(): void;
}

class CartTrackingServiceImpl implements CartTrackingService {
  private trackingActive = false;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: Date | null = null;
  private lastCartData: any = null;
  private purchaseCompleted = false;
  
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  startTrackingSession(): void {
    if (this.trackingActive) return;
    
    this.trackingActive = true;
    this.sessionStartTime = new Date();
    this.purchaseCompleted = false;
    
    console.log('🛒 Cart tracking session started');
    
    // Set up beforeunload listener for page exit
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Start inactivity timer
    this.resetInactivityTimer();
  }

  markPurchaseCompleted(): void {
    console.log('✅ Purchase completed - disabling cart abandonment tracking');
    this.purchaseCompleted = true;
    this.cleanupTracking();
  }

  markCartAbandoned(cartData: any): void {
    if (!this.trackingActive || this.purchaseCompleted) return;
    
    // Only trigger if cart has items
    if (!cartData || !cartData.length || cartData.length === 0) {
      return;
    }

    console.log('🚪 Cart abandoned - sending event to Klaviyo');
    this.sendAbandonedCartEvent(cartData);
    this.cleanupTracking();
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.purchaseCompleted) return;
    
    // Get current cart data from localStorage or make a quick API call
    const cartDataStr = localStorage.getItem('cartData');
    if (cartDataStr) {
      try {
        const cartData = JSON.parse(cartDataStr);
        this.markCartAbandoned(cartData);
      } catch (error) {
        console.error('Error parsing cart data from localStorage:', error);
      }
    }
  };

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      if (!this.purchaseCompleted && this.lastCartData) {
        console.log('⏰ Cart inactivity timeout reached');
        this.markCartAbandoned(this.lastCartData);
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  private async sendAbandonedCartEvent(cartData: any[]): Promise<void> {
    try {
      // Calculate cart totals
      const cartValue = cartData.reduce((total, item) => total + (item.price * item.quantity), 0);
      const cartCourseCount = cartData.length;
      
      // Transform cart data for Klaviyo
      const cart_items = cartData.map(item => ({
        id: item.itemId?.toString() || item.id?.toString(),
        name: item.name || item.title || 'Unknown Item',
        price: item.price || 0
      }));

      await apiRequest('POST', '/api/klaviyo/track-abandoned-cart', {
        cart_items,
        cart_value: cartValue,
        cart_course_count: cartCourseCount
      });
      
      console.log('✅ Abandoned cart event sent to Klaviyo');
    } catch (error) {
      console.error('❌ Failed to send abandoned cart event:', error);
    }
  }

  updateCartData(cartData: any[]): void {
    this.lastCartData = cartData;
    
    // Update localStorage for beforeunload handler
    localStorage.setItem('cartData', JSON.stringify(cartData));
    
    // Reset inactivity timer when cart is updated
    if (this.trackingActive) {
      this.resetInactivityTimer();
    }
  }

  cleanupTracking(): void {
    this.trackingActive = false;
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    localStorage.removeItem('cartData');
    
    console.log('🧹 Cart tracking cleaned up');
  }
}

// Export singleton instance
export const cartTrackingService = new CartTrackingServiceImpl();