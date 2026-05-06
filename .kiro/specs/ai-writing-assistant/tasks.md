# Implementation Plan: AI Writing Assistant

## Overview

Implement the AI Writing Assistant feature by building the server-side OpenAI integration, the API route with auth and error handling, the client-side `AIAssistant` component, and wiring it into the existing `PostForm`. The implementation follows the existing project patterns: TypeScript, Next.js App Router API routes, Zod validation, and Tailwind CSS with CSS custom properties.

## Tasks

- [x] 1. Add Zod validation schema for the generate request
  - Create `lib/validation/aiSchemas.ts` with a `generateRequestSchema` using `z.object({ prompt: z.string().min(1, 'Prompt is required') })`
  - Export the `GenerateRequest` type inferred from the schema
  - _Requirements: 2.3_

- [x] 2. Implement the AI service
  - [x] 2.1 Create `lib/services/aiService.ts` with the `generateContent` function
    - Read `OPENAI_API_KEY` from `process.env`; throw a descriptive error if it is not set
    - Accept `{ prompt: string; signal?: AbortSignal }` and return `Promise<{ title: string; content: string }>`
    - Call the OpenAI Chat Completions API (`gpt-3.5-turbo`) using native `fetch`, passing the `signal` for timeout support
    - Include the system prompt instructing the model to return JSON with `title` (plain text) and `content` (HTML using `<h2>`, `<p>`, `<ul>`, `<ol>`, `<blockquote>`, `<strong>`, `<em>` — no `<h1>`)
    - Parse the response JSON; throw a descriptive error if parsing fails or if `title`/`content` are missing or empty after trimming
    - Throw a descriptive error if the OpenAI API returns a non-2xx status
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.9, 7.1, 7.3_

  - [x] 2.2 Write unit tests for `aiService.ts`
    - Test that the function throws when `OPENAI_API_KEY` is not set
    - Test that a valid OpenAI response is parsed and returned correctly
    - Test that an invalid JSON response throws an error
    - Test that a response missing `title` or `content` throws an error
    - Test that a non-2xx OpenAI status throws an error
    - Test that the `AbortSignal` is forwarded to `fetch` (abort causes the call to reject)
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.9, 7.1_

- [x] 3. Implement the Generate API route
  - [x] 3.1 Create `app/api/ai/generate/route.ts` with a `POST` handler
    - Read `x-user-role` from request headers; return 403 `{ error: 'Forbidden' }` if the role is not `'author'` (middleware handles 401 for unauthenticated requests)
    - Parse the request body and validate with `generateRequestSchema`; return 400 `{ error: 'Prompt is required.' }` on failure
    - Return 500 `{ error: 'AI service is not configured.' }` and log a server-side error if `OPENAI_API_KEY` is not set (detected via the error thrown by `aiService`)
    - Set up an `AbortController` with a 30-second timeout; pass `controller.signal` to `generateContent`
    - Catch `AbortError` and return 504 `{ error: 'AI service timed out. Please try again.' }`
    - Catch invalid-response errors from `aiService` and return 502 with the appropriate message (`'AI returned an unexpected response format.'`, `'AI returned an empty response.'`, or `'AI service error. Please try again.'`)
    - On success, return 200 with `{ title, content }`
    - Log all 500-class errors with the prefix `[POST /api/ai/generate]`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.1, 7.2, 7.3_

  - [x] 3.2 Write unit tests for the Generate API route
    - Test 403 response when `x-user-role` is `'reader'` or absent
    - Test 400 response for missing or empty `prompt`
    - Test 500 response when `OPENAI_API_KEY` is not set
    - Test 504 response when `aiService` rejects with an `AbortError`
    - Test 502 response for invalid LLM response format
    - Test 502 response for empty `title` or `content`
    - Test 502 response for LLM API error
    - Test 200 response with valid `{ title, content }` on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 4. Update middleware to protect `/api/ai/*` routes
  - In `proxy.ts`, add `'/api/ai/:path*'` to the `config.matcher` array
  - Add `/api/ai/generate` (POST) to `isAuthorOnlyRoute` so that readers receive 403 (unauthenticated callers already receive 401 from the existing middleware logic)
  - _Requirements: 2.8_

- [x] 5. Checkpoint — verify server-side foundation
  - Ensure all unit tests for `aiService.ts` and the API route pass
  - Confirm the middleware matcher change compiles without TypeScript errors
  - Ask the user if any questions arise before proceeding to the client side.

