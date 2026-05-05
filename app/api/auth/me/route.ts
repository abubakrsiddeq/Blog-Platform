import { getCurrentUser, updateProfile } from '@/lib/services/authService';
import { verifyJWT } from '@/lib/auth';
import type { NextRequest } from 'next/server';

/**
 * Resolves the authenticated user ID from either:
 *  1. The `x-user-id` header injected by the proxy (when the route is matched), or
 *  2. The `token` HTTP-only cookie (direct fallback for /api/auth/* routes which
 *     are intentionally excluded from the proxy matcher).
 */
function resolveUserId(request: NextRequest): string | null {
  // Prefer the header set by the proxy
  const fromHeader = request.headers.get('x-user-id');
  if (fromHeader) return fromHeader;

  // Fall back to verifying the cookie directly
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  const payload = verifyJWT(token);
  return payload?.sub ?? null;
}

/**
 * GET /api/auth/me
 *
 * Returns the public profile of the currently authenticated user.
 *
 * Requirements: 3.1, 3.2
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const userId = resolveUserId(request);

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const user = await getCurrentUser(userId);

    if (!user) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    return Response.json(user, { status: 200 });
  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/auth/me
 *
 * Updates the authenticated user's name and/or password.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const userId = resolveUserId(request);

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();
    const user = await updateProfile(userId, body);

    return Response.json(user, { status: 200 });
  } catch (err: unknown) {
    const e = err as { code?: string; issues?: unknown };

    if (e?.code === 'VALIDATION_ERROR') {
      return Response.json({ error: 'Validation failed', issues: e.issues }, { status: 422 });
    }
    if (e?.code === 'WRONG_PASSWORD') {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    if (e?.code === 'USER_NOT_FOUND') {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('[PATCH /api/auth/me]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
