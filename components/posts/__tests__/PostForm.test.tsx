/**
 * Integration tests for PostForm + AIAssistant flow
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3
 *
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PostForm from '../PostForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/navigation — PostForm calls useRouter().push on success
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock next/image — not relevant to these tests
jest.mock('next/image', () => {
  const MockImage = ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  )
  MockImage.displayName = 'MockImage'
  return MockImage
})

/**
 * Mock RichTextEditor to avoid Tiptap jsdom issues.
 *
 * The mock renders a <textarea data-testid="rich-text-editor"> that:
 *  - Displays the initialContent as its value so tests can assert on it.
 *  - Calls onChange with initialContent immediately on mount so PostForm's
 *    content state is kept in sync (mirrors what the real editor does on load).
 *  - Exposes the `initialContent` prop via data-initial-content so tests can
 *    verify the value passed to the editor after AI generation.
 */
jest.mock('@/components/editor/RichTextEditor', () => {
  const MockRichTextEditor = ({
    initialContent = '',
    onChange,
  }: {
    initialContent?: string
    onChange: (html: string) => void
  }) => {
    // Sync content state on mount / when initialContent changes (key-based remount)
    React.useEffect(() => {
      onChange(initialContent)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <textarea
        data-testid="rich-text-editor"
        data-initial-content={initialContent}
        value={initialContent}
        onChange={e => onChange(e.target.value)}
        aria-label="Content editor"
      />
    )
  }
  MockRichTextEditor.displayName = 'MockRichTextEditor'
  return MockRichTextEditor
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate a successful AI generate fetch response. */
function mockAIGenerateSuccess(title: string, content: string) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ title, content }),
  })
}

/** Simulate a successful post submit fetch response. */
function mockPostSubmitSuccess(postData: object = { id: '123' }) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: () => Promise.resolve(postData),
  })
}

/**
 * Build a fetch mock that routes calls based on URL:
 *  - /api/ai/generate → AI response
 *  - /api/posts       → submit response
 */
function mockFetchRouter(
  aiResponse: { title: string; content: string },
  submitResponse: object = { id: '123' },
) {
  return jest.fn().mockImplementation((url: string) => {
    if (url === '/api/ai/generate') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(aiResponse),
      })
    }
    // Default: post submit
    return Promise.resolve({
      ok: true,
      status: 201,
      json: () => Promise.resolve(submitResponse),
    })
  })
}

