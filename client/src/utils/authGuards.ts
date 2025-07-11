/**
 * Authentication guard utilities to prevent routing issues
 */

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

/**
 * Routes that should be accessible without authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/signup',
  '/login',
  '/landing',
  '/big-baby-public'
];

/**
 * Routes that require authentication
 */
export const PROTECTED_ROUTES = [
  '/home',
  '/courses',
  '/track',
  '/family',
  '/discounts',
  '/manage',
  '/admin',
  '/checkout',
  '/subscription'
];

/**
 * Check if a route is public (accessible without authentication)
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(path) || path.startsWith('/blog/');
}

/**
 * Check if a route is protected (requires authentication)
 */
export function isProtectedRoute(path: string): boolean {
  // Special handling for course routes - they should be accessible
  if (path.match(/^\/courses\/\d+$/)) {
    return true; // Course routes are protected but should be accessible to authenticated users
  }
  
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
}

/**
 * Get the appropriate redirect path based on authentication state
 */
export function getRedirectPath(currentPath: string, authState: AuthState): string | null {
  const { isAuthenticated, isLoading } = authState;
  
  // Don't redirect while loading
  if (isLoading) {
    return null;
  }
  
  // Allow access to big-baby-public regardless of authentication state
  if (currentPath === '/big-baby-public') {
    return null;
  }
  
  // Special handling for course routes - allow access if authenticated
  if (currentPath.match(/^\/courses\/\d+$/)) {
    if (!isAuthenticated) {
      return '/';
    }
    return null; // Allow access to course routes for authenticated users
  }
  
  // If user is authenticated and tries to access public auth routes, redirect to home
  if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
    return '/home';
  }
  
  // If user is not authenticated and tries to access protected routes, redirect to landing
  if (!isAuthenticated && isProtectedRoute(currentPath)) {
    return '/';
  }
  
  return null;
}

/**
 * Validate that all required routes are properly configured
 */
export function validateRoutingConfiguration(): boolean {
  const allRoutes = [...PUBLIC_ROUTES, ...PROTECTED_ROUTES];
  const uniqueRoutes = new Set(allRoutes);
  
  // Check for duplicate routes
  if (allRoutes.length !== uniqueRoutes.size) {
    console.error('Duplicate routes detected in routing configuration');
    return false;
  }
  
  // Check for required routes
  const requiredRoutes = ['/', '/signup', '/login', '/home'];
  const missingRoutes = requiredRoutes.filter(route => !uniqueRoutes.has(route));
  
  if (missingRoutes.length > 0) {
    console.error('Missing required routes:', missingRoutes);
    return false;
  }
  
  return true;
}