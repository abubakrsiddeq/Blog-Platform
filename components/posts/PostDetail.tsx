'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'
import Toast from '@/components/ui/Toast'

interface PostDetailPost {
  _id: string
  title: string
  content: string
  author: { name: string } | string
  createdAt: string
  likes: string[]
  image?: string
}

interface PostDetailProps {
  post: PostDetailPost
}

interface ToastState {
  message: string
  type: 'success' | 'error'
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

export default function PostDetail({ post }: PostDetailProps) {
  const { state } = useAuth()
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [liked, setLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const authorName = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const isAuthenticated = !!state.user
  const initials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  async function handleLike() {
    if (isLiking) return
    const previousCount = likeCount
    const previousLiked = liked
    setLikeCount((prev) => prev + (liked ? -1 : 1))
    setLiked((prev) => !prev)
    setIsLiking(true)

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLikeCount(previousCount)
        setLiked(previousLiked)
        const data = await res.json().catch(() => ({}))
        setToast({ message: data.error ?? 'Failed to like post', type: 'error' })
        return
      }
      const data: { likes: number; liked: boolean } = await res.json()
      setLikeCount(data.likes)
      setLiked(data.liked)
    } catch {
      setLikeCount(previousCount)
      setLiked(previousLiked)
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero image */}
      {post.image && (
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden mb-8 bg-[var(--background-subtle)]">
          <Image
            src={post.image}
            alt={`Cover image for ${post.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] leading-tight tracking-tight mb-5">
        {post.title}
      </h1>

      {/* Author + meta */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[var(--border)]">
        <div className="h-9 w-9 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--brand)]">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{authorName}</p>
          <time dateTime={post.createdAt} className="text-xs text-[var(--foreground-muted)]">
            {formattedDate}
          </time>
        </div>
      </div>

      {/* Content */}
      <div
        className="prose max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Like button */}
      {isAuthenticated && (
        <div className="flex items-center gap-3 pt-6 border-t border-[var(--border)]">
          <button
            onClick={handleLike}
            disabled={isLiking}
            aria-label={`${liked ? 'Unlike' : 'Like'} this post (${likeCount} like${likeCount !== 1 ? 's' : ''})`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
              liked
                ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <svg
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-150 ${liked ? 'scale-110' : ''}`}
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 20 20"
              stroke="currentColor"
              strokeWidth={liked ? 0 : 1.5}
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </article>
  )
}
