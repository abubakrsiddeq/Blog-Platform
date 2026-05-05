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

// Deterministic avatar colour from name
function getAvatarGradient(name: string) {
  const gradients = [
    ['#6366f1', '#8b5cf6'],
    ['#3b82f6', '#06b6d4'],
    ['#10b981', '#14b8a6'],
    ['#f59e0b', '#f97316'],
    ['#ec4899', '#f43f5e'],
    ['#8b5cf6', '#c084fc'],
  ]
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="relative inline-flex mb-4">
          <div className="absolute inset-0 rounded-2xl bg-[var(--brand)]/10 blur-xl" aria-hidden="true" />
          <div className="relative h-12 w-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)]
                          flex items-center justify-center shadow-[var(--shadow-md)]">
            <svg className="h-5 w-5 text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)] mb-0.5">No comments yet</p>
        <p className="text-xs text-[var(--foreground-muted)]">Be the first to share your thoughts.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4" aria-label="Comments">
      {comments.map((comment, i) => {
        const name = getUserName(comment.user)
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        const [gradFrom, gradTo] = getAvatarGradient(name)

        return (
          <li
            key={comment._id}
            className="flex gap-3 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                         text-[10px] font-bold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
              aria-hidden="true"
            >
              {initials}
            </div>

            {/* Bubble */}
            <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl
                            rounded-tl-sm px-4 py-3 shadow-[var(--shadow-sm)]
                            hover:border-[var(--border-strong)] transition-colors duration-150">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-[var(--foreground)]">{name}</span>
                <span aria-hidden="true" className="text-[var(--border-strong)] text-xs">·</span>
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
