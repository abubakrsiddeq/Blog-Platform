'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  status: string
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

function readingTime(html: string): number {
  const words = html.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function PostDetail({ post }: PostDetailProps) {
  const { state } = useAuth()
  const { user } = state
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [liked, setLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Once auth is resolved, check if the user already liked this post
  useEffect(() => {
    if (user) {
      setLiked(post.likes.includes(user.id))
    }
  }, [user, post.likes])  // Once auth is resolved, check if the user already liked this post
  useEffect(() => {
    if (user) {
      setLiked(post.likes.includes(user.id))
    }
  }, [user, post.likes])

  const authorName = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const isAuthenticated = !!user
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const mins = readingTime(post.content)

  async function handleLike() {
    if (isLiking) return
    const prevCount = likeCount
    const prevLiked = liked
    setLikeCount(c => c + (liked ? -1 : 1))
    setLiked(v => !v)
    setIsLiking(true)
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLikeCount(prevCount)
        setLiked(prevLiked)
        const data = await res.json().catch(() => ({}))
        setToast({ message: data.error ?? 'Failed to like post', type: 'error' })
        return
      }
      const data: { likes: number; liked: boolean } = await res.json()
      setLikeCount(data.likes)
      setLiked(data.liked)
    } catch {
      setLikeCount(prevCount)
      setLiked(prevLiked)
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <article>
      {/* ── Hero image ─────────────────────────────────────────────────── */}
      {post.image && (
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-10 bg-[var(--background-subtle)]"
          style={{ paddingBottom: 'clamp(52%, 42%, 42%)' }}>
          <Image
            src={post.image}
            alt={`Cover image for ${post.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
        </div>
      )}

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)]
                     leading-tight tracking-tight mb-5 sm:mb-6">
        {post.title}
      </h1>

      {/* ── Meta bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 mb-10 pb-8
                      border-b border-[var(--border)]">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0
                          text-sm font-bold text-white
                          bg-gradient-to-br from-[var(--brand)] to-violet-500 shadow-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{authorName}</p>
            <time dateTime={post.createdAt} className="text-xs text-[var(--foreground-muted)]">
              {formattedDate}
            </time>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-[var(--border)]" aria-hidden="true" />

        {/* Reading time */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {mins} min read
        </div>

        {/* Like count (display only, not interactive here) */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
          <svg className="h-3.5 w-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Draft badge */}
        {post.status === 'draft' && (
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           text-xs font-semibold bg-[var(--warning-subtle)] text-[var(--warning)]
                           border border-[var(--warning)]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" aria-hidden="true" />
            Draft
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div
        className="prose max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* ── Like / share footer ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4
                      pt-8 border-t border-[var(--border)]">
        {/* Like button */}
        {isAuthenticated ? (
          <button
            onClick={handleLike}
            disabled={isLiking}
            aria-label={`${liked ? 'Unlike' : 'Like'} this post`}
            className={`group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl
                        text-sm font-semibold border transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed
                        ${liked
                          ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:shadow-[0_0_16px_rgba(244,63,94,0.15)]'
                        }`}
          >
            <svg
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${liked ? 'scale-125' : 'group-hover:scale-110'}`}
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 20 20"
              stroke="currentColor"
              strokeWidth={liked ? 0 : 1.5}
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
                       border border-[var(--border)] text-[var(--foreground-muted)]
                       hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50
                       dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            Sign in to like
          </Link>
        )}

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]
                     hover:text-[var(--foreground)] transition-colors duration-150"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All posts
        </Link>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </article>
  )
}
