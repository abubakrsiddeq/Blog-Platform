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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="post-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title <span aria-hidden="true" className="text-red-500">*</span>
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
          className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
            ${errors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.title}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <div
          aria-invalid={!!errors.content}
          className={errors.content ? 'ring-2 ring-red-500 rounded-lg' : ''}
        >
          <RichTextEditor
            initialContent={initialData?.content}
            onChange={(html) => setContent(html)}
          />
        </div>
        {errors.content && (
          <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.content}
          </p>
        )}
      </div>

      {/* Image URL */}
      <div>
        <label
          htmlFor="post-image"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Image URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="post-image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white bg-white dark:bg-gray-800
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="post-status"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Status
        </label>
        <select
          id="post-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white bg-white dark:bg-gray-800
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
            text-white bg-blue-600 hover:bg-blue-700
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {mode === 'create' ? 'Create Post' : 'Update Post'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-medium
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
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
