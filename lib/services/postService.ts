import { Post } from '@/models/Post';
import type { IPost } from '@/models/Post';
import { connectDB } from '@/lib/db';
import { sanitiseHTML } from '@/lib/sanitise';
import type { CreatePostInput, UpdatePostInput } from '@/lib/validation/postSchemas';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// ─── createPost ───────────────────────────────────────────────────────────────

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

// ─── searchPostsByAuthor ──────────────────────────────────────────────────────

export async function searchPostsByAuthor(
  authorId: string,
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

  const skip = (page - 1) * limit;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regex = new RegExp(escaped, 'i');
  const filter = {
    author: authorId,
    $or: [{ title: regex }, { excerpt: regex }, { content: regex }],
  };

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

  if (!updated) {
    throw { code: 'NOT_FOUND' };
  }

  return updated;
}

// ─── deletePost ───────────────────────────────────────────────────────────────

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
