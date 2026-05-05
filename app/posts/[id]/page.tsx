import { notFound } from 'next/navigation'
import PostDetail from '@/components/posts/PostDetail'
import CommentList from '@/components/comments/CommentList'
import CommentForm from '@/components/comments/CommentForm'

interface PostDetailPageProps {
  params: Promise<{ id: string }>
}

interface PostData {
  _id: string
  title: string
  content: string
  author: { name: string } | string
  createdAt: string
  likes: string[]
  image?: string
  status: string
}

interface CommentData {
  _id: string
  content: string
  user: { name: string } | string
  createdAt: string
}

async function getPost(id: string): Promise<PostData | null> {
  try {
    // Use absolute URL for server-side fetch in Next.js App Router
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      // Do not cache — post content may change
      cache: 'no-store',
    })

    if (res.status === 404 || res.status === 403) {
      return null
    }

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch {
    return null
  }
}

async function getComments(postId: string): Promise<CommentData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/comments/${postId}`, {
      cache: 'no-store',
    })

    if (!res.ok) return []

    return res.json()
  } catch {
    return []
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params

  const [post, comments] = await Promise.all([getPost(id), getComments(id)])

  if (!post) {
    notFound()
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Post content */}
      <PostDetail post={post} />

      {/* Comments section */}
      <section
        aria-labelledby="comments-heading"
        className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 border-t border-gray-200 dark:border-gray-700 pt-8"
      >
        <h2
          id="comments-heading"
          className="text-xl font-semibold text-gray-900 dark:text-white mb-6"
        >
          Comments{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({comments.length})
          </span>
        </h2>

        <CommentList comments={comments} />

        <div className="mt-8">
          <CommentForm postId={id} />
        </div>
      </section>
    </div>
  )
}
