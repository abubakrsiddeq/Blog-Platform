# Design Document: AI Writing Assistant

## Overview

The AI Writing Assistant feature integrates an LLM-powered content generation capability directly into the blog platform's post creation and editing workflow. Authors can enter a natural-language prompt and receive a structured article (title + rich-text content) that is immediately injected into the existing `PostForm` fields for review and editing.

### Key Design Goals

1. **Seamless Integration**: Embed the AI assistant into the existing `PostForm` component without disrupting the current save/publish workflow or state management patterns.
2. **Security-First**: Keep the LLM API key server-side only; never expose it to the client.
3. **Robust Error Handling**: Provide clear, actionable feedback for all failure modes (validation, timeout, network, LLM errors).
4. **Non-Intrusive UX**: Design the AI assistant UI to feel like a natural extension of the form, not a bolt-on feature.
5. **Immediate Editability**: Treat generated content identically to manually entered content—no special handling required.

### Architecture Principles

- **Client-Server Separation**: All LLM communication happens server-side via a dedicated API route.
- **Progressive Enhancement**: The form remains fully functional if the AI service is unavailable.
- **State Consistency**: Generated content flows through the same state management as manual input.
- **Fail-Safe Defaults**: Errors never corrupt existing form data; the user can always retry.

---

## Architecture

### Component Hierarchy

```
PostForm (existing)
├── AIAssistant (new)
│   ├── Prompt Input
│   ├── Generate Button
│   └── Error Display
├── Title Input (existing)
├── Cover Image Uploader (existing)
├── RichTextEditor (existing)
├── Status Toggle (existing)
└── Submit Actions (existing)
```

### Data Flow

```
┌─────────────┐
│   Author    │
│ enters prompt│
└──────┬──────┘
       │
       v
┌─────────────────┐
│  AIAssistant    │
│  (client-side)  │
└──────┬──────────┘
       │ POST /api/ai/generate
       │ { prompt: "..." }
       v
┌─────────────────┐
│  Generate_API   │
│  (server-side)  │
└──────┬──────────┘
       │ calls LLM_Provider
       │ (OpenAI Chat Completions)
       v
┌─────────────────┐
│  LLM_Provider   │
│  (external)     │
└──────┬──────────┘
       │ returns { title, content }
       v
┌─────────────────┐
│  Generate_API   │
│  validates &    │
│  returns JSON   │
└──────┬──────────┘
       │ { title: "...", content: "..." }
       v
┌─────────────────┐
│  AIAssistant    │
│  updates form   │
│  state via      │
│  setTitle() &   │
│  setContent()   │
└─────────────────┘
```

### Request/Response Flow

**Request:**
```typescript
POST /api/ai/generate
Content-Type: application/json
Cookie: token=<jwt>

{
  "prompt": "Write a blog post about TypeScript best practices"
}
```

**Success Response:**
```typescript
200 OK
Content-Type: application/json

{
  "title": "10 TypeScript Best Practices for 2024",
  "content": "<h2>Introduction</h2><p>TypeScript has become...</p>"
}
```

**Error Response:**
```typescript
400 Bad Request | 401 Unauthorized | 403 Forbidden | 
502 Bad Gateway | 504 Gateway Timeout
Content-Type: application/json

{
  "error": "Descriptive error message"
}
```

---

## Components and Interfaces

### 1. AIAssistant Component (New)

**Location:** `components/posts/AIAssistant.tsx`

**Purpose:** Provides the UI for prompt input, generation triggering, and error display. Manages the generation request lifecycle and updates parent form state on success.

**Props:**
```typescript
interface AIAssistantProps {
  onGenerate: (result: GeneratedContent) => void;
  disabled?: boolean;  // disable during form submission
}
```

**State:**
```typescript
interface AIAssistantState {
  prompt: string;
  generating: boolean;
  error: string | null;
}
```

