import { notFound } from 'next/navigation'
import PostDetail from '@/components/posts/PostDetail'
import CommentList from '@/components/comments/CommentList'
import CommentForm from '@/components/comments/CommentForm'
import { getPostById } from '@/lib/services/postService'
import { getCommentsByPost } from '@/lib/services/commentService'

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
    const post = await getPostById(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return JSON.parse(JSON.stringify(post)) as PostData
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      ((err as { code: string }).code === 'NOT_FOUND' ||
        (err as { code: string }).code === 'FORBIDDEN')
    ) {
      return null
    }
    // CastError (invalid ObjectId) → treat as not found
    if (
      err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'CastError'
    ) {
      return null
    }
    return null
  }
}

async function getComments(postId: string): Promise<CommentData[]> {
  try {
    const comments = await getCommentsByPost(postId)
    return JSON.parse(JSON.stringify(comments)) as CommentData[]
  } catch {
    return []
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params
  const [post, comments] = await Promise.all([getPost(id), getComments(id)])

  if (!post) notFound()

  return (
    /* Outer page shell */
    <div className="flex-1 w-full">

      {/* ── Reading column ─────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        <PostDetail post={post} />

        {/* ── Comments ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="comments-heading"
          className="mt-16"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <h2
              id="comments-heading"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest
                         text-[var(--foreground-subtle)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discussion
              {comments.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5
                                 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20
                                 text-[11px] font-bold text-[var(--brand)]">
                  {comments.length}
                </span>
              )}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          </div>

          {/* Comment form */}
          <div className="mb-8">
            <CommentForm postId={id} />
          </div>

          {/* Comment list */}
          <CommentList comments={comments} />
        </section>
      </div>
    </div>
  )
}
