import Link from 'next/link'

export interface PostCardPost {
  _id: string
  title: string
  excerpt?: string
  author: { name: string } | string
  createdAt: string
  status: string
  likes: string[]
}

interface PostCardProps {
  post: PostCardPost
}

function getAuthorName(author: { name: string } | string): string {
  if (typeof author === 'string') return author
  return author.name
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

// Generate a deterministic gradient from the post id
function getGradient(id: string): string {
  const gradients = [
    'from-violet-500/10 to-indigo-500/10',
    'from-blue-500/10 to-cyan-500/10',
    'from-emerald-500/10 to-teal-500/10',
    'from-orange-500/10 to-amber-500/10',
    'from-pink-500/10 to-rose-500/10',
    'from-purple-500/10 to-pink-500/10',
  ]
  const index = id.charCodeAt(id.length - 1) % gradients.length
  return gradients[index]
}

export default function PostCard({ post }: PostCardProps) {
  const authorName = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const excerpt = post.excerpt ? truncate(post.excerpt, 130) : null
  const gradient = getGradient(post._id)
  const initials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <article className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-200">
      {/* Gradient accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient.replace('/10', '')}`} aria-hidden="true" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Link
            href={`/posts/${post._id}`}
            className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)] transition-colors duration-150 line-clamp-2 leading-snug"
          >
            {post.title}
          </Link>
          {post.status === 'draft' && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20">
              Draft
            </span>
          )}
        </div>

        {excerpt && (
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed flex-1 mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${gradient.replace('/10', '/30')} border border-[var(--border)] flex items-center justify-center shrink-0`}>
              <span className="text-[10px] font-bold text-[var(--foreground-muted)]">{initials}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
              <span className="font-medium text-[var(--foreground-muted)]">{authorName}</span>
              <span aria-hidden="true" className="text-[var(--border-strong)]">·</span>
              <time dateTime={post.createdAt}>{formattedDate}</time>
            </div>
          </div>

          <span
            aria-label={`${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}`}
            className="inline-flex items-center gap-1 text-xs text-[var(--foreground-subtle)]"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {post.likes.length}
          </span>
        </div>
      </div>
    </article>
  )
}
