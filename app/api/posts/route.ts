import type { NextRequest } from 'next/server';
import { createPostSchema } from '@/lib/validation/postSchemas';
import { createPost, listPosts, listPostsByAuthor } from '@/lib/services/postService';
import { searchPosts } from '@/lib/services/searchService';

// ─── GET /api/posts ───────────────────────────────────────────────────────────

/**
 * Returns a paginated list of published posts.
 * If a `search` query parameter is present, delegates to the Search_Service
 * for full-text search; otherwise returns all published posts ordered by date.
 * If `mine=true` is present, returns all posts (draft + published) owned by
 * the authenticated author — used by the author dashboard.
 *
 * Query params: page (default 1), limit (default 10), search (optional), mine (optional)
 *
 * Requirements: 6.1, 6.2, 6.3, 12.1
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10);
    const search = searchParams.get('search');
    const mine = searchParams.get('mine') === 'true';

    if (mine) {
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return Response.json({ error: 'Unauthorised' }, { status: 401 });
      }
      const result = await listPostsByAuthor(userId, page, limit);
      return Response.json(result, { status: 200 });
    }

    const result = search
      ? await searchPosts(search, page, limit)
      : await listPosts(page, limit);

    return Response.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error('[GET /api/posts]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────

/**
 * Creates a new blog post. Only users with the `author` role may create posts.
 * The authenticated user's ID is read from the `x-user-id` header set by
 * middleware after JWT verification.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Middleware enforces auth, but guard against missing role header.
    if (userRole !== 'author') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const post = await createPost(parsed.data, userId!);

    return Response.json(post, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/posts]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
