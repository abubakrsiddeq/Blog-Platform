import type { NextRequest } from 'next/server';
import { updatePostSchema } from '@/lib/validation/postSchemas';
import { getPostById, updatePost, deletePost } from '@/lib/services/postService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps a service error code to the appropriate HTTP response.
 * Also handles Mongoose CastError (invalid ObjectId) as 404.
 */
function handleServiceError(err: unknown, context: string): Response {
  if (
    err !== null &&
    typeof err === 'object' &&
    'code' in err
  ) {
    const code = (err as { code: string }).code;
    if (code === 'NOT_FOUND') {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }
    if (code === 'FORBIDDEN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
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

  console.error(context, err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}

// ─── GET /api/posts/[id] ──────────────────────────────────────────────────────

/**
 * Returns a single post by ID.
 * Published posts are accessible to everyone.
 * Draft posts are only accessible to the owning author.
 *
 * Requirements: 6.4, 6.5, 6.6
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id') ?? undefined;

    const post = await getPostById(id, userId);

    return Response.json(post, { status: 200 });
  } catch (err: unknown) {
    return handleServiceError(err, '[GET /api/posts/[id]]');
  }
}

// ─── PUT /api/posts/[id] ──────────────────────────────────────────────────────

/**
 * Updates a post. Only the owning author may update their post.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();

    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const post = await updatePost(id, parsed.data, userId);

    return Response.json(post, { status: 200 });
  } catch (err: unknown) {
    return handleServiceError(err, '[PUT /api/posts/[id]]');
  }
}

// ─── DELETE /api/posts/[id] ───────────────────────────────────────────────────

/**
 * Deletes a post. Only the owning author may delete their post.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    await deletePost(id, userId);

    return Response.json({ message: 'Post deleted' }, { status: 200 });
  } catch (err: unknown) {
    return handleServiceError(err, '[DELETE /api/posts/[id]]');
  }
}
