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

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" aria-hidden="true" />
      Draft
    </span>
  )
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
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            My Posts
          </h1>
          {!loading && (
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
              {total} post{total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors duration-150 shadow-sm self-start sm:self-auto"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
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
        <div role="alert" className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[var(--error-subtle)] border border-[var(--error)]/20 flex items-center justify-center mb-4">
            <svg className="h-5 w-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">{error}</p>
          <button
            onClick={() => fetchPosts(page)}
            className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[var(--background-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
            <svg aria-hidden="true" className="h-7 w-7 text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-[var(--foreground)] mb-1">No posts yet</p>
          <p className="text-sm text-[var(--foreground-muted)] mb-5">
            Create your first post to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors duration-150 shadow-sm"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </Link>
        </div>
      ) : (
        <>
          {/* Posts table */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--background-subtle)] border-b border-[var(--border)]">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide hidden sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide hidden md:table-cell">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide hidden md:table-cell">
                    Likes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {posts.map((post) => (
                  <tr
                    key={post._id}
                    className="bg-[var(--surface)] hover:bg-[var(--background-subtle)] transition-colors duration-100"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/posts/${post._id}`}
                        className="font-medium text-[var(--foreground)] hover:text-[var(--brand)] transition-colors duration-150 line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      <div className="sm:hidden mt-1.5">
                        <StatusBadge status={post.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--foreground-muted)] hidden md:table-cell whitespace-nowrap">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-[var(--foreground-muted)]">
                        <svg aria-hidden="true" className="h-3.5 w-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        {post.likes.length}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/edit/${post._id}`}
                          aria-label={`Edit "${post.title}"`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--brand)] bg-[var(--brand-subtle)] hover:bg-[var(--brand)]/20 transition-colors duration-150"
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          aria-label={`Delete "${post.title}"`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--error)] bg-[var(--error-subtle)] hover:bg-[var(--error)]/20 transition-colors duration-150"
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

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete overlay */}
      {deleting && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
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
