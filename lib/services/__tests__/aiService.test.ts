/**
 * Unit tests for lib/services/aiService.ts
 *
 * Validates: Requirements 2.1, 2.2, 2.6, 2.7, 2.9, 7.1
 */

import { generateContent } from '../aiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal OpenAI Chat Completions response wrapping the given content string. */
function makeOpenAIResponse(messageContent: string) {
  return {
    choices: [
      {
        message: {
          content: messageContent,
        },
      },
    ],
  };
}

/** Build a mock Response object that fetch would return. */
function mockFetchResponse(
  body: unknown,
  status = 200,
  statusText = 'OK',
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  // Reset env to a clean copy before each test
  process.env = { ...ORIGINAL_ENV };
  // Provide a default API key so tests that don't care about it still work
  process.env.OPENAI_API_KEY = 'test-api-key';
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateContent', () => {
  // ── Requirement 7.1 ─────────────────────────────────────────────────────────
  describe('when OPENAI_API_KEY is not set', () => {
    it('throws a descriptive error', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow('OPENAI_API_KEY');
    });
  });

  // ── Requirement 2.1 / 2.2 ───────────────────────────────────────────────────
  describe('when the OpenAI API returns a valid response', () => {
    it('parses and returns the title and content', async () => {
      const generatedTitle = 'TypeScript Best Practices';
      const generatedContent = '<p>TypeScript is great.</p>';

      const modelPayload = JSON.stringify({
        title: generatedTitle,
        content: generatedContent,
      });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      const result = await generateContent({ prompt: 'Write about TypeScript' });

      expect(result.title).toBe(generatedTitle);
      expect(result.content).toBe(generatedContent);
    });

    it('trims whitespace from title and content', async () => {
      const modelPayload = JSON.stringify({
        title: '  Trimmed Title  ',
        content: '  <p>Trimmed content.</p>  ',
      });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      const result = await generateContent({ prompt: 'Any prompt' });

      expect(result.title).toBe('Trimmed Title');
      expect(result.content).toBe('<p>Trimmed content.</p>');
    });
  });

  // ── Requirement 2.6 ─────────────────────────────────────────────────────────
  describe('when the model returns invalid JSON', () => {
    it('throws an error when the outer API response body is not valid JSON', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      } as unknown as Response);

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow();
    });

    it('throws an error when the model message content is not valid JSON', async () => {
      const modelPayload = 'This is not JSON at all';

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/unexpected response format|parsed as JSON/i);
    });
  });

  // ── Requirement 2.7 ─────────────────────────────────────────────────────────
  describe('when the model response is missing required fields', () => {
    it('throws an error when title is missing', async () => {
      const modelPayload = JSON.stringify({ content: '<p>Some content</p>' });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/title/i);
    });

    it('throws an error when content is missing', async () => {
      const modelPayload = JSON.stringify({ title: 'Some Title' });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/content/i);
    });

    it('throws an error when title is an empty string', async () => {
      const modelPayload = JSON.stringify({
        title: '   ',
        content: '<p>Some content</p>',
      });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/title/i);
    });

    it('throws an error when content is an empty string', async () => {
      const modelPayload = JSON.stringify({
        title: 'Some Title',
        content: '   ',
      });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(makeOpenAIResponse(modelPayload)),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/content/i);
    });
  });

  // ── Requirement 2.9 ─────────────────────────────────────────────────────────
  describe('when the OpenAI API returns a non-2xx status', () => {
    it('throws an error for a 401 Unauthorized response', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse({ error: { message: 'Unauthorized' } }, 401, 'Unauthorized'),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/401/);
    });

    it('throws an error for a 429 Too Many Requests response', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(
            { error: { message: 'Rate limit exceeded' } },
            429,
            'Too Many Requests',
          ),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/429/);
    });

    it('throws an error for a 500 Internal Server Error response', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(
            { error: { message: 'Internal Server Error' } },
            500,
            'Internal Server Error',
          ),
        );

      await expect(
        generateContent({ prompt: 'Write about TypeScript' }),
      ).rejects.toThrow(/500/);
    });
  });

  // ── Requirement 2.1 (AbortSignal forwarding) ────────────────────────────────
  describe('AbortSignal forwarding', () => {
    it('forwards the AbortSignal to fetch', async () => {
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockFetchResponse(
            makeOpenAIResponse(
              JSON.stringify({ title: 'T', content: '<p>C</p>' }),
            ),
          ),
        );

      const controller = new AbortController();
      await generateContent({ prompt: 'Test', signal: controller.signal });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('rejects when the AbortSignal is aborted before the fetch resolves', async () => {
      const controller = new AbortController();

      // Simulate fetch being aborted
      jest.spyOn(global, 'fetch').mockImplementationOnce((_url, options) => {
        // Abort immediately
        controller.abort();
        const signal = (options as RequestInit)?.signal;
        if (signal?.aborted) {
          return Promise.reject(
            Object.assign(new Error('The operation was aborted'), {
              name: 'AbortError',
            }),
          );
        }
        return Promise.resolve(
          mockFetchResponse(
            makeOpenAIResponse(
              JSON.stringify({ title: 'T', content: '<p>C</p>' }),
            ),
          ),
        );
      });

      await expect(
        generateContent({ prompt: 'Test', signal: controller.signal }),
      ).rejects.toMatchObject({ name: 'AbortError' });
    });
  });
});