**Key Methods:**
- `handleGenerate()`: Validates prompt, calls API, handles response
- `clearError()`: Resets error state on new submission

**Validation:**
- Prompt must be non-empty (trimmed)
- Display inline error: "Please enter a prompt before generating."

**Loading State:**
- Button text: "Generating…"
- Button and input disabled
- Optional: spinner icon in button

**Error Display:**
- Inline error area below prompt input
- Red text, accessible via `role="alert"`
- Cleared on next submission

---

### 2. Generate API Route (New)

**Location:** `app/api/ai/generate/route.ts`

**Purpose:** Server-side endpoint that receives prompts, calls the LLM provider, validates responses, and returns structured content.

**Authentication:**
- Requires valid JWT token (via cookie)
- Requires `author` role (enforced by middleware)
- Returns 401 for unauthenticated requests
- Returns 403 for non-author roles

**Request Schema:**
```typescript
interface GenerateRequest {
  prompt: string;  // required, non-empty
}
```

**Response Schema:**
```typescript
interface GeneratedContent {
  title: string;    // non-empty
  content: string;  // non-empty, HTML
}
```

**Error Codes:**
- `400`: Missing or empty prompt
- `401`: Unauthenticated
- `403`: Non-author role
- `500`: Missing `OPENAI_API_KEY` environment variable
- `502`: LLM returned invalid/empty response
- `504`: LLM request timeout (30s)

**Timeout Handling:**
- Use `AbortController` with 30-second timeout
- Catch `AbortError` and return 504

**Response Validation:**
- Parse LLM response as JSON
- Verify `title` and `content` fields exist and are non-empty strings
- Return 502 if validation fails

---

### 3. PostForm Integration (Modified)

**Location:** `components/posts/PostForm.tsx`

**Changes:**
1. Import and render `AIAssistant` component above the Title field
2. Add `handleAIGenerate` callback that updates `title` and `content` state
3. Clear validation errors for `title` and `content` fields when AI content is injected
4. Pass `submitting` state to `AIAssistant` to disable during form submission

**New Callback:**
```typescript
function handleAIGenerate(result: GeneratedContent) {
  setTitle(result.title);
  setContent(result.content);
  
  // Clear validation errors for populated fields
  setErrors(prev => {
    const next = { ...prev };
    delete next.title;
    delete next.content;
    return next;
  });
  
  // Trigger RichTextEditor update via key or ref
  // (implementation depends on editor API)
}
```

**RichTextEditor Update:**
The `RichTextEditor` component uses Tiptap's `useEditor` hook with an `onUpdate` callback. To programmatically set content:

**Option A: Controlled via key prop (recommended)**
```typescript
const [editorKey, setEditorKey] = useState(0);

function handleAIGenerate(result: GeneratedContent) {
  setContent(result.content);
  setEditorKey(prev => prev + 1);  // force remount
}

<RichTextEditor 
  key={editorKey}
  initialContent={content}
  onChange={setContent}
/>
```

**Option B: Imperative via editor instance**
```typescript
// In RichTextEditor, expose setContent method via ref
const editor = useEditor({ ... });

useImperativeHandle(ref, () => ({
  setContent: (html: string) => {
    editor?.commands.setContent(html);
  }
}));

// In PostForm
const editorRef = useRef<{ setContent: (html: string) => void }>(null);

function handleAIGenerate(result: GeneratedContent) {
  setContent(result.content);
  editorRef.current?.setContent(result.content);
}
```

**Recommendation:** Use Option A (key-based remount) for simplicity and to avoid adding imperative APIs to the editor component.

---

### 4. LLM Provider Integration (New)

**Location:** `lib/services/aiService.ts`

**Purpose:** Encapsulates all LLM provider communication logic. Abstracts the OpenAI API so the Generate API route remains provider-agnostic.

**Function Signature:**
```typescript
interface GenerateContentParams {
  prompt: string;
  signal?: AbortSignal;  // for timeout handling
}

async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContent>
```

