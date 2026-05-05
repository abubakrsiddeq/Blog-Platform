import type { NextRequest } from 'next/server';
import { toggleLike } from '@/lib/services/likeService';

// ─── POST /api/posts/[id]/like ────────────────────────────────────────────────

/**
 * Toggles a like on a post for the authenticated user.
 * The authenticated user's ID is read from the `x-user-id` header set by
 * middleware after JWT verification.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const result = await toggleLike(id, userId);

    return Response.json(result, { status: 200 });
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'NOT_FOUND'
    ) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Mongoose CastError — invalid ObjectId format → treat as 404
    if (
      err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'CastError'
    ) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    console.error('[POST /api/posts/[id]/like]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
