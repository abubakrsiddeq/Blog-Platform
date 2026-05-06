import { type NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

/**
 * Determines whether the route requires the 'author' role.
 * Author-only conditions:
 *   - POST /api/posts
 *   - PUT or DELETE /api/posts/:id
 *   - POST /api/upload (any sub-path)
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

  if (method === 'POST' && pathname === '/api/ai/generate') {
    return true;
  }

  return false;
}

/**
 * Returns true for routes that are publicly accessible (no auth needed).
 * GET /api/posts and GET /api/posts/:id are public.
 * GET /api/comments/:postId is also public.
 */
function isPublicRoute(method: string, pathname: string): boolean {
  // Public: list posts
  if (method === 'GET' && pathname === '/api/posts') {
    return true;
  }

  // Public: single post view
  if (method === 'GET' && /^\/api\/posts\/[^/]+$/.test(pathname)) {
    return true;
  }

  // Public: read comments for a post
  if (method === 'GET' && /^\/api\/comments\/[^/]+$/.test(pathname)) {
    return true;
  }

  return false;
}

/**
 * Next.js Middleware — runs on the Edge runtime.
 *
 * Protected paths: /api/posts/*, /api/comments/*, /api/upload/*, /dashboard/*
 * Public paths:    /api/auth/*, GET /api/posts, GET /api/posts/:id,
 *                  GET /api/comments/:postId
 *
 * Flow:
 *  1. If the route is public, forward the request (optionally attaching user
 *     identity if a valid token is present, so draft-post access works).
 *  2. Read the JWT from the `token` HTTP-only cookie.
 *  3. Verify the JWT with verifyJWT().
 *  4. If absent or invalid → 401 Unauthorised.
 *  5. If valid, attach x-user-id and x-user-role request headers.
 *  6. If the route is author-only and the user is a reader → 403 Forbidden.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const { method } = request;

  const token = request.cookies.get('token')?.value;

  // For public routes, still try to attach user identity (needed for draft
  // post access by the owning author), but never block unauthenticated access.
  if (isPublicRoute(method, pathname)) {
    if (token) {
      const payload = verifyJWT(token);
      if (payload) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.sub);
        requestHeaders.set('x-user-role', payload.role);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
    return NextResponse.next();
  }

  // No token → 401
  if (!token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const payload = verifyJWT(token);

  // Invalid / expired token → 401
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

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
    '/api/ai/:path*',
    '/dashboard/:path*',
  ],
};