**OpenAI Integration:**
- Use OpenAI Chat Completions API (`gpt-4` or `gpt-3.5-turbo`)
- System prompt: Instruct the model to return JSON with `title` and `content` fields
- User prompt: Pass through the author's prompt
- Parse response and extract structured data

**System Prompt Example:**
```
You are a helpful writing assistant for a blog platform. 
Generate a blog post based on the user's prompt. 
Return your response as JSON with this exact structure:
{
  "title": "A compelling blog post title",
  "content": "<p>HTML-formatted blog post content with proper structure</p>"
}

The content should be well-structured HTML using tags like <h2>, <p>, <ul>, <ol>, <blockquote>, <strong>, <em>.
Do not include <h1> tags (the title is separate).
Aim for 300-500 words unless the prompt specifies otherwise.
```

**Error Handling:**
- Throw descriptive errors for network failures, API errors, parsing failures
- Let the API route catch and convert to appropriate HTTP responses

**Environment Variable:**
- Read `OPENAI_API_KEY` from `process.env`
- Throw error if not set (caught by API route → 500 response)

---

## Data Models

### GeneratedContent

```typescript
interface GeneratedContent {
  title: string;    // non-empty, plain text
  content: string;  // non-empty, HTML string
}
```

**Validation Rules:**
- `title`: Non-empty string after trimming
- `content`: Non-empty string after trimming, should be valid HTML

**Usage:**
- Returned by `/api/ai/generate`
- Passed to `PostForm.handleAIGenerate()`
- Injected into form state via `setTitle()` and `setContent()`

---

### API Request/Response Types

**Generate Request:**
```typescript
interface GenerateRequest {
  prompt: string;
}
```

**Generate Response (Success):**
```typescript
interface GenerateResponse {
  title: string;
  content: string;
}
```

**Generate Response (Error):**
```typescript
interface ErrorResponse {
  error: string;
}
```

---

## Error Handling

### Client-Side Error Handling (AIAssistant)

**Error Sources:**
1. **Validation Error**: Empty prompt
2. **Network Error**: Fetch fails (no response)
3. **HTTP Error**: API returns 4xx or 5xx

**Error Display:**
- Inline error area below prompt input
- Red text with `role="alert"` for accessibility
- Cleared on next submission attempt

**Error Messages:**
- Validation: "Please enter a prompt before generating."
- Network: "Network error. Please check your connection and try again."
- HTTP: Use `error` field from response body

**State Preservation:**
- Errors never modify existing form field values
- User can correct prompt and retry without page reload

---

### Server-Side Error Handling (Generate API)

**Error Scenarios:**

| Scenario | Status | Error Message |
|----------|--------|---------------|
| Missing/empty prompt | 400 | "Prompt is required." |
| Unauthenticated | 401 | "Unauthorised" |
| Non-author role | 403 | "Forbidden" |
| Missing `OPENAI_API_KEY` | 500 | "AI service is not configured." |
| LLM timeout (>30s) | 504 | "AI service timed out. Please try again." |
| LLM invalid response | 502 | "AI returned an unexpected response format." |
| LLM empty response | 502 | "AI returned an empty response." |
| LLM API error | 502 | "AI service error. Please try again." |

**Logging:**
- Log all 500 errors server-side with descriptive context
- Log LLM API errors with request/response details (sanitize API key)
- Use `console.error` with route prefix: `[POST /api/ai/generate]`

---

### Timeout Implementation

**Client-Side:**
- No explicit timeout (rely on browser defaults)
- Display loading state while waiting

