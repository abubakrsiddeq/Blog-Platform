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
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Create New Post
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Write and publish your post. Drafts are only visible to you.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
        <PostForm mode="create" />
      </div>
    </main>
  )
}
