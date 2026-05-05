import type { NextRequest } from 'next/server';
import { createCommentSchema } from '@/lib/validation/commentSchemas';
import { createComment } from '@/lib/services/commentService';

// ─── POST /api/comments ───────────────────────────────────────────────────────

/**
 * Creates a new comment on a post.
 * The authenticated user's ID is read from the `x-user-id` header set by
 * middleware after JWT verification.
 *
 * Requirements: 9.1, 9.2, 9.3
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const comment = await createComment(parsed.data, userId);

    return Response.json(comment, { status: 201 });
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'POST_NOT_FOUND'
    ) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    console.error('[POST /api/comments]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
