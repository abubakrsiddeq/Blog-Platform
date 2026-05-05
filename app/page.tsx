'use client'

import { useState, useEffect, useCallback, use } from 'react'
import PostList from '@/components/posts/PostList'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { PostCardPost } from '@/components/posts/PostCard'

interface PostsResponse {
  posts: PostCardPost[]
  page: number
  limit: number
  total: number
  totalPages: number
}

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function HomeContent({ searchParams }: HomePageProps) {
  const resolvedParams = use(searchParams)
  const initialSearch = typeof resolvedParams.search === 'string' ? resolvedParams.search : ''
  const initialPage = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) || 1 : 1

  const [posts, setPosts] = useState<PostCardPost[]>([])
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [inputValue, setInputValue] = useState(initialSearch)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (query: string, currentPage: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', '9')
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
    fetchPosts(searchQuery, page)
  }, [fetchPosts, searchQuery, page])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPage(1)
    setSearchQuery(inputValue)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleClearSearch() {
    setInputValue('')
    setSearchQuery('')
    setPage(1)
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight mb-1.5">
          Latest Posts
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Discover stories, ideas, and expertise from our community.
          {!loading && total > 0 && (
            <span className="ml-1 text-[var(--foreground-subtle)]">
              {total} post{total !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        role="search"
        className="mb-8 flex gap-2 w-full sm:max-w-lg"
      >
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search posts
          </label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-[var(--foreground-subtle)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="search-input"
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all duration-150"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors duration-150 shadow-sm"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-subtle)] transition-colors duration-150"
          >
            Clear
          </button>
        )}
      </form>

      {/* Active search indicator */}
      {searchQuery && !loading && (
        <p className="mb-5 text-sm text-[var(--foreground-muted)]">
          Results for{' '}
          <span className="font-semibold text-[var(--foreground)]">
            &ldquo;{searchQuery}&rdquo;
          </span>
          {' '}— {total} post{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-28" aria-label="Loading posts">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
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
            onClick={() => fetchPosts(searchQuery, page)}
            className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <PostList
          posts={posts}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </main>
  )
}

export default function HomePage({ searchParams }: HomePageProps) {
  return <HomeContent searchParams={searchParams} />
}
