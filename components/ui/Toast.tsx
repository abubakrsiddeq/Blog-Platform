'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    // Trigger fade-in on next tick
    const showTimer = setTimeout(() => setVisible(true), 10)

    // Auto-dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      // Allow fade-out animation to complete before calling onClose
      setTimeout(onClose, 300)
    }, 3000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const colorClasses =
    type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        fixed bottom-6 right-6 z-50 flex items-center gap-3
        px-4 py-3 rounded-lg shadow-lg max-w-sm
        transition-all duration-300 ease-in-out
        ${colorClasses}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onClose, 300)
        }}
        aria-label="Close notification"
        className="ml-2 text-white/80 hover:text-white transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
