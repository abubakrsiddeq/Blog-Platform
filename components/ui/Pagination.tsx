'use client'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  // Build page number array with ellipsis logic
  function getPageNumbers(): (number | 'ellipsis-start' | 'ellipsis-end')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1]

    if (page > 3) pages.push('ellipsis-start')

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) pages.push('ellipsis-end')

    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-6">
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Go to previous page"
        className="px-3 py-2 rounded-md text-sm font-medium
          text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {pageNumbers.map((p, idx) => {
        if (p === 'ellipsis-start' || p === 'ellipsis-end') {
          return (
            <span
              key={p}
              aria-hidden="true"
              className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm select-none"
            >
              …
            </span>
          )
        }

        const isActive = p === page
        return (
          <button
            key={`page-${p}-${idx}`}
            onClick={() => onPageChange(p)}
            aria-label={`Go to page ${p}`}
            aria-current={isActive ? 'page' : undefined}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {p}
          </button>
        )
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Go to next page"
        className="px-3 py-2 rounded-md text-sm font-medium
          text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors"
      >
        Next →
      </button>
    </nav>
  )
}
