/**
 * Unit tests for components/posts/AIAssistant.tsx
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AIAssistant from '../AIAssistant'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a resolved fetch mock returning the given body and status. */
function mockFetchSuccess(body: object) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

/** Build a fetch mock that returns an HTTP error with a JSON error body. */
function mockFetchHttpError(status: number, errorBody: object) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(errorBody),
  })
}

/** Build a fetch mock that rejects (network error). */
function mockFetchNetworkError(message = 'Failed to fetch') {
  return jest.fn().mockRejectedValue(new TypeError(message))
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

afterEach(() => {
  jest.restoreAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AIAssistant', () => {
  // ── Requirement 1.1 — Renders prompt input and Generate button ───────────────
  describe('rendering', () => {
    it('renders the prompt textarea', () => {
      render(<AIAssistant onGenerate={jest.fn()} />)
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument()
    })

    it('renders the Generate button', () => {
      render(<AIAssistant onGenerate={jest.fn()} />)
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
    })
  })

  // ── Requirement 1.2 — Validation error on empty prompt ──────────────────────
  describe('empty prompt validation', () => {
    it('shows a validation error when Generate is clicked with an empty prompt', async () => {
      global.fetch = mockFetchSuccess({ title: 'T', content: '<p>C</p>' })

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Please enter a prompt before generating.')
    })

    it('does not call fetch when the prompt is empty', () => {
      const fetchSpy = jest.fn()
      global.fetch = fetchSpy

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does not call fetch when the prompt contains only whitespace', () => {
      const fetchSpy = jest.fn()
      global.fetch = fetchSpy

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: '   ' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // ── Requirement 1.3 — Disabled state during generation ──────────────────────
  describe('disabled state during generation', () => {
    it('disables the prompt input while generating', async () => {
      // Use a promise we control so we can inspect mid-flight state
      let resolveFetch!: (value: unknown) => void
      global.fetch = jest.fn().mockReturnValue(
        new Promise(resolve => {
          resolveFetch = resolve
        }),
      )

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      // Input should be disabled while the fetch is in-flight
      expect(screen.getByLabelText(/prompt/i)).toBeDisabled()

      // Clean up — resolve the fetch so the component settles
      await act(async () => {
        resolveFetch({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ title: 'T', content: '<p>C</p>' }),
        })
      })
    })

    it('disables the Generate button while generating', async () => {
      let resolveFetch!: (value: unknown) => void
      global.fetch = jest.fn().mockReturnValue(
        new Promise(resolve => {
          resolveFetch = resolve
        }),
      )

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()

      await act(async () => {
        resolveFetch({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ title: 'T', content: '<p>C</p>' }),
        })
      })
    })
  })

  // ── Requirement 1.4 — Button label during generation ────────────────────────
  describe('button label during generation', () => {
    it('shows "Generating…" on the button while generating', async () => {
      let resolveFetch!: (value: unknown) => void
      global.fetch = jest.fn().mockReturnValue(
        new Promise(resolve => {
          resolveFetch = resolve
        }),
      )

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(screen.getByRole('button', { name: /generating/i })).toBeInTheDocument()

      await act(async () => {
        resolveFetch({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ title: 'T', content: '<p>C</p>' }),
        })
      })
    })
  })

  // ── Requirement 1.5 — Successful response calls onGenerate ──────────────────
  describe('successful generation', () => {
    it('calls onGenerate with { title, content } on a successful response', async () => {
      const onGenerate = jest.fn()
      global.fetch = mockFetchSuccess({
        title: 'TypeScript Best Practices',
        content: '<p>TypeScript is great.</p>',
      })

      render(<AIAssistant onGenerate={onGenerate} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledWith({
          title: 'TypeScript Best Practices',
          content: '<p>TypeScript is great.</p>',
        })
      })
    })
  })

  // ── Requirement 1.6 / 5.3 — HTTP error displays error message ───────────────
  describe('HTTP error handling', () => {
    it('displays the error message from the response body on an HTTP error', async () => {
      global.fetch = mockFetchHttpError(502, {
        error: 'AI returned an unexpected response format.',
      })

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('AI returned an unexpected response format.')
    })

    it('displays a fallback error message when the HTTP error body has no error field', async () => {
      global.fetch = mockFetchHttpError(500, {})

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('An unexpected error occurred. Please try again.')
    })
  })

  // ── Requirement 5.4 — Network error displays network error message ───────────
  describe('network error handling', () => {
    it('displays the network error message when fetch rejects', async () => {
      global.fetch = mockFetchNetworkError()

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Network error. Please check your connection and try again.')
    })
  })

  // ── Requirement 5.1 — Error cleared on new submission ───────────────────────
  describe('error cleared on new submission', () => {
    it('clears the previous error when a new generation request is submitted', async () => {
      // First call fails
      global.fetch = mockFetchNetworkError()

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      // Wait for the error to appear
      await screen.findByRole('alert')

      // Second call succeeds
      global.fetch = mockFetchSuccess({
        title: 'TypeScript Best Practices',
        content: '<p>TypeScript is great.</p>',
      })

      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      // The alert should disappear while the new request is in-flight
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  // ── Requirement 5.2 / 5.5 — Re-enabled after generation completes or fails ──
  describe('re-enabled after generation', () => {
    it('re-enables the input and button after a successful generation', async () => {
      global.fetch = mockFetchSuccess({
        title: 'TypeScript Best Practices',
        content: '<p>TypeScript is great.</p>',
      })

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/prompt/i)).not.toBeDisabled()
        expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled()
      })
    })

    it('re-enables the input and button after a failed generation', async () => {
      global.fetch = mockFetchNetworkError()

      render(<AIAssistant onGenerate={jest.fn()} />)
      fireEvent.change(screen.getByLabelText(/prompt/i), {
        target: { value: 'Write about TypeScript' },
      })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/prompt/i)).not.toBeDisabled()
        expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled()
      })
    })
  })
})
