'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'

interface DashboardPost {
  _id: string
  title: string
  excerpt?: string
  image?: string
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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

function getAccent(id: string) {
  const list = [
    { a: '#6366f1', b: '#a78bfa' },
    { a: '#3b82f6', b: '#22d3ee' },
    { a: '#10b981', b: '#34d399' },
    { a: '#f59e0b', b: '#fb923c' },
    { a: '#ec4899', b: '#f43f5e' },
    { a: '#8b5cf6', b: '#c084fc' },
  ]
  return list[id.charCodeAt(id.length - 1) % list.length]
}

/* ── List row ─────────────────────────────────────────────────────────────── */
function PostRow({ post, onDelete }: { post: DashboardPost; onDelete: () => void }) {
  const accent = getAccent(post._id)
  const excerpt = post.excerpt ? truncate(post.excerpt, 150) : null

  return (
    <article
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl
                 overflow-hidden flex flex-col sm:flex-row
                 hover:border-[var(--brand)]/40
                 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_8px_24px_rgba(99,102,241,0.08)]
                 transition-all duration-300"
    >
      {/* Thumbnail */}
      <Link
        href={`/posts/${post._id}`}
        className="relative block overflow-hidden shrink-0 sm:w-52 md:w-60"
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* Mobile: 16/9 strip. Desktop: fills the full row height */}
        <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:h-full sm:min-h-[140px]">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, 240px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${accent.a}18, ${accent.b}30)` }}
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: `radial-gradient(circle, ${accent.a} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           text-5xl font-black opacity-[0.10] select-none"
                style={{ color: accent.a }}
              >
                {post.title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {/* Bottom accent bar on mobile */}
          <div
            className="absolute inset-x-0 bottom-0 h-[2px] sm:hidden"
            style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
            aria-hidden="true"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 min-w-0">
        {/* Top row: status + date + likes */}
        <div className="flex flex-wrap items-center gap-3 mb-2.5">
          {/* Status */}
          {post.status === 'published' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                             bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                             bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" aria-hidden="true" />
              Draft
            </span>
          )}

          {/* Date */}
          <span className="text-xs text-[var(--foreground-muted)]">
            {formatDate(post.createdAt)}
          </span>

          {/* Likes */}
          <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <svg className="h-3 w-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {post.likes.length}
          </span>
        </div>

        {/* Title */}
        <Link href={`/posts/${post._id}`}>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-snug line-clamp-2 mb-2
                         group-hover:text-[var(--brand)] transition-colors duration-150">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed line-clamp-2 mb-3 flex-1">
            {excerpt}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/posts/${post._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                       border border-[var(--border)] hover:border-[var(--border-strong)]
                       hover:bg-[var(--background-subtle)] transition-colors duration-150"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </Link>
          <Link
            href={`/dashboard/edit/${post._id}`}
            aria-label={`Edit "${post.title}"`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-[var(--brand)] hover:bg-[var(--brand)]/10
                       border border-[var(--brand)]/20 hover:border-[var(--brand)]/40
                       transition-colors duration-150"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={onDelete}
            aria-label={`Delete "${post.title}"`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-[var(--error)] hover:bg-[var(--error)]/10
                       border border-[var(--error)]/20 hover:border-[var(--error)]/40
                       transition-colors duration-150"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const { state } = useAuth()

  const [posts, setPosts] = useState<DashboardPost[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')

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

  const fetchPosts = useCallback(async (currentPage: number, query: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('mine', 'true')
      params.set('page', String(currentPage))
      params.set('limit', '10')
      if (query.trim()) params.set('search', query.trim())

      const res = await fetch(`/api/posts?${params.toString()}`)
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
      fetchPosts(page, searchQuery)
    }
  }, [fetchPosts, page, searchQuery, state.loading, state.user])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPage(1)
    setSearchQuery(inputValue)
  }

  function handleClearSearch() {
    setInputValue('')
    setSearchQuery('')
    setPage(1)
  }

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
      fetchPosts(newPage, searchQuery)
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight mb-1">
              My Posts
            </h1>
            {!loading && (
              <p className="text-sm text-[var(--foreground-muted)]">
                {total} {total === 1 ? 'post' : 'posts'} · Manage your content
              </p>
            )}
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
                       text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                       transition-colors duration-150 shadow-sm self-start sm:self-auto"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} role="search" className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">Search your posts</label>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-[var(--foreground-subtle)]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search-input"
              type="search"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search your posts…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)]
                         bg-[var(--surface)] text-sm text-[var(--foreground)]
                         placeholder-[var(--foreground-subtle)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50
                         focus:border-[var(--brand)]/50
                         shadow-[var(--shadow-sm)] transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                       bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                       transition-colors duration-150 shadow-sm"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2.5 rounded-xl text-sm font-medium
                         text-[var(--foreground-muted)] border border-[var(--border)]
                         hover:bg-[var(--background-subtle)] transition-colors duration-150"
            >
              Clear
            </button>
          )}
        </form>

        {/* Active search indicator */}
        {searchQuery && !loading && (
          <p className="mt-3 text-sm text-[var(--foreground-muted)] animate-fade-in">
            Results for{' '}
            <span className="font-semibold text-[var(--foreground)]">
              &ldquo;{searchQuery}&rdquo;
            </span>
            {' '}— {total} {total === 1 ? 'post' : 'posts'} found
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center py-28" aria-label="Loading posts">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--brand)]/20 blur-xl animate-glow" />
            <LoadingSpinner size="lg" />
          </div>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[var(--error-subtle)] border border-[var(--error)]/20
                          flex items-center justify-center mb-4 shadow-[var(--shadow-md)]">
            <svg className="h-6 w-6 text-[var(--error)]" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">{error}</p>
          <button
            onClick={() => fetchPosts(page, searchQuery)}
            className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-[var(--brand)]/15 blur-2xl" aria-hidden="true" />
            <div className="relative h-20 w-20 rounded-3xl bg-[var(--surface)] border border-[var(--border)]
                            flex items-center justify-center shadow-[var(--shadow-lg)]">
              <svg aria-hidden="true" className="h-9 w-9 text-[var(--foreground-subtle)]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-base font-semibold text-[var(--foreground)] mb-1">
            {searchQuery ? 'No posts found' : 'No posts yet'}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mb-6 max-w-xs">
            {searchQuery
              ? 'Try a different search term or clear the filter.'
              : 'Start sharing your ideas with the world. Create your first post.'}
          </p>
          {searchQuery ? (
            <button
              onClick={handleClearSearch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
                         text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                         transition-colors duration-150 shadow-sm"
            >
              Clear search
            </button>
          ) : (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
                         text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                         transition-colors duration-150 shadow-sm"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Posts list */}
          <div className="space-y-4">
            {posts.map(post => (
              <PostRow key={post._id} post={post} onDelete={() => setDeleteTarget(post)} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={newPage => {
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
