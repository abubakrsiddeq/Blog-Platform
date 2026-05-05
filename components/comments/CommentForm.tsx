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
  const [focused, setFocused] = useState(false)

  const isAuthenticated = !!state.user
  const user = state.user
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : ''

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-2xl
                      bg-[var(--surface)] border border-[var(--border)]
                      shadow-[var(--shadow-sm)]">
        <div className="h-10 w-10 rounded-full bg-[var(--background-subtle)] border border-[var(--border)]
                        flex items-center justify-center shrink-0">
          <svg className="h-5 w-5 text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--foreground-muted)]">
            <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">
              Sign in
            </Link>{' '}
            to join the conversation.
          </p>
        </div>
        <Link
          href="/login"
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white
                     bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                     transition-colors duration-150 shadow-sm"
        >
          Sign in
        </Link>
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
    <form onSubmit={handleSubmit} noValidate>
      <div className={`flex gap-3 p-4 rounded-2xl border transition-all duration-200
                       bg-[var(--surface)] shadow-[var(--shadow-sm)]
                       ${focused
                         ? 'border-[var(--brand)]/50 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
                         : 'border-[var(--border)]'
                       }`}>
        {/* User avatar */}
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                     text-[10px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Input area */}
        <div className="flex-1 space-y-3">
          <div>
            <label htmlFor="comment-content" className="sr-only">Write a comment</label>
            <textarea
              id="comment-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={focused || content ? 3 : 1}
              placeholder="Write a comment…"
              aria-required="true"
              aria-describedby={contentError ? 'comment-error' : undefined}
              aria-invalid={!!contentError}
              className={`w-full bg-transparent text-sm text-[var(--foreground)]
                          placeholder-[var(--foreground-subtle)]
                          focus:outline-none resize-none transition-all duration-200
                          ${contentError ? 'text-[var(--error)]' : ''}`}
            />
            {contentError && (
              <p id="comment-error" role="alert" className="text-xs text-[var(--error)] mt-1">
                {contentError}
              </p>
            )}
          </div>

          {/* Submit row — only visible when focused or has content */}
          {(focused || content) && (
            <div className="flex items-center justify-between animate-fade-in">
              <span className="text-xs text-[var(--foreground-subtle)]">
                {content.length > 0 && `${content.length} chars`}
              </span>
              <div className="flex items-center gap-2">
                {content && (
                  <button
                    type="button"
                    onClick={() => { setContent(''); setContentError(null) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium
                               text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                               hover:bg-[var(--background-subtle)] transition-colors duration-150"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                             text-xs font-semibold text-white
                             bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-150 shadow-sm"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  )
}
