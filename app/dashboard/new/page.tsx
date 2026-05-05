'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import PostForm from '@/components/posts/PostForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NewPostPage() {
  const router = useRouter()
  const { state } = useAuth()

  // Redirect non-authors
  useEffect(() => {
    if (!state.loading && !state.user) {
      router.replace('/login')
    }
    if (!state.loading && state.user && state.user.role !== 'author') {
      router.replace('/')
    }
  }, [state.loading, state.user, router])

  if (state.loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24" aria-label="Loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!state.user || state.user.role !== 'author') {
    return null
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          New Post
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
          Write and publish your post. Drafts are only visible to you.
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-7">
        <PostForm mode="create" />
      </div>
    </main>
  )
}
