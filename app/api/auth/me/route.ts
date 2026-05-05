import { getCurrentUser } from '@/lib/services/authService';
import type { NextRequest } from 'next/server';

/**
 * GET /api/auth/me
 *
 * Returns the public profile of the currently authenticated user.
 * The middleware sets the `x-user-id` header from the verified JWT; if it is
 * absent the request is unauthenticated.
 *
 * Requirements: 3.1, 3.2
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const userId = request.headers.get('x-user-id');

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