- [x] 6. Implement the `AIAssistant` client component
  - [x] 6.1 Create `components/posts/AIAssistant.tsx`
    - Accept props `{ onGenerate: (result: { title: string; content: string }) => void; disabled?: boolean }`
    - Manage local state: `prompt` (string), `generating` (boolean), `error` (string | null)
    - Render a labelled textarea/input with `id="ai-prompt"`, `aria-required="false"`, `aria-invalid` when there is a validation error, and `aria-describedby` pointing to the error element
    - Render a "Generate" button with `aria-busy` during generation; show a `LoadingSpinner` and "Generating…" text while `generating` is true
    - On button click: clear any previous error; if prompt is empty after trimming, set error to `"Please enter a prompt before generating."` and return
    - While generating, disable both the prompt input and the Generate button
    - Call `POST /api/ai/generate` with `{ prompt }`; on success call `onGenerate` with the result; on HTTP error display the `error` field from the response body; on network error display `"Network error. Please check your connection and try again."`
    - Re-enable input and button after success or failure
    - Render the error message in a `<p role="alert">` element below the prompt input
    - Style the section with `bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl p-4` consistent with the existing form design; use a secondary/accent button style that does not compete with the primary submit button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 6.2 Write unit tests for `AIAssistant`
    - Test that the prompt input and Generate button are rendered
    - Test that clicking Generate with an empty prompt shows the validation error and does not call `fetch`
    - Test that input and button are disabled while `generating` is true
    - Test that the button shows "Generating…" during generation
    - Test that a successful response calls `onGenerate` with `{ title, content }`
    - Test that an HTTP error response displays the error message from the response body
    - Test that a network error displays the network error message
    - Test that the error is cleared when a new generation request is submitted
    - Test that input and button are re-enabled after generation completes or fails
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Integrate `AIAssistant` into `PostForm`
  - [x] 7.1 Update `PostForm.tsx` to embed the `AIAssistant` component
    - Import `AIAssistant` from `@/components/posts/AIAssistant`
    - Add `editorKey` state (`useState(0)`) to support key-based remounting of `RichTextEditor`
    - Implement `handleAIGenerate(result: { title: string; content: string })`:
      - Call `setTitle(result.title)`
      - Call `setContent(result.content)`
      - Increment `editorKey` to force `RichTextEditor` to remount with the new content
      - Clear validation errors for `title` and `content` via `setErrors(prev => { const next = { ...prev }; delete next.title; delete next.content; return next; })`
    - Render `<AIAssistant onGenerate={handleAIGenerate} disabled={submitting} />` above the Title field inside the form
    - Pass `key={editorKey}` and `initialContent={content}` to `RichTextEditor` so it reflects AI-generated content on remount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 6.2_

  - [x] 7.2 Write integration tests for the `PostForm` + `AIAssistant` flow
    - Test that `handleAIGenerate` updates the title input value
    - Test that `handleAIGenerate` updates the content state and causes `RichTextEditor` to remount with new content
    - Test that `handleAIGenerate` clears pre-existing validation errors on `title` and `content`
    - Test that other form fields (cover image, status) are unchanged after AI generation
    - Test that the form can be submitted successfully with AI-generated content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 8. Document the `OPENAI_API_KEY` environment variable
  - Add `OPENAI_API_KEY=` (with an empty value as a placeholder) to `.env.local` if it is not already present
  - Add a note to `README.md` explaining that `OPENAI_API_KEY` must be set to a valid OpenAI API key for the AI Writing Assistant to function
  - _Requirements: 7.1, 7.2_

- [x] 9. Final checkpoint — ensure all tests pass
  - Run the full test suite and confirm all tests pass
  - Verify TypeScript compiles without errors across all new and modified files
  - Ask the user if any questions arise before considering the feature complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The design recommends `gpt-3.5-turbo` as the starting model (see design Open Questions)
- No new npm dependencies are required — the feature uses native `fetch`, existing `zod`, and existing Next.js APIs
- The `RichTextEditor` is updated via key-based remount (Option A from the design) to avoid adding imperative APIs to the editor component
- All error messages must match the exact strings specified in the requirements and design to ensure consistent user feedback
- The middleware update in task 4 is critical for security — without it, unauthenticated users can reach the API route
