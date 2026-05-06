'use client'

import { useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface GeneratedContent {
  title: string
  content: string
}

interface AIAssistantProps {
  onGenerate: (result: GeneratedContent) => void
  disabled?: boolean
}

export default function AIAssistant({ onGenerate, disabled = false }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    // Clear any previous error
    setError(null)

    // Validate prompt
    if (!prompt.trim()) {
      setError('Please enter a prompt before generating.')
      return
    }

    setGenerating(true)

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'An unexpected error occurred. Please try again.')
        return
      }

      onGenerate({ title: data.title, content: data.content })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setGenerating(false)
    }
  }

  const isDisabled = disabled || generating

  return (
    <section
      aria-label="BKR AI Assistant"
      className="bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        {/* Sparkle icon */}
        <svg
          className="h-4 w-4 text-[var(--brand)] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">BKR AI Assistant</h2>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ai-prompt"
          className="block text-xs font-medium text-[var(--foreground-muted)]"
        >
          Prompt
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the blog post you want to generate…"
          rows={3}
          disabled={isDisabled}
          aria-required="false"
          aria-invalid={error !== null ? true : undefined}
          aria-describedby={error !== null ? 'ai-prompt-error' : undefined}
          className="w-full px-3.5 py-2.5 rounded-lg border text-sm text-[var(--foreground)]
                     bg-[var(--surface)] placeholder-[var(--foreground-subtle)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-150 resize-none
                     border-[var(--border)]"
        />

        {error && (
          <p
            id="ai-prompt-error"
            role="alert"
            className="text-xs text-[var(--error)]"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isDisabled}
        aria-busy={generating}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                   border border-[var(--brand)] text-[var(--brand)]
                   bg-transparent hover:bg-[var(--brand)] hover:text-white
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        {generating ? (
          <>
            <LoadingSpinner size="sm" />
            Generating…
          </>
        ) : (
          'Generate'
        )}
      </button>
    </section>
  )
}
