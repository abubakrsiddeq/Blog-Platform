import { Comment } from '@/models/Comment';
import type { IComment } from '@/models/Comment';
import { Post } from '@/models/Post';
import { connectDB } from '@/lib/db';
import type { CreateCommentInput } from '@/lib/validation/commentSchemas';

// ─── createComment ────────────────────────────────────────────────────────────

/**
 * Creates a new comment on a post by the given user.
 * Throws { code: 'POST_NOT_FOUND' } if the referenced post does not exist.
 *
 * Requirements: 9.1, 9.2, 9.3
 */
export async function createComment(
  data: CreateCommentInput,
  userId: string,
): Promise<IComment & { user: { name: string } }> {
  await connectDB();

  const post = await Post.findById(data.postId);
  if (!post) {
    throw { code: 'POST_NOT_FOUND' };
  }

  const comment = await Comment.create({
    post: data.postId,
    user: userId,
    content: data.content,
  });

  await comment.populate('user', 'name');

  return comment as IComment & { user: { name: string } };
}

// ─── getCommentsByPost ────────────────────────────────────────────────────────

/**
 * Returns all comments for a post ordered by creation date ascending,
 * with each comment's user name populated.
 * Throws { code: 'POST_NOT_FOUND' } if the referenced post does not exist.
 *
 * Requirements: 9.4, 9.5
 */
export async function getCommentsByPost(postId: string): Promise<IComment[]> {
  await connectDB();

  const post = await Post.findById(postId);
  if (!post) {
    throw { code: 'POST_NOT_FOUND' };
  }

  return Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate('user', 'name');
}
