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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export default function PostCard({ post }: PostCardProps) {
  const authorName = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const excerpt = post.excerpt ? truncate(post.excerpt, 150) : null

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            href={`/posts/${post._id}`}
            className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
          >
            {post.title}
          </Link>
          {post.status === 'draft' && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              Draft
            </span>
          )}
        </div>

        {excerpt && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1 mb-4">
            {excerpt}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formattedDate}</time>
          </div>

          <span
            aria-label={`${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {post.likes.length}
          </span>
        </div>
      </div>
    </article>
  )
}
