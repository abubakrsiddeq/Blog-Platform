// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateContentInput {
  prompt: string;
  signal?: AbortSignal;
}

export interface GeneratedContent {
  title: string;
  content: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional blog post writer. Given a topic or prompt, generate a well-structured blog post.

You MUST respond with a valid JSON object in exactly this format:
{
  "title": "The blog post title as plain text (no HTML)",
  "content": "The blog post body as HTML"
}

Rules for the content field:
- Use only these HTML tags: <h2>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>
- Do NOT use <h1> — the title is handled separately
- Do NOT use <html>, <body>, <head>, or any structural tags
- Do NOT use inline styles or class attributes
- Start with an introductory <p> paragraph
- Use <h2> for section headings
- Use <ul> or <ol> for lists
- Use <blockquote> for quotes or callouts
- Use <strong> and <em> for emphasis

Rules for the title field:
- Plain text only — no HTML tags
- Concise and descriptive

Respond ONLY with the JSON object. Do not include markdown code fences, explanations, or any other text.`;

// ─── generateContent ──────────────────────────────────────────────────────────

/**
 * Calls the OpenAI Chat Completions API to generate a blog post title and
 * HTML content from a natural-language prompt.
 *
 * Throws a descriptive error if:
 * - OPENAI_API_KEY is not set
 * - The API returns a non-2xx status
 * - The response cannot be parsed as JSON
 * - The parsed response is missing or has empty title/content
 *
 * Requirements: 2.1, 2.2, 2.6, 2.7, 2.9, 7.1, 7.3
 */
export async function generateContent(
  input: GenerateContentInput,
): Promise<GeneratedContent> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const apiKey = groqKey || geminiKey || openaiKey;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. Please configure it to use the AI Writing Assistant.',
    );
  }

  const { prompt, signal } = input;

  let messageContent: string;

  if (groqKey) {
    // ── Groq (free, fast) ──────────────────────────────────────────────────
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API returned an error: ${response.status} ${response.statusText}`,
      );
    }

    let apiData: unknown;
    try {
      apiData = await response.json();
    } catch {
      throw new Error('Failed to parse the OpenAI API response as JSON.');
    }

    messageContent =
      (apiData as { choices?: { message?: { content?: string } }[] })
        ?.choices?.[0]?.message?.content ?? '';

  } else if (geminiKey) {
    // ── Gemini ─────────────────────────────────────────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API returned an error: ${response.status} ${response.statusText}`,
      );
    }

    let apiData: unknown;
    try {
      apiData = await response.json();
    } catch {
      throw new Error('Failed to parse the OpenAI API response as JSON.');
    }

    messageContent =
      (apiData as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      })?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  } else {
    // ── OpenAI ─────────────────────────────────────────────────────────────
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API returned an error: ${response.status} ${response.statusText}`,
      );
    }

    let apiData: unknown;
    try {
      apiData = await response.json();
    } catch {
      throw new Error('Failed to parse the OpenAI API response as JSON.');
    }

    messageContent =
      (apiData as { choices?: { message?: { content?: string } }[] })
        ?.choices?.[0]?.message?.content ?? '';
  }

  if (!messageContent) {
    throw new Error(
      'OpenAI API returned an empty response. No content was generated.',
    );
  }

  // Strip markdown code fences if model wrapped JSON in ```json ... ```
  const cleaned = messageContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Parse the JSON payload returned by the model
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      'AI returned an unexpected response format. The response could not be parsed as JSON.',
    );
  }

  const title = (parsed as { title?: unknown })?.title;
  const content = (parsed as { content?: unknown })?.content;

  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error(
      'AI returned an empty response. The generated title is missing or empty.',
    );
  }

  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error(
      'AI returned an empty response. The generated content is missing or empty.',
    );
  }

  return {
    title: title.trim(),
    content: content.trim(),
  };
}
