/**
 * Unit tests for app/api/ai/generate/route.ts
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */

import { POST } from '../route';

// ─── Mock aiService ───────────────────────────────────────────────────────────

jest.mock('@/lib/services/aiService', () => ({
  generateContent: jest.fn(),
}));

import { generateContent } from '@/lib/services/aiService';

const mockGenerateContent = generateContent as jest.MockedFunction<
  typeof generateContent
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal NextRequest-like object for the route handler. */
function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request('http://localhost/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/** Parse the JSON body from a Response. */
async function parseBody(res: Response): Promise<unknown> {
  return res.json();
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/ai/generate', () => {
  // ── Requirement 2.8 — Authorization ─────────────────────────────────────────
  describe('authorization', () => {
    it('returns 403 when x-user-role header is absent', async () => {
      const req = makeRequest({ prompt: 'Write about TypeScript' });
      const res = await POST(req as never);

      expect(res.status).toBe(403);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'Forbidden' });
    });

    it('returns 403 when x-user-role is "reader"', async () => {
      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'reader' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(403);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'Forbidden' });
    });

    it('returns 403 when x-user-role is an unrecognised role', async () => {
      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'admin' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(403);
    });
  });

  // ── Requirement 2.3 — Request validation ────────────────────────────────────
  describe('request validation', () => {
    it('returns 400 when prompt is missing from the body', async () => {
      const req = makeRequest({}, { 'x-user-role': 'author' });
      const res = await POST(req as never);

      expect(res.status).toBe(400);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'Prompt is required.' });
    });

    it('returns 400 when prompt is an empty string', async () => {
      const req = makeRequest({ prompt: '' }, { 'x-user-role': 'author' });
      const res = await POST(req as never);

      expect(res.status).toBe(400);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'Prompt is required.' });
    });

    it('returns 400 when the request body is not valid JSON', async () => {
      const req = new Request('http://localhost/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'author',
        },
        body: 'not-json',
      });
      const res = await POST(req as never);

      expect(res.status).toBe(400);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'Prompt is required.' });
    });
  });

  // ── Requirement 7.1 / 2.4 — Missing API key ─────────────────────────────────
  describe('when OPENAI_API_KEY is not configured', () => {
    it('returns 500 with the configuration error message', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          'OPENAI_API_KEY environment variable is not set. Please configure it to use the AI Writing Assistant.',
        ),
      );

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(500);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'AI service is not configured.' });
    });
  });

  // ── Requirement 2.5 — Timeout / AbortError ──────────────────────────────────
  describe('when the AI service times out', () => {
    it('returns 504 when aiService rejects with an AbortError', async () => {
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });
      mockGenerateContent.mockRejectedValueOnce(abortError);

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(504);
      const body = await parseBody(res);
      expect(body).toEqual({
        error: 'AI service timed out. Please try again.',
      });
    });
  });

  // ── Requirement 2.6 — Invalid LLM response format ───────────────────────────
  describe('when the LLM returns an invalid response format', () => {
    it('returns 502 when aiService throws an unexpected response format error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          'AI returned an unexpected response format. The response could not be parsed as JSON.',
        ),
      );

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(502);
      const body = await parseBody(res);
      expect(body).toEqual({
        error: 'AI returned an unexpected response format.',
      });
    });
  });

  // ── Requirement 2.7 — Empty title or content ────────────────────────────────
  describe('when the LLM returns an empty title or content', () => {
    it('returns 502 when aiService throws an empty response error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          'AI returned an empty response. The generated title is missing or empty.',
        ),
      );

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(502);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'AI returned an empty response.' });
    });

    it('returns 502 when aiService throws an empty content error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          'AI returned an empty response. The generated content is missing or empty.',
        ),
      );

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(502);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'AI returned an empty response.' });
    });
  });

  // ── Requirement 2.9 — LLM API error ─────────────────────────────────────────
  describe('when the LLM API returns an error', () => {
    it('returns 502 when aiService throws an OpenAI API error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenAI API returned an error: 429 Too Many Requests'),
      );

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(502);
      const body = await parseBody(res);
      expect(body).toEqual({ error: 'AI service error. Please try again.' });
    });
  });

  // ── Requirement 2.1 / 2.2 — Successful generation ───────────────────────────
  describe('on successful generation', () => {
    it('returns 200 with title and content', async () => {
      const generatedTitle = 'TypeScript Best Practices';
      const generatedContent = '<p>TypeScript is great.</p>';

      mockGenerateContent.mockResolvedValueOnce({
        title: generatedTitle,
        content: generatedContent,
      });

      const req = makeRequest(
        { prompt: 'Write about TypeScript' },
        { 'x-user-role': 'author' },
      );
      const res = await POST(req as never);

      expect(res.status).toBe(200);
      const body = await parseBody(res);
      expect(body).toEqual({
        title: generatedTitle,
        content: generatedContent,
      });
    });

    it('calls generateContent with the prompt from the request body', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        title: 'A Title',
        content: '<p>Some content.</p>',
      });

      const req = makeRequest(
        { prompt: 'Write about Next.js' },
        { 'x-user-role': 'author' },
      );
      await POST(req as never);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Write about Next.js' }),
      );
    });
  });
});
