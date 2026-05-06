import { Post } from '@/models/Post';
import type { IPost } from '@/models/Post';
import { connectDB } from '@/lib/db';

// ─── searchPosts ──────────────────────────────────────────────────────────────

/**
 * Searches published posts using a case-insensitive regex on title, excerpt,
 * and content. Works for partial words and all query lengths — unlike MongoDB's
 * $text index which only matches whole words.
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

  // Escape special regex characters in the user query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regex = new RegExp(escaped, 'i');

  const filter = {
    status: 'published',
    $or: [{ title: regex }, { excerpt: regex }, { content: regex }],
  };

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
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
