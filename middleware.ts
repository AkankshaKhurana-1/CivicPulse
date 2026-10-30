import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth/session';
import { isRouteAuthorized, isPublicRoute, getAuthorizedDashboardPath } from './lib/auth/rbac';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public static assets, api routes, and public pages
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionCookie);

  // 3. Unauthenticated access to protected route
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('reason', 'unauthenticated');
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based route permission check
  const hasPermission = isRouteAuthorized(pathname, session.role);
  if (!hasPermission) {
    // Prevent unauthorized horizontal or vertical privilege escalation
    const fallbackUrl = new URL(getAuthorizedDashboardPath(session.role), request.url);
    fallbackUrl.searchParams.set('error', 'unauthorized_role');
    fallbackUrl.searchParams.set('attempted', pathname);
    return NextResponse.redirect(fallbackUrl);
  }

  // 5. User is authenticated and authorized for this route
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.userId);
  response.headers.set('x-user-role', session.role);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all protected dashboard route segments:
     * - /citizen/:path*
     * - /worker/:path*
     * - /officer/:path*
     * - /oversight/:path*
     * - /admin
     * - /admin/:path*
     */
    '/citizen/:path*',
    '/worker/:path*',
    '/officer/:path*',
    '/oversight/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