/** Type a value into the AI prompt textarea and click Generate. */
async function triggerAIGenerate(prompt: string) {
  const promptInput = screen.getByLabelText(/prompt/i)
  fireEvent.change(promptInput, { target: { value: prompt } })
  fireEvent.click(screen.getByRole('button', { name: /generate/i }))
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

afterEach(() => {
  jest.restoreAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PostForm + AIAssistant integration', () => {
  // ── Requirement 3.1 — handleAIGenerate updates the title input ───────────────
  describe('Requirement 3.1 — title field is updated after AI generation', () => {
    it('sets the title input value to the AI-generated title', async () => {
      global.fetch = mockAIGenerateSuccess(
        'TypeScript Best Practices',
        '<p>TypeScript is great.</p>',
      )

      render(<PostForm mode="create" />)

      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      await waitFor(() => {
        const titleInput = screen.getByRole('textbox', { name: /title/i })
        expect(titleInput).toHaveValue('TypeScript Best Practices')
      })
    })

    it('replaces any pre-existing title with the AI-generated title', async () => {
      global.fetch = mockAIGenerateSuccess('New AI Title', '<p>New content.</p>')

      render(
        <PostForm
          mode="edit"
          postId="abc"
          initialData={{
            title: 'Old Manual Title',
            content: '<p>Old content.</p>',
            status: 'draft',
          }}
        />,
      )

      // Verify initial title is present
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Old Manual Title')

      await act(async () => {
        await triggerAIGenerate('Rewrite the post')
      })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('New AI Title')
      })
    })
  })

  // ── Requirement 3.2 — handleAIGenerate updates content / remounts editor ─────
  describe('Requirement 3.2 — RichTextEditor remounts with new content after AI generation', () => {
    it('passes the AI-generated content as initialContent to RichTextEditor', async () => {
      global.fetch = mockAIGenerateSuccess(
        'TypeScript Best Practices',
        '<p>TypeScript is great.</p>',
      )

      render(<PostForm mode="create" />)

      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      await waitFor(() => {
        const editor = screen.getByTestId('rich-text-editor')
        expect(editor).toHaveAttribute('data-initial-content', '<p>TypeScript is great.</p>')
      })
    })

    it('remounts the RichTextEditor (key changes) so new content is reflected', async () => {
      global.fetch = mockAIGenerateSuccess(
        'First AI Title',
        '<p>First AI content.</p>',
      )

      render(<PostForm mode="create" />)

      // Capture the initial editor instance key via data-initial-content (empty on first render)
      const editorBefore = screen.getByTestId('rich-text-editor')
      const initialContent = editorBefore.getAttribute('data-initial-content')

      await act(async () => {
        await triggerAIGenerate('Write something')
      })

      await waitFor(() => {
        const editorAfter = screen.getByTestId('rich-text-editor')
        // After generation the initialContent prop must differ from the original
        expect(editorAfter.getAttribute('data-initial-content')).not.toEqual(initialContent)
        expect(editorAfter.getAttribute('data-initial-content')).toBe('<p>First AI content.</p>')
      })
    })
  })

  // ── Requirement 3.4 — handleAIGenerate clears validation errors ──────────────
  describe('Requirement 3.4 — validation errors on title and content are cleared after AI generation', () => {
    it('clears the title validation error after AI generation', async () => {
      global.fetch = mockAIGenerateSuccess(
        'AI Generated Title',
        '<p>AI generated content.</p>',
      )

      render(<PostForm mode="create" />)

      // Trigger validation errors by submitting an empty form
      fireEvent.submit(screen.getByRole('button', { name: /publish post/i }).closest('form')!)

      // Wait for the title error to appear
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })

      // Now trigger AI generation
      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      // Title error should be gone
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
      })
    })

    it('clears the content validation error after AI generation', async () => {
      global.fetch = mockAIGenerateSuccess(
        'AI Generated Title',
        '<p>AI generated content.</p>',
      )

      render(<PostForm mode="create" />)

      // Trigger validation errors by submitting an empty form
      fireEvent.submit(screen.getByRole('button', { name: /publish post/i }).closest('form')!)

      // Wait for the content error to appear
      await waitFor(() => {
        expect(screen.getByText('Content is required')).toBeInTheDocument()
      })

      // Now trigger AI generation
      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      // Content error should be gone
      await waitFor(() => {
        expect(screen.queryByText('Content is required')).not.toBeInTheDocument()
      })
    })

    it('clears both title and content validation errors simultaneously', async () => {
      global.fetch = mockAIGenerateSuccess(
        'AI Generated Title',
        '<p>AI generated content.</p>',
      )

      render(<PostForm mode="create" />)

      // Trigger both validation errors
      fireEvent.submit(screen.getByRole('button', { name: /publish post/i }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
        expect(screen.getByText('Content is required')).toBeInTheDocument()
      })

      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Content is required')).not.toBeInTheDocument()
      })
    })
  })

  // ── Requirement 3.3 — Other form fields are unchanged after AI generation ────
  describe('Requirement 3.3 — other form fields are preserved after AI generation', () => {
    it('does not change the status field after AI generation', async () => {
      global.fetch = mockAIGenerateSuccess('AI Title', '<p>AI content.</p>')

      render(
        <PostForm
          mode="edit"
          postId="abc"
          initialData={{
            title: 'Existing Title',
            content: '<p>Existing content.</p>',
            status: 'published',
          }}
        />,
      )

      // Verify initial status
      expect(screen.getByRole('button', { name: /published/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: /draft/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      )

      await act(async () => {
        await triggerAIGenerate('Rewrite the post')
      })

      await waitFor(() => {
        // Status should remain 'published'
        expect(screen.getByRole('button', { name: /published/i })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        expect(screen.getByRole('button', { name: /draft/i })).toHaveAttribute(
          'aria-pressed',
          'false',
        )
      })
    })

    it('does not change the status when it was draft before AI generation', async () => {
      global.fetch = mockAIGenerateSuccess('AI Title', '<p>AI content.</p>')

      render(
        <PostForm
          mode="create"
          initialData={{
            title: '',
            content: '',
            status: 'draft',
          }}
        />,
      )

      // Default status is draft
      expect(screen.getByRole('button', { name: /draft/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )

      await act(async () => {
        await triggerAIGenerate('Write something')
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /draft/i })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        expect(screen.getByRole('button', { name: /published/i })).toHaveAttribute(
          'aria-pressed',
          'false',
        )
      })
    })
  })

  // ── Requirements 4.1, 4.2, 4.3 — Form can be submitted with AI-generated content
  describe('Requirements 4.1–4.3 — form can be submitted successfully with AI-generated content', () => {
    it('submits the form with AI-generated title and content', async () => {
      const fetchMock = mockFetchRouter(
        { title: 'AI Generated Title', content: '<p>AI generated content.</p>' },
        { id: '456', title: 'AI Generated Title' },
      )
      global.fetch = fetchMock

      render(<PostForm mode="create" />)

      // Trigger AI generation
      await act(async () => {
        await triggerAIGenerate('Write about TypeScript')
      })

      // Wait for title to be populated
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('AI Generated Title')
      })

      // Submit the form
      await act(async () => {
        fireEvent.submit(
          screen.getByRole('button', { name: /publish post/i }).closest('form')!,
        )
      })

      // Verify the submit fetch was called with the AI-generated content
      await waitFor(() => {
        const calls = fetchMock.mock.calls
        const submitCall = calls.find(([url]: [string]) => url === '/api/posts')
        expect(submitCall).toBeDefined()

        const [, options] = submitCall!
        const body = JSON.parse(options.body)
        expect(body.title).toBe('AI Generated Title')
        expect(body.content).toBe('<p>AI generated content.</p>')
      })
    })

    it('shows a success toast after submitting AI-generated content', async () => {
      global.fetch = mockFetchRouter(
        { title: 'AI Title', content: '<p>AI content.</p>' },
        { id: '789' },
      )

      render(<PostForm mode="create" />)

      await act(async () => {
        await triggerAIGenerate('Write something')
      })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('AI Title')
      })

      await act(async () => {
        fireEvent.submit(
          screen.getByRole('button', { name: /publish post/i }).closest('form')!,
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Post created successfully!')).toBeInTheDocument()
      })
    })

    it('allows editing the AI-generated title before submitting', async () => {
      const fetchMock = mockFetchRouter(
        { title: 'AI Title', content: '<p>AI content.</p>' },
        { id: '999' },
      )
      global.fetch = fetchMock

      render(<PostForm mode="create" />)

      await act(async () => {
        await triggerAIGenerate('Write something')
      })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('AI Title')
      })

      // Edit the title after AI generation (Requirement 4.1)
      fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
        target: { value: 'Manually Edited Title' },
      })

      await act(async () => {
        fireEvent.submit(
          screen.getByRole('button', { name: /publish post/i }).closest('form')!,
        )
      })

      await waitFor(() => {
        const calls = fetchMock.mock.calls
        const submitCall = calls.find(([url]: [string]) => url === '/api/posts')
        expect(submitCall).toBeDefined()

        const [, options] = submitCall!
        const body = JSON.parse(options.body)
        expect(body.title).toBe('Manually Edited Title')
      })
    })

    it('validates AI-generated content the same as manually entered content (Requirement 4.3)', async () => {
      // AI returns empty title — form validation should catch it
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ title: '', content: '<p>Some content.</p>' }),
      })

      render(<PostForm mode="create" />)

      await act(async () => {
        await triggerAIGenerate('Write something')
      })

      // Wait for AI generation to complete (title will be empty string)
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('')
      })

      // Submit — should fail validation because title is empty
      fireEvent.submit(
        screen.getByRole('button', { name: /publish post/i }).closest('form')!,
      )

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })
    })
  })
})
