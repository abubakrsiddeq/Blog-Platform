import { Post } from '@/models/Post';
import { connectDB } from '@/lib/db';

// ─── toggleLike ───────────────────────────────────────────────────────────────

/**
 * Toggles a like on a post for the given user.
 * If the user has already liked the post, the like is removed (unlike).
 * If the user has not liked the post, the like is added.
 * Throws { code: 'NOT_FOUND' } if the post does not exist.
 *
 * Requirements: 10.1, 10.2, 10.3
 */
export async function toggleLike(
  postId: string,
  userId: string,
): Promise<{ likes: number; liked: boolean }> {
  await connectDB();

  const post = await Post.findById(postId);
  if (!post) {
    throw { code: 'NOT_FOUND' };
  }

  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  let updatedPost;
  if (alreadyLiked) {
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true },
    );
  } else {
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $push: { likes: userId } },
      { new: true },
    );
  }

  if (!updatedPost) {
    throw { code: 'NOT_FOUND' };
  }

  return {
    likes: updatedPost.likes.length,
    liked: !alreadyLiked,
  };
}
