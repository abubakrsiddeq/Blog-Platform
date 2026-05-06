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
    <main className="flex-1 w-full">

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 hero-grid" aria-hidden="true" />

        {/* Radial glow blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full
                     bg-[var(--brand)]/10 blur-[100px] animate-glow pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-10 -left-20 w-[300px] h-[300px] rounded-full
                     bg-violet-500/8 blur-[80px] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-10 -right-20 w-[300px] h-[300px] rounded-full
                     bg-sky-500/8 blur-[80px] pointer-events-none"
        />

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/5 text-xs font-medium text-[var(--brand)] mb-5 animate-fade-in">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--brand)]" />
            </span>
            Community stories &amp; ideas
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-5 animate-slide-up"
            style={{ animationDelay: '60ms' }}
          >
            <span className="text-[var(--foreground)]">Explore the </span>
            <span className="text-gradient-shimmer">Future of Ideas</span>
          </h1>

          {/* Sub-headline */}
          <p
            className="text-sm sm:text-lg text-[var(--foreground-muted)] max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: '120ms' }}
          >
            Discover stories, deep dives, and expertise from writers shaping tomorrow.
            {!loading && total > 0 && (
              <span className="ml-1 font-semibold text-[var(--brand)]">
                {total} post{total !== 1 ? 's' : ''} published.
              </span>
            )}
          </p>

          {/* Search bar — stacked on mobile, inline on sm+ */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="max-w-xl mx-auto animate-slide-up"
            style={{ animationDelay: '180ms' }}
          >
            <label htmlFor="search-input" className="sr-only">Search posts</label>

            {/* Input row */}
            <div className="relative flex items-center">
              {/* Search icon */}
              <div className="absolute left-4 flex items-center pointer-events-none z-10">
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
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search posts, topics…"
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl border border-[var(--border)]
                           bg-[var(--surface)] text-sm text-[var(--foreground)]
                           placeholder-[var(--foreground-subtle)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50
                           focus:border-[var(--brand)]/50
                           shadow-[var(--shadow-md)] transition-all duration-200"
              />
            </div>

            {/* Button row — always below input on mobile, saves space */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                           bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                           transition-colors duration-150 shadow-sm glow-brand-sm"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium
                             text-[var(--foreground-muted)] border border-[var(--border)]
                             hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]
                             transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Active search indicator */}
          {searchQuery && !loading && (
            <p className="mt-4 text-sm text-[var(--foreground-muted)] animate-fade-in">
              Results for{' '}
              <span className="font-semibold text-[var(--foreground)]">
                &ldquo;{searchQuery}&rdquo;
              </span>
              {' '}— {total} post{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Bottom fade */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-16
                     bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none"
        />
      </section>

      {/* ── Posts Section ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Section label */}
        {!searchQuery && (
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">
              Latest
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-28" aria-label="Loading posts">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[var(--brand)]/20 blur-xl animate-glow" />
              <LoadingSpinner size="lg" />
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
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
      </section>
    </main>
  )
}

export default function HomePage({ searchParams }: HomePageProps) {
  return <HomeContent searchParams={searchParams} />
}
