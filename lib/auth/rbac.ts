import { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  worker: 'Field Worker',
  officer: 'Agency Officer',
  oversight: 'Supervisor (Oversight Director)',
  admin: 'System Administrator',
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  citizen: '/citizen/dashboard',
  worker: '/worker/dashboard',
  officer: '/officer/dashboard',
  oversight: '/oversight/dashboard',
  admin: '/admin',
};

/**
 * Maps dashboard prefixes to the roles allowed to access them.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/oversight': ['oversight', 'admin'],
  '/officer': ['officer', 'admin'],
  '/worker': ['worker', 'admin'],
  '/citizen': ['citizen', 'admin'],
};

/**
 * Public routes that do not require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/map',
  '/issues',
  '/track',
  '/about',
  '/report',
  '/infrastructure',
];

/**
 * Checks whether a given pathname is public
 */
export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;

  // Exact matches
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // Prefix matches for public exploratory pages
  if (
    pathname.startsWith('/issues/') ||
    pathname.startsWith('/infrastructure/') ||
    pathname.startsWith('/api/geocode') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates whether a user with a given role has permission to access a route
 */
export function isRouteAuthorized(pathname: string, userRole?: UserRole): boolean {
  // Public paths are open to everyone
  if (isPublicRoute(pathname)) return true;

  // If not authenticated, cannot access private routes
  if (!userRole) return false;

  // Find matching route prefix permission rule
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      return allowedRoles.includes(userRole);
    }
  }

  // Any other unspecified internal route requires at least authentication
  return true;
}

/**
 * Returns the appropriate dashboard route for a verified user role
 */
export function getAuthorizedDashboardPath(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || '/citizen/dashboard';
}

/**
 * Helper to verify API route role authorization
 */
export function isApiAuthorized(requiredRoles: UserRole[], userRole?: UserRole): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}
