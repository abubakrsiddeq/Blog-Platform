import { Post } from '@/models/Post';
import type { IPost } from '@/models/Post';
import { connectDB } from '@/lib/db';
import { sanitiseHTML } from '@/lib/sanitise';
import type { CreatePostInput, UpdatePostInput } from '@/lib/validation/postSchemas';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strips HTML tags from a string and returns plain text.
 * Used to generate the excerpt from sanitised HTML content.
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// ─── createPost ───────────────────────────────────────────────────────────────

/**
 * Creates a new blog post owned by the given author.
 * Sanitises HTML content and auto-generates a plain-text excerpt.
 *
 * Requirements: 5.1, 5.4, 17.3
 */
export async function createPost(
  data: CreatePostInput,
  authorId: string,
): Promise<IPost> {
  await connectDB();

  const sanitisedContent = sanitiseHTML(data.content);
  const excerpt = stripHTML(sanitisedContent).slice(0, 200);

  const post = await Post.create({
    title: data.title,
    content: sanitisedContent,
    excerpt,
    image: data.image,
    status: data.status ?? 'draft',
    author: authorId,
  });

  return post;
}

// ─── listPosts ────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of published posts ordered by creation date
 * descending, with the author's name populated.
 *
 * Requirements: 6.1, 6.3
 */
export async function listPosts(
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

  const filter = { status: 'published' };
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

// ─── listPostsByAuthor ────────────────────────────────────────────────────────

/**
 * Returns all posts (draft + published) owned by the given author, ordered by
 * creation date descending. Used by the author dashboard.
 *
 * Requirements: 12.1
 */
export async function listPostsByAuthor(
  authorId: string,
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

  const filter = { author: authorId };
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

// ─── getPostById ──────────────────────────────────────────────────────────────

/**
 * Retrieves a single post by ID, populating the author's name.
 * Throws { code: 'NOT_FOUND' } if the post does not exist.
 * Throws { code: 'FORBIDDEN' } if the post is a draft and the requesting user
 * is not the author.
 *
 * Requirements: 6.4, 6.5, 6.6
 */
export async function getPostById(
  postId: string,
  requestingUserId?: string,
): Promise<IPost> {
  await connectDB();

  const post = await Post.findById(postId).populate('author', 'name');

  if (!post) {
    throw { code: 'NOT_FOUND' };
  }

  if (
    post.status === 'draft' &&
    (post.author as { _id: { toString(): string } })._id.toString() !== requestingUserId
  ) {
    throw { code: 'FORBIDDEN' };
  }

  return post;
}

// ─── updatePost ───────────────────────────────────────────────────────────────

/**
 * Updates a post owned by the requesting user.
 * Throws { code: 'NOT_FOUND' } if the post does not exist.
 * Throws { code: 'FORBIDDEN' } if the requesting user is not the author.
 *
 * Requirements: 7.1, 7.2, 7.4, 17.3
 */
export async function updatePost(
  postId: string,
  data: UpdatePostInput,
  requestingUserId: string,
): Promise<IPost> {
  await connectDB();

  const post = await Post.findById(postId);

  if (!post) {
    throw { code: 'NOT_FOUND' };
  }

  if (post.author.toString() !== requestingUserId) {
    throw { code: 'FORBIDDEN' };
  }

  const updateData: Partial<{
    title: string;
    content: string;
    excerpt: string;
    image: string;
    status: 'draft' | 'published';
  }> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.status !== undefined) updateData.status = data.status;

  if (data.content !== undefined) {
    updateData.content = sanitiseHTML(data.content);
    updateData.excerpt = stripHTML(updateData.content).slice(0, 200);
  }

  const updated = await Post.findByIdAndUpdate(postId, updateData, { new: true });

  // findByIdAndUpdate returns null only if the document was deleted between the
  // findById check above and this call — treat it as NOT_FOUND.
  if (!updated) {
    throw { code: 'NOT_FOUND' };
  }

  return updated;
}

// ─── deletePost ───────────────────────────────────────────────────────────────

/**
 * Deletes a post owned by the requesting user.
 * Throws { code: 'NOT_FOUND' } if the post does not exist.
 * Throws { code: 'FORBIDDEN' } if the requesting user is not the author.
 *
 * Requirements: 8.1, 8.2, 8.4
 */
export async function deletePost(
  postId: string,
  requestingUserId: string,
): Promise<void> {
  await connectDB();

  const post = await Post.findById(postId);

  if (!post) {
    throw { code: 'NOT_FOUND' };
  }

  if (post.author.toString() !== requestingUserId) {
    throw { code: 'FORBIDDEN' };
  }

  await Post.findByIdAndDelete(postId);
}
