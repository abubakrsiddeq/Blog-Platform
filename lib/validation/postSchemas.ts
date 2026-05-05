import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  image: z.string().min(1),              // required — accepts relative /uploads/... paths and absolute URLs
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
