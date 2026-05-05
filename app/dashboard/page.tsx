'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'

interface DashboardPost {
  _id: string
  title: string
  status: 'draft' | 'published'
  createdAt: string
  likes: string[]
}

interface PostsResponse {
  posts: DashboardPost[]
  page: number
  totalPages: number
  total: number
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const { state } = useAuth()

  const [posts, setPosts] = useState<DashboardPost[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<DashboardPost | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Redirect non-authors away from the dashboard
  useEffect(() => {
    if (!state.loading && state.user && state.user.role !== 'author') {
      router.replace('/')
    }
    if (!state.loading && !state.user) {
      router.replace('/login')
    }
  }, [state.loading, state.user, router])

  const fetchPosts = useCallback(async (currentPage: number) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts?mine=true&page=${currentPage}&limit=10`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load posts')
      }
      const data: PostsResponse = await res.json()
      setPosts(data.posts)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!state.loading && state.user?.role === 'author') {
      fetchPosts(page)
    }
  }, [fetchPosts, page, state.loading, state.user])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/posts/${deleteTarget._id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ message: data.error ?? 'Failed to delete post', type: 'error' })
        return
      }

      setToast({ message: 'Post deleted successfully', type: 'success' })
      // Refresh the list; if current page is now empty, go back one page
      const newTotal = total - 1
      const newTotalPages = Math.max(1, Math.ceil(newTotal / 10))
      const newPage = page > newTotalPages ? newTotalPages : page
      setPage(newPage)
      fetchPosts(newPage)
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Show loading while auth state is resolving
  if (state.loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24" aria-label="Loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Guard: only authors should see this page
  if (!state.user || state.user.role !== 'author') {
    return null
  }

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Posts
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {total} post{total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors
            self-start sm:self-auto"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24" aria-label="Loading posts">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
          <button
            onClick={() => fetchPosts(page)}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            aria-hidden="true"
            className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No posts yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">
            Create your first post to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Create Post
          </Link>
        </div>
      ) : (
        <>
          {/* Posts table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell"
                  >
                    Likes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr
                    key={post._id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/posts/${post._id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {/* Show status inline on small screens */}
                      <div className="sm:hidden mt-1">
                        <StatusBadge status={post.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {post.likes.length}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/edit/${post._id}`}
                          aria-label={`Edit "${post.title}"`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                            text-blue-700 dark:text-blue-400
                            bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50
                            transition-colors"
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          aria-label={`Delete "${post.title}"`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                            text-red-700 dark:text-red-400
                            bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50
                            transition-colors"
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Loading overlay during delete */}
      {deleting && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
          aria-label="Deleting post"
        >
          <LoadingSpinner size="lg" />
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
      Draft
    </span>
  )
}
