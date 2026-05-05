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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Login
        </Link>{' '}
        to leave a comment.
      </p>
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
      <div>
        <label
          htmlFor="comment-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Add a comment
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
          className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-colors
            ${contentError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {contentError && (
          <p id="comment-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {contentError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          text-white bg-blue-600 hover:bg-blue-700
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {submitting && <LoadingSpinner size="sm" />}
        Post Comment
      </button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  )
}
