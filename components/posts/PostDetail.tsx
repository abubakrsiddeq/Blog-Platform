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
  const [isLiking, setIsLiking] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const authorName = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const isAuthenticated = !!state.user

  async function handleLike() {
    if (isLiking) return
    const previousCount = likeCount
    setLikeCount((prev) => prev + 1)
    setIsLiking(true)

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLikeCount(previousCount)
        const data = await res.json().catch(() => ({}))
        setToast({ message: data.error ?? 'Failed to like post', type: 'error' })
        return
      }
      const data: { likes: number; liked: boolean } = await res.json()
      setLikeCount(data.likes)
    } catch {
      setLikeCount(previousCount)
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
        {post.title}
      </h1>

      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.createdAt}>{formattedDate}</time>
      </div>

      {post.image && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 bg-gray-100 dark:bg-gray-800">
          <Image
            src={post.image}
            alt={`Cover image for ${post.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <div
        className="prose prose-gray dark:prose-invert max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {isAuthenticated && (
        <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            disabled={isLiking}
            aria-label={`Like this post (${likeCount} like${likeCount !== 1 ? 's' : ''})`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              bg-red-50 text-red-600 hover:bg-red-100
              dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50
              disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </article>
  )
}
