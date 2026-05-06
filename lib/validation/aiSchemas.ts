import { z } from 'zod';

export const generateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
