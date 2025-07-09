import { toast } from "@/hooks/use-toast";

// Copy protection utility
export class CopyProtection {
  private static instance: CopyProtection;
  private isEnabled = true;

  private constructor() {
    this.initializeCopyProtection();
  }

  static getInstance(): CopyProtection {
    if (!CopyProtection.instance) {
      CopyProtection.instance = new CopyProtection();
    }
    return CopyProtection.instance;
  }

  private initializeCopyProtection() {
    // Only prevent copy keyboard shortcuts and context menu
    document.addEventListener('keydown', this.preventCopyShortcuts);
    document.addEventListener('contextmenu', this.preventContextMenu);
    
    // Prevent drag and drop of content
    document.addEventListener('dragstart', this.preventDragStart);
    
    // Prevent print screen and developer tools
    document.addEventListener('keydown', this.preventScreenCapture);
  }

  private preventSelection = (e: Event) => {
    try {
      const target = e.target as HTMLElement;
      
      // Only prevent selection on actual content text, not on interactive elements
      if (this.isEnabled && this.isProtectedContent(target) && 
          !this.isInteractiveElement(target)) {
        e.preventDefault();
        this.showProtectionMessage();
        return false;
      }
    } catch (error) {
      console.warn('Copy protection selection error:', error);
    }
  };

  private preventCopyShortcuts = (e: KeyboardEvent) => {
    try {
      if (!this.isEnabled) return;

      const target = e.target as HTMLElement;
      if (this.isProtectedContent(target)) {
        // Prevent Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X
        if (e.ctrlKey && ['c', 'a', 'v', 'x'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          this.showProtectionMessage();
          return false;
        }
        
        // Prevent F12 (Developer Tools)
        if (e.key === 'F12') {
          e.preventDefault();
          this.showProtectionMessage();
          return false;
        }
        
        // Prevent Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          this.showProtectionMessage();
          return false;
        }
      }
    } catch (error) {
      console.warn('Copy protection keyboard error:', error);
    }
  };

  private preventContextMenu = (e: MouseEvent) => {
    try {
      const target = e.target as HTMLElement;
      
      // Only prevent context menu on actual content, not interactive elements
      if (this.isEnabled && this.isProtectedContent(target) && 
          !this.isInteractiveElement(target)) {
        e.preventDefault();
        this.showProtectionMessage();
        return false;
      }
    } catch (error) {
      console.warn('Copy protection context menu error:', error);
    }
  };

  private preventDragStart = (e: DragEvent) => {
    try {
      const target = e.target as HTMLElement;
      if (this.isEnabled && this.isProtectedContent(target)) {
        e.preventDefault();
        this.showProtectionMessage();
        return false;
      }
    } catch (error) {
      console.warn('Copy protection drag error:', error);
    }
  };

  private preventScreenCapture = (e: KeyboardEvent) => {
    if (!this.isEnabled) return;

    // Prevent Print Screen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      this.showProtectionMessage();
      return false;
    }
  };

  private isProtectedContent(element: HTMLElement): boolean {
    // Check if element is a valid HTML element and has the closest method
    if (!element || typeof element.closest !== 'function') {
      return false;
    }
    
    // Check if element is within course content area
    return element.closest('.course-content') !== null ||
           element.closest('.course-module') !== null ||
           element.closest('.course-chapter') !== null ||
           element.closest('[data-protected="true"]') !== null;
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    // Check if element is a valid HTML element and has the closest method
    if (!element || typeof element.closest !== 'function') {
      return false;
    }
    
    // Allow interaction with buttons, links, inputs, and other interactive elements
    const interactiveSelectors = [
      'button', 'a', 'input', 'textarea', 'select', 'option',
      '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
      '.btn', '.button', '.link', '.collapsible-trigger',
      '[data-collapsible="trigger"]', '[data-collapsible="content"]'
    ];
    
    // Check if element itself is interactive
    const tagName = element.tagName.toLowerCase();
    if (interactiveSelectors.includes(tagName)) {
      return true;
    }
    
    // Check if element is within an interactive parent
    for (const selector of interactiveSelectors) {
      if (element.closest(selector)) {
        return true;
      }
    }
    
    return false;
  }

  private showProtectionMessage() {
    toast({
      title: "Content Protection",
      description: "Our content is generated by medical professionals and is copyrighted for the use of our members, which is why we don't allow copy and paste.",
      variant: "destructive",
    });
  }

  // Method to enable/disable protection (for admin users)
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Method to protect specific elements
  public protectElement(element: HTMLElement) {
    element.setAttribute('data-protected', 'true');
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.msUserSelect = 'none';
    element.style.webkitTouchCallout = 'none';
    element.style.webkitTapHighlightColor = 'transparent';
  }

  // Clean up event listeners
  public destroy() {
    document.removeEventListener('keydown', this.preventCopyShortcuts);
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('dragstart', this.preventDragStart);
    document.removeEventListener('keydown', this.preventScreenCapture);
  }
}

// CSS styles for copy protection
export const copyProtectionStyles = `
  /* Only prevent selection on actual content paragraphs and text, not interactive elements */
  .course-content p,
  .course-content span,
  .course-content div:not([role]),
  .course-module p,
  .course-module span,
  .course-chapter p,
  .course-chapter span,
  [data-protected="true"] p,
  [data-protected="true"] span {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  /* Allow selection on interactive elements */
  .course-content button,
  .course-content a,
  .course-content input,
  .course-content [role="button"],
  .course-content [data-collapsible],
  .course-module button,
  .course-module a,
  .course-module input,
  .course-module [role="button"],
  .course-chapter button,
  .course-chapter a,
  .course-chapter input,
  .course-chapter [role="button"],
  .course-chapter [data-collapsible] {
    -webkit-user-select: auto;
    -moz-user-select: auto;
    -ms-user-select: auto;
    user-select: auto;
    -webkit-touch-callout: auto;
  }

  /* Prevent highlighting on mobile for text content only */
  .course-content p::selection,
  .course-module p::selection,
  .course-chapter p::selection,
  [data-protected="true"] p::selection {
    background: transparent;
  }

  .course-content p::-moz-selection,
  .course-module p::-moz-selection,
  .course-chapter p::-moz-selection,
  [data-protected="true"] p::-moz-selection {
    background: transparent;
  }
`;