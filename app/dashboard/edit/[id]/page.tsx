'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import PostForm from '@/components/posts/PostForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

interface PostData {
  _id: string
  title: string
  content: string
  image?: string
  status: 'draft' | 'published'
  author: { _id?: string; name: string } | string
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { state } = useAuth()

  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect non-authors
  useEffect(() => {
    if (!state.loading && !state.user) {
      router.replace('/login')
    }
    if (!state.loading && state.user && state.user.role !== 'author') {
      router.replace('/')
    }
  }, [state.loading, state.user, router])

  // Fetch the post once auth is resolved
  useEffect(() => {
    if (state.loading || !state.user || state.user.role !== 'author') return

    async function fetchPost() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/posts/${id}`)
        if (res.status === 404) {
          setError('Post not found.')
          return
        }
        if (res.status === 403) {
          setError('You do not have permission to edit this post.')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to load post')
          return
        }
        const data: PostData = await res.json()
        setPost(data)
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id, state.loading, state.user])

  // Show spinner while auth or post is loading
  if (state.loading || (loading && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24" aria-label="Loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!state.user || state.user.role !== 'author') {
    return null
  }

  if (error) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          role="alert"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-12 w-12 rounded-2xl bg-[var(--error-subtle)] border border-[var(--error)]/20 flex items-center justify-center mb-4">
            <svg className="h-5 w-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  if (!post) return null

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Edit Post
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
          Update your post content and settings.
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-7">
        <PostForm
          mode="edit"
          postId={post._id}
          initialData={{
            title: post.title,
            content: post.content,
            image: post.image,
            status: post.status,
          }}
        />
      </div>
    </main>
  )
}
