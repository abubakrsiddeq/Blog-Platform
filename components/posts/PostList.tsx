'use client'

import PostCard, { type PostCardPost } from '@/components/posts/PostCard'
import Pagination from '@/components/ui/Pagination'

interface PostListProps {
  posts: PostCardPost[]
  page: number
  totalPages: number
  onPageChange?: (page: number) => void
}

export default function PostList({ posts, page, totalPages, onPageChange }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--background-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
          <svg
            aria-hidden="true"
            className="h-7 w-7 text-[var(--foreground-subtle)]"
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
        </div>
        <p className="text-[var(--foreground)] font-semibold mb-1">No posts found</p>
        <p className="text-sm text-[var(--foreground-muted)]">
          Check back later or try a different search.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {totalPages > 1 && onPageChange && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}
