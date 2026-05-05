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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/posts/${id}`, { cache: 'no-store' })
    if (res.status === 404 || res.status === 403) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getComments(postId: string): Promise<CommentData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/comments/${postId}`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params
  const [post, comments] = await Promise.all([getPost(id), getComments(id)])

  if (!post) notFound()

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Post content */}
      <PostDetail post={post} />

      {/* Comments section */}
      <section
        aria-labelledby="comments-heading"
        className="mt-12 pt-8 border-t border-[var(--border)]"
      >
        <h2
          id="comments-heading"
          className="text-base font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2"
        >
          Comments
          <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-[var(--background-subtle)] border border-[var(--border)] text-xs font-medium text-[var(--foreground-muted)]">
            {comments.length}
          </span>
        </h2>

        <CommentList comments={comments} />

        <div className="mt-6">
          <CommentForm postId={id} />
        </div>
      </section>
    </div>
  )
}
