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

// Inner component that reads searchParams via use()
function HomeContent({ searchParams }: HomePageProps) {
  const resolvedParams = use(searchParams)
  const initialSearch = typeof resolvedParams.search === 'string' ? resolvedParams.search : ''
  const initialPage = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) || 1 : 1

  const [posts, setPosts] = useState<PostCardPost[]>([])
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
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
      if (query.trim()) {
        params.set('search', query.trim())
      }

      const res = await fetch(`/api/posts?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load posts')
      }

      const data: PostsResponse = await res.json()
      setPosts(data.posts)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and whenever page or searchQuery changes
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
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Latest Posts
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Discover stories, ideas, and expertise from our community of authors.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        role="search"
        className="mb-8 flex gap-2 w-full sm:max-w-xl"
      >
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search posts
          </label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="search-input"
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-white bg-white dark:bg-gray-800
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white
            bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2.5 rounded-lg text-sm font-medium
              text-gray-700 dark:text-gray-300
              bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Active search indicator */}
      {searchQuery && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing results for{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            &ldquo;{searchQuery}&rdquo;
          </span>
        </p>
      )}

      {/* Content area */}
      {loading ? (
        <div className="flex justify-center items-center py-24" aria-label="Loading posts">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
          <button
            onClick={() => fetchPosts(searchQuery, page)}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
