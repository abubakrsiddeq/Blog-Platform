'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  image?: string
}

// ── Cover Image Uploader ────────────────────────────────────────────────────

interface CoverUploaderProps {
  value: string          // current image URL (empty = none)
  onChange: (url: string) => void
  error?: string
}

function CoverUploader({ value, onChange, error }: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function uploadFile(file: File) {
    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB.')
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('image', file)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed. Please try again.')
        return
      }

      onChange(data.url)
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleRemove() {
    onChange('')
    setUploadError(null)
  }

  const displayError = uploadError ?? error

  // ── Preview state ──
  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background-subtle)]"
          style={{ paddingBottom: '42%' }}>
          <Image
            src={value}
            alt="Cover preview"
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         bg-white/90 text-zinc-800 hover:bg-white transition-colors duration-150"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         bg-red-500/90 text-white hover:bg-red-500 transition-colors duration-150"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="sr-only" onChange={handleFileInput} aria-label="Replace cover image" />
        {displayError && (
          <p role="alert" className="text-xs text-[var(--error)]">{displayError}</p>
        )}
      </div>
    )
  }

  // ── Drop zone state ──
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload cover image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer
                    flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
                    transition-all duration-200 select-none
                    ${dragOver
                      ? 'border-[var(--brand)] bg-[var(--brand)]/5 scale-[1.01]'
                      : 'border-[var(--border)] hover:border-[var(--brand)]/50 hover:bg-[var(--brand)]/3'
                    }
                    ${displayError ? 'border-[var(--error)]/60' : ''}`}
      >
        {uploading ? (
          <>
            <LoadingSpinner size="md" />
            <p className="text-sm text-[var(--foreground-muted)]">Uploading…</p>
          </>
        ) : (
          <>
            {/* Upload icon */}
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-200
                             ${dragOver ? 'bg-[var(--brand)]/15' : 'bg-[var(--background-subtle)]'}`}>
              <svg className={`h-6 w-6 transition-colors duration-200
                               ${dragOver ? 'text-[var(--brand)]' : 'text-[var(--foreground-subtle)]'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {dragOver ? 'Drop to upload' : 'Upload cover image'}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Drag &amp; drop or{' '}
                <span className="text-[var(--brand)] font-medium">browse</span>
                {' '}· JPEG, PNG, WebP · max 5 MB
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileInput}
        aria-label="Upload cover image"
      />

      {displayError && (
        <p role="alert" className="text-xs text-[var(--error)]">{displayError}</p>
      )}
    </div>
  )
}

// ── PostForm ────────────────────────────────────────────────────────────────

export default function PostForm({ mode, initialData, postId, onSuccess }: PostFormProps) {
  const router = useRouter()

  const [title, setTitle]   = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [image, setImage]   = useState(initialData?.image ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status ?? 'draft')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]   = useState<ToastState | null>(null)

  function validate(): boolean {
    const e: FormErrors = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!content.trim() || content === '<p></p>') e.content = 'Content is required'
    if (!image.trim()) e.image = 'Cover image is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setToast(null)

    const body = {
      title: title.trim(),
      content,
      ...(image ? { image } : {}),
      status,
    }

    try {
      const url    = mode === 'create' ? '/api/posts' : `/api/posts/${postId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ message: data.error ?? `Failed to ${mode === 'create' ? 'create' : 'update'} post`, type: 'error' })
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
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter post title"
          aria-required="true"
          aria-describedby={errors.title ? 'title-error' : undefined}
          aria-invalid={!!errors.title}
          className={`${inputBase} text-base font-medium ${errors.title ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-[var(--error)]">{errors.title}</p>
        )}
      </div>

      {/* Cover image */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--foreground)]">
          Cover image <span aria-hidden="true" className="text-[var(--error)]">*</span>
        </label>
        <CoverUploader value={image} onChange={setImage} error={errors.image} />
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
            onChange={html => setContent(html)}
          />
        </div>
        {errors.content && (
          <p role="alert" className="text-xs text-[var(--error)]">{errors.content}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--foreground)]">Visibility</label>
        <div className="flex gap-2">
          {(['draft', 'published'] as const).map(s => (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                     text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors duration-150 shadow-sm"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {mode === 'create' ? 'Publish Post' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)]
                     border border-[var(--border)] hover:bg-[var(--background-subtle)]
                     hover:text-[var(--foreground)] disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors duration-150"
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
