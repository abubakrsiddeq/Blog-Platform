import { Post } from '@/models/Post';
import type { IPost } from '@/models/Post';
import { connectDB } from '@/lib/db';

// ─── searchPosts ──────────────────────────────────────────────────────────────

/**
 * Performs a full-text search over published posts using MongoDB's $text index.
 * Results are ranked by text relevance score (highest first) and paginated.
 *
 * Requirements: 6.2
 */
export async function searchPosts(
  query: string,
  page: number,
  limit: number,
): Promise<{
  posts: IPost[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  await connectDB();

  const filter = { $text: { $search: query }, status: 'published' };
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .populate('author', 'name')
      .skip(skip)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  return {
    posts,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
