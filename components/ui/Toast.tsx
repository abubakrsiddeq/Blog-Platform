'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10)
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3500)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const isSuccess = type === 'success'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        fixed bottom-5 right-5 z-50 flex items-start gap-3
        px-4 py-3.5 rounded-xl max-w-sm w-full
        border shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isSuccess
          ? 'bg-[var(--success-subtle)] border-[var(--success)]/30 text-[var(--foreground)]'
          : 'bg-[var(--error-subtle)] border-[var(--error)]/30 text-[var(--foreground)]'
        }
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
      `}
    >
      {/* Icon */}
      <div className={`shrink-0 mt-0.5 h-4 w-4 ${isSuccess ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
        {isSuccess ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <span className="flex-1 text-sm font-medium leading-snug">{message}</span>

      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onClose, 300)
        }}
        aria-label="Close notification"
        className="shrink-0 mt-0.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
