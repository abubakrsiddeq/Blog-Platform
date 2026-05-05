'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/editor/RichTextEditor'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Toast from '@/components/ui/Toast'

interface PostFormInitialData {
  title: string
  content: string
  image?: string
  status: 'draft' | 'published'
}

interface PostFormProps {
  mode: 'create' | 'edit'
  initialData?: PostFormInitialData
  postId?: string
  onSuccess?: () => void
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

interface FormErrors {
  title?: string
  content?: string
}

export default function PostForm({ mode, initialData, postId, onSuccess }: PostFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [image, setImage] = useState(initialData?.image ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status ?? 'draft')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!content.trim() || content === '<p></p>') newErrors.content = 'Content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setToast(null)

    const body = {
      title: title.trim(),
      content,
      ...(image.trim() ? { image: image.trim() } : {}),
      status,
    }

    try {
      const url = mode === 'create' ? '/api/posts' : `/api/posts/${postId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({
          message: data.error ?? `Failed to ${mode === 'create' ? 'create' : 'update'} post`,
          type: 'error',
        })
        return
      }

      setToast({
        message: mode === 'create' ? 'Post created successfully!' : 'Post updated successfully!',
        type: 'success',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => router.push('/dashboard'), 800)
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase =
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all duration-150'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="post-title" className="block text-sm font-medium text-[var(--foreground)]">
          Title <span aria-hidden="true" className="text-[var(--error)]">*</span>
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          aria-required="true"
          aria-describedby={errors.title ? 'title-error' : undefined}
          aria-invalid={!!errors.title}
          className={`${inputBase} text-base font-medium ${errors.title ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-[var(--error)]">
            {errors.title}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--foreground)]">
          Content <span aria-hidden="true" className="text-[var(--error)]">*</span>
        </label>
        <div
          aria-invalid={!!errors.content}
          className={errors.content ? 'ring-2 ring-[var(--error)] rounded-xl' : ''}
        >
          <RichTextEditor
            initialContent={initialData?.content}
            onChange={(html) => setContent(html)}
          />
        </div>
        {errors.content && (
          <p role="alert" className="text-xs text-[var(--error)]">
            {errors.content}
          </p>
        )}
      </div>

      {/* Image URL */}
      <div className="space-y-1.5">
        <label htmlFor="post-image" className="block text-sm font-medium text-[var(--foreground)]">
          Cover image URL{' '}
          <span className="text-[var(--foreground-subtle)] font-normal">(optional)</span>
        </label>
        <input
          id="post-image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={`${inputBase} border-[var(--border)]`}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--foreground)]">
          Visibility
        </label>
        <div className="flex gap-2">
          {(['draft', 'published'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                status === s
                  ? s === 'published'
                    ? 'border-[var(--success)] bg-[var(--success-subtle)] text-[var(--success)] ring-1 ring-[var(--success)]'
                    : 'border-[var(--warning)] bg-[var(--warning-subtle)] text-[var(--warning)] ring-1 ring-[var(--warning)]'
                  : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--background-subtle)]'
              }`}
            >
              {s === 'published' ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {mode === 'create' ? 'Publish Post' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Cancel
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  )
}