**Server-Side:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const result = await generateContent({ 
    prompt, 
    signal: controller.signal 
  });
  clearTimeout(timeoutId);
  return Response.json(result, { status: 200 });
} catch (err) {
  clearTimeout(timeoutId);
  if (err.name === 'AbortError') {
    return Response.json(
      { error: 'AI service timed out. Please try again.' },
      { status: 504 }
    );
  }
  throw err;
}
```

---

## Testing Strategy

### Unit Tests

**AIAssistant Component:**
- Renders prompt input and generate button
- Disables button when prompt is empty
- Shows validation error when generate clicked with empty prompt
- Disables input and button during generation
- Displays error message from API response
- Clears error on new submission
- Calls `onGenerate` callback with result on success

**Generate API Route:**
- Returns 400 for missing/empty prompt
- Returns 401 for unauthenticated requests
- Returns 403 for non-author roles
- Returns 500 when `OPENAI_API_KEY` is not set
- Returns 502 for invalid LLM response format
- Returns 502 for empty title or content
- Returns 504 on timeout
- Returns 200 with valid `GeneratedContent` on success
- Logs errors appropriately

**aiService.ts:**
- Throws error when `OPENAI_API_KEY` is not set
- Constructs correct OpenAI API request
- Parses valid JSON response correctly
- Throws error for invalid JSON
- Throws error for missing title/content fields
- Respects abort signal for timeout

**PostForm Integration:**
- `handleAIGenerate` updates title and content state
- `handleAIGenerate` clears validation errors for title and content
- RichTextEditor displays updated content after generation
- Form submission works correctly with AI-generated content

---

### Integration Tests

**End-to-End Flow:**
1. Author logs in and navigates to post creation form
2. Enters prompt in AI assistant
3. Clicks generate button
4. Waits for response (mock LLM API)
5. Verifies title and content fields are populated
6. Edits generated content
7. Submits form successfully

**Error Scenarios:**
1. Generate with empty prompt → validation error displayed
2. Generate with network error → network error displayed
3. Generate with LLM timeout → timeout error displayed
4. Generate with invalid LLM response → format error displayed
5. Unauthenticated user attempts to access API → 401 response
6. Reader role attempts to access API → 403 response

---

### Manual Testing Checklist

- [ ] AI assistant section is visually distinct but consistent with form design
- [ ] Generate button uses secondary/accent style (not competing with primary submit button)
- [ ] Prompt input and button are disabled during generation
- [ ] Loading state shows "Generating…" text
- [ ] Error messages are displayed inline below prompt input
- [ ] Generated title populates title field correctly
- [ ] Generated content populates RichTextEditor correctly
- [ ] RichTextEditor is immediately editable after generation
- [ ] Validation errors are cleared when AI content is injected
- [ ] Form submission works with AI-generated content
- [ ] Retry after error works without page reload
- [ ] API key is never exposed in browser (check Network tab)
- [ ] Server logs descriptive errors for 500 responses

---

## Security Considerations

### API Key Protection

**Requirements:**
1. `OPENAI_API_KEY` must be stored in server-side environment variables only
2. Never include API key in HTTP responses, headers, or client-accessible code
3. Log errors without exposing API key

**Implementation:**
```typescript
// lib/services/aiService.ts
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Use apiKey only in server-side fetch calls
// Never return it in any response
```

**Verification:**
- Check browser Network tab: no API key in any request/response
- Check browser Sources tab: no API key in any loaded JavaScript
- Check server logs: errors logged without exposing full API key

---

### Authentication and Authorization

**Requirements:**
1. Only authenticated users can access `/api/ai/generate`
2. Only users with `author` role can generate content
3. Use existing JWT-based auth system

**Implementation:**
- Middleware already enforces auth for `/api/posts/*` routes
- Add `/api/ai/*` to middleware matcher in `proxy.ts`
- Read `x-user-role` header in API route
- Return 403 if role is not `author`

**Middleware Update:**
```typescript
// proxy.ts
export const config = {
  matcher: [
    '/api/posts/:path*',
    '/api/comments/:path*',
    '/api/upload/:path*',
    '/api/ai/:path*',        // ADD THIS
    '/dashboard/:path*',
  ],
};
```

**API Route Auth Check:**
```typescript
// app/api/ai/generate/route.ts
export async function POST(request: NextRequest): Promise<Response> {
  const userRole = request.headers.get('x-user-role');
  
  if (userRole !== 'author') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... rest of handler
}
```

---

### Input Validation and Sanitization

**Prompt Validation:**
- Client-side: Check non-empty before submission
- Server-side: Validate prompt is non-empty string
- No sanitization needed (prompt is not rendered in HTML)

**LLM Response Sanitization:**
- The `content` field contains HTML that will be rendered in the editor
- The existing `RichTextEditor` component uses Tiptap, which sanitizes HTML by default
- The `PostForm` already uses `sanitize-html` for content before submission (via `postService.ts`)
- No additional sanitization needed in the AI flow

**Validation Schema:**
```typescript
// lib/validation/aiSchemas.ts
import { z } from 'zod';

export const generateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
```

---

## UI/UX Design

### Visual Design

**AI Assistant Section:**
```
┌─────────────────────────────────────────────────────┐
│ AI Writing Assistant                                │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Enter a prompt to generate content...       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Generate]                                          │
│                                                     │
│ ⚠ Error message appears here                       │
└─────────────────────────────────────────────────────┘
```

**Styling Guidelines:**
- Use existing CSS custom properties (`--brand`, `--border`, `--surface`, etc.)
- Use Tailwind utility classes consistent with existing components
- Section background: `bg-[var(--background-subtle)]`
- Border: `border border-[var(--border)]`
- Rounded corners: `rounded-xl`
- Padding: `p-4` or `p-5`

**Generate Button:**
- Style: Secondary/accent (not primary)
- Color: `bg-[var(--brand-subtle)] text-[var(--brand)]` or similar
- Hover: `hover:bg-[var(--brand)] hover:text-white`
- Disabled: `disabled:opacity-60 disabled:cursor-not-allowed`
- Loading state: Show spinner + "Generating…" text

**Error Display:**
- Text color: `text-[var(--error)]`
- Font size: `text-xs` or `text-sm`
- Role: `role="alert"` for accessibility
- Icon: Optional warning icon

---

### Accessibility

**Keyboard Navigation:**
- Prompt input is focusable
- Generate button is focusable and activatable via Enter/Space
- Tab order: Prompt → Generate → Title → Cover → Content → Status → Submit

**Screen Reader Support:**
- Label prompt input: `<label for="ai-prompt">AI Prompt</label>`
- Button has descriptive text: "Generate" (not just an icon)
- Error messages use `role="alert"` for immediate announcement
- Loading state announced: "Generating…" button text

**ARIA Attributes:**
- `aria-required="false"` on prompt input (it's optional)
- `aria-invalid="true"` on prompt input when validation error shown
- `aria-describedby` linking input to error message
- `aria-busy="true"` on button during generation

---

### Responsive Design

**Mobile (<768px):**
- Full-width prompt input
- Full-width generate button
- Stack vertically with consistent spacing

**Tablet (768px-1024px):**
- Same as mobile (form is already single-column)

**Desktop (>1024px):**
- Prompt input and button can be inline or stacked (stacked is simpler)
- Maintain consistent spacing with other form fields

---

## Implementation Plan

### Phase 1: Server-Side Foundation
1. Create `lib/services/aiService.ts` with OpenAI integration
2. Create `app/api/ai/generate/route.ts` with auth, validation, error handling
3. Update `proxy.ts` middleware matcher to include `/api/ai/*`
4. Add `OPENAI_API_KEY` to `.env.local` (document in README)
5. Write unit tests for `aiService.ts` and API route

### Phase 2: Client-Side Component
1. Create `components/posts/AIAssistant.tsx` with prompt input, button, error display
2. Implement loading states and error handling
3. Write unit tests for `AIAssistant` component

### Phase 3: PostForm Integration
1. Import and render `AIAssistant` in `PostForm.tsx`
2. Implement `handleAIGenerate` callback
3. Update `RichTextEditor` to support programmatic content updates (key-based remount)
4. Clear validation errors when AI content is injected
5. Write integration tests for the full flow

### Phase 4: Testing and Polish
1. Manual testing of all error scenarios
2. Verify API key is never exposed
3. Test with real OpenAI API (not just mocks)
4. Accessibility audit (keyboard nav, screen reader)
5. Visual polish and responsive design verification

---

## Dependencies

### New Dependencies
**None.** The feature uses existing dependencies:
- `openai` package is NOT required (use native `fetch`)
- `zod` for validation (already installed)
- `next` for API routes (already installed)

### Environment Variables
**New:**
- `OPENAI_API_KEY`: OpenAI API key for content generation

**Existing:**
- `JWT_SECRET`: For auth (already used)
- `MONGODB_URI`: For database (already used)

---

## Deployment Considerations

### Environment Setup
1. Add `OPENAI_API_KEY` to production environment variables
2. Verify middleware matcher includes `/api/ai/*`
3. Test with production OpenAI API (not mock)

### Monitoring
- Log all 500 errors with descriptive context
- Monitor OpenAI API usage and costs
- Track generation success/failure rates
- Alert on high error rates or timeouts

### Rate Limiting (Future Enhancement)
- Consider adding rate limiting to prevent abuse
- Limit generations per user per hour/day
- Return 429 status when limit exceeded

### Cost Management
- Monitor OpenAI API costs
- Consider caching common prompts (future)
- Set usage alerts in OpenAI dashboard

---

## Future Enhancements

### Short-Term
1. **Prompt Templates**: Provide example prompts for common article types
2. **Regenerate Button**: Allow regenerating without clearing the prompt
3. **Partial Generation**: Generate title only or content only
4. **Tone/Style Options**: Let authors specify tone (formal, casual, technical)

### Medium-Term
1. **Prompt History**: Save recent prompts for reuse
2. **Content Refinement**: "Improve this section" or "Make it shorter"
3. **Multi-Language Support**: Generate content in different languages
4. **SEO Suggestions**: Generate meta descriptions, keywords

### Long-Term
1. **Image Generation**: Generate cover images with DALL-E
2. **Content Analysis**: Suggest improvements to existing posts
3. **Plagiarism Check**: Verify generated content is original
4. **A/B Testing**: Generate multiple variations for comparison

---

## Open Questions

1. **LLM Model Selection**: Use GPT-4 (higher quality, slower, more expensive) or GPT-3.5-turbo (faster, cheaper)?
   - **Recommendation**: Start with GPT-3.5-turbo, add model selection later

2. **Content Length**: Should we enforce a max length for generated content?
   - **Recommendation**: No hard limit, but guide the model via system prompt (300-500 words default)

3. **Prompt Validation**: Should we validate prompt content (e.g., block offensive language)?
   - **Recommendation**: No client-side filtering; rely on OpenAI's content policy

4. **Retry Logic**: Should we auto-retry on transient errors?
   - **Recommendation**: No auto-retry; let the user manually retry

5. **Progress Indicator**: Should we show estimated time remaining?
   - **Recommendation**: No; just show "Generating…" (LLM response time is unpredictable)

---

## Conclusion

This design provides a complete, production-ready implementation of the AI Writing Assistant feature. It integrates seamlessly with the existing blog platform architecture, maintains security best practices, and provides a robust, user-friendly experience for authors.

The design prioritizes:
- **Security**: API key never exposed to client
- **Reliability**: Comprehensive error handling and timeout management
- **Usability**: Clear feedback, immediate editability, non-intrusive UI
- **Maintainability**: Clean separation of concerns, testable components
- **Extensibility**: Foundation for future enhancements

All seven requirements from the requirements document are fully addressed with detailed technical specifications for implementation.
