'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PostErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[PostDetailPage error]', error)
  }, [error])

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-24">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-[var(--error-subtle)]
                        border border-[var(--error)]/20 flex items-center justify-center
                        shadow-[var(--shadow-md)]">
          <svg className="h-7 w-7 text-[var(--error)]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-8 leading-relaxed">
          We couldn&apos;t load this post. This is usually a temporary issue — please try again.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                       bg-[var(--brand)] hover:bg-[var(--brand-hover)]
                       transition-colors duration-150 shadow-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium
                       text-[var(--foreground-muted)] border border-[var(--border)]
                       hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]
                       transition-colors duration-150"
          >
            Back to posts
          </Link>
        </div>
      </div>
    </div>
  )
}
