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
      <p className="text-gray-500 dark:text-gray-400 text-sm py-4">
        No comments yet. Be the first to comment!
      </p>
    )
  }

  return (
    <ul className="space-y-3 sm:space-y-4" aria-label="Comments">
      {comments.map((comment) => (
        <li
          key={comment._id}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0"
            >
              {getUserName(comment.user).charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {getUserName(comment.user)}
            </span>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
            <time dateTime={comment.createdAt} className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  )
}
