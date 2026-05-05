'use client'

import PostCard, { type PostCardPost } from '@/components/posts/PostCard'
import Pagination from '@/components/ui/Pagination'

interface PostListProps {
  posts: PostCardPost[]
  page: number
  totalPages: number
  onPageChange?: (page: number) => void
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
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
      <p className="text-base font-semibold text-[var(--foreground)] mb-1">No posts yet</p>
      <p className="text-sm text-[var(--foreground-muted)] max-w-xs">
        Check back later or try a different search term.
      </p>
    </div>
  )
}

/* ── Bento grid for page 1 ───────────────────────────────────────────────── */
/*
  Layout (up to 9 posts):
  ┌─────────────────────────────────┐
  │  HERO  (post 0, full width)     │
  ├──────────────┬──────────────────┤
  │  TALL (1)    │  TALL (2)        │  ← 2-col
  ├────┬─────────┴──────────────────┤
  │ D3 │  D4  │  D5  │  D6  │  D7  │  ← 3-col grid for rest
  └────┴──────┴──────┴──────┴──────┘
*/
function BentoGrid({ posts }: { posts: PostCardPost[] }) {
  const [p0, p1, p2, ...rest] = posts

  return (
    <div className="space-y-5">
      {/* Row 1 — Hero */}
      {p0 && <PostCard post={p0} variant="hero" />}

      {/* Row 2 — Two tall cards */}
      {(p1 || p2) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {p1 && <PostCard post={p1} variant="tall" />}
          {p2 && <PostCard post={p2} variant="tall" />}
        </div>
      )}

      {/* Row 3+ — Regular 3-col grid */}
      {rest.length > 0 && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground-subtle)]">
              More stories
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(post => (
              <PostCard key={post._id} post={post} variant="default" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Regular grid for page 2+ ────────────────────────────────────────────── */
function RegularGrid({ posts }: { posts: PostCardPost[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {posts.map(post => (
        <PostCard key={post._id} post={post} variant="default" />
      ))}
    </div>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function PostList({ posts, page, totalPages, onPageChange }: PostListProps) {
  if (posts.length === 0) return <EmptyState />

  return (
    <div className="space-y-8">
      {page === 1 ? (
        <BentoGrid posts={posts} />
      ) : (
        <RegularGrid posts={posts} />
      )}

      {totalPages > 1 && onPageChange && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}
