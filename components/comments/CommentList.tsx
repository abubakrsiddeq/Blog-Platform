interface Comment {
  _id: string
  content: string
  user: { name: string } | string
  createdAt: string
}

interface CommentListProps {
  comments: Comment[]
}

function getUserName(user: { name: string } | string): string {
  if (typeof user === 'string') return user
  return user.name
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="h-10 w-10 rounded-full bg-[var(--background-subtle)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
          <svg className="h-4 w-4 text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">No comments yet. Be the first!</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3" aria-label="Comments">
      {comments.map((comment) => {
        const name = getUserName(comment.user)
        const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

        return (
          <li
            key={comment._id}
            className="flex gap-3 animate-fade-in"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-[var(--brand)]">{initials}</span>
            </div>

            {/* Bubble */}
            <div className="flex-1 bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-[var(--foreground)]">{name}</span>
                <span aria-hidden="true" className="text-[var(--border-strong)]">·</span>
                <time dateTime={comment.createdAt} className="text-xs text-[var(--foreground-subtle)]">
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
