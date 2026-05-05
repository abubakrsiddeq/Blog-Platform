import { z } from 'zod';

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(2000).trim(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
