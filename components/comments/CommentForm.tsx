'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Toast from '@/components/ui/Toast'

interface CommentFormProps {
  postId: string
  onCommentAdded?: () => void
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export default function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const { state } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  const isAuthenticated = !!state.user

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
        <div className="h-8 w-8 rounded-full bg-[var(--border)] flex items-center justify-center shrink-0">
          <svg className="h-4 w-4 text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">
            Sign in
          </Link>{' '}
          to leave a comment.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setContentError(null)

    if (!content.trim()) {
      setContentError('Comment cannot be empty')
      return
    }

    setSubmitting(true)
    setToast(null)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: content.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ message: data.error ?? 'Failed to post comment', type: 'error' })
        return
      }

      setContent('')
      setToast({ message: 'Comment posted!', type: 'success' })
      onCommentAdded?.()
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="comment-content"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          Leave a comment
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share your thoughts…"
          aria-required="true"
          aria-describedby={contentError ? 'comment-error' : undefined}
          aria-invalid={!!contentError}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent resize-y transition-all duration-150 ${
            contentError ? 'border-[var(--error)]' : 'border-[var(--border)]'
          }`}
        />
        {contentError && (
          <p id="comment-error" role="alert" className="text-xs text-[var(--error)]">
            {contentError}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  )
}
