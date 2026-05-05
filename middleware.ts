import { type NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

/**
 * Determines whether the route requires the 'author' role.
 * Author-only conditions:
 *   - POST /api/posts
 *   - PUT or DELETE /api/posts/:id
 *   - POST /api/upload (any sub-path)
 *
 * Requirements: 4.3, 4.4
 */
function isAuthorOnlyRoute(method: string, pathname: string): boolean {
  if (method === 'POST' && pathname === '/api/posts') {
    return true;
  }

  if (
    (method === 'PUT' || method === 'DELETE') &&
    /^\/api\/posts\/[^/]+$/.test(pathname)
  ) {
    return true;
  }

  if (method === 'POST' && pathname.startsWith('/api/upload')) {
    return true;
  }

  return false;
}

/**
 * Next.js Middleware — runs on the Edge runtime.
 *
 * Protected paths: /api/posts/*, /api/comments/*, /api/upload/*, /dashboard/*
 * Public paths:    /api/auth/* (not matched by the config below)
 *
 * Flow:
 *  1. Read the JWT from the `token` HTTP-only cookie.
 *  2. Verify the JWT with verifyJWT().
 *  3. If absent or invalid → 401 Unauthorised.
 *  4. If valid, attach x-user-id and x-user-role request headers.
 *  5. If the route is author-only and the user is a reader → 403 Forbidden.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get('token')?.value;

  // No token → 401
  if (!token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const payload = verifyJWT(token);

  // Invalid / expired token → 401
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { pathname } = request.nextUrl;
  const { method } = request;

  // Role-based check for author-only routes
  if (isAuthorOnlyRoute(method, pathname) && payload.role === 'reader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Forward user identity to route handlers via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/posts/:path*',
    '/api/comments/:path*',
    '/api/upload/:path*',
    '/dashboard/:path*',
  ],
};
