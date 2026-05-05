import type { NextRequest } from 'next/server';
import { getCommentsByPost } from '@/lib/services/commentService';

// ─── GET /api/comments/[postId] ───────────────────────────────────────────────

/**
 * Returns all comments for a post ordered by creation date ascending,
 * with each comment's user name populated.
 *
 * Requirements: 9.4, 9.5
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
): Promise<Response> {
  try {
    const { postId } = await params;

    const comments = await getCommentsByPost(postId);

    return Response.json(comments, { status: 200 });
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'POST_NOT_FOUND'
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

    console.error('[GET /api/comments/[postId]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
