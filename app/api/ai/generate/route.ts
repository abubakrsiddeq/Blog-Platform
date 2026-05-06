import type { NextRequest } from 'next/server';
import { generateRequestSchema } from '@/lib/validation/aiSchemas';
import { generateContent } from '@/lib/services/aiService';

const LOG_PREFIX = '[POST /api/ai/generate]';

/**
 * POST /api/ai/generate
 *
 * Accepts a prompt from an authenticated author, calls the AI service to
 * generate a blog post title and HTML content, and returns the result.
 *
 * Auth: Middleware handles 401 for unauthenticated requests.
 *       This handler returns 403 if the caller is not an author.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.1, 7.2, 7.3
 */
export async function POST(request: NextRequest): Promise<Response> {
  // ── Authorization ──────────────────────────────────────────────────────────
  const userRole = request.headers.get('x-user-role');

  if (userRole !== 'author') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Request validation ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const { prompt } = parsed.data;

  // ── AI generation with timeout ─────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const result = await generateContent({ prompt, signal: controller.signal });
    clearTimeout(timeoutId);
    return Response.json({ title: result.title, content: result.content }, { status: 200 });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : '';

    // 504 — timeout
    if (name === 'AbortError') {
      return Response.json(
        { error: 'AI service timed out. Please try again.' },
        { status: 504 },
      );
    }

    // 500 — missing API key
    if (message.includes('OPENAI_API_KEY')) {
      console.error(LOG_PREFIX, err);
      return Response.json(
        { error: 'AI service is not configured.' },
        { status: 500 },
      );
    }

    // 502 — invalid/empty response from the LLM
    if (message.includes('unexpected response format')) {
      console.error(LOG_PREFIX, err);
      return Response.json(
        { error: 'AI returned an unexpected response format.' },
        { status: 502 },
      );
    }

    if (message.includes('empty response')) {
      console.error(LOG_PREFIX, err);
      return Response.json(
        { error: 'AI returned an empty response.' },
        { status: 502 },
      );
    }

    if (message.includes('OpenAI API returned an error')) {
      console.error(LOG_PREFIX, err);
      return Response.json(
        { error: 'AI service error. Please try again.' },
        { status: 502 },
      );
    }

    // Fallback 500
    console.error(LOG_PREFIX, err);
    return Response.json(
      { error: 'AI service error. Please try again.' },
      { status: 502 },
    );
  }
}
