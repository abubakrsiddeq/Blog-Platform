'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

export default function Navbar() {
  const { state, dispatch } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { user, loading } = state

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Add shadow on scroll
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors — still clear local state
    }
    dispatch({ type: 'CLEAR_USER' })
    router.push('/')
  }

  const navLinkClass =
    'text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors duration-150'

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm'
          : 'bg-[var(--surface)] border-b border-[var(--border)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Blog Platform home"
          >
            <div className="h-7 w-7 rounded-lg bg-[var(--brand)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-150">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
              Blog Platform
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive('/')
                  ? 'text-[var(--foreground)] bg-[var(--background-subtle)]'
                  : navLinkClass
              }`}
            >
              Home
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {user.role === 'author' && (
                      <Link
                        href="/dashboard"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                          isActive('/dashboard')
                            ? 'text-[var(--foreground)] bg-[var(--background-subtle)]'
                            : navLinkClass
                        }`}
                      >
                        Dashboard
                      </Link>
                    )}

                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center">
                          <span className="text-xs font-semibold text-[var(--brand)]">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-[var(--foreground-muted)] max-w-[120px] truncate">
                          {user.name}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors duration-150"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--border)]">
                    <Link
                      href="/login"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                        isActive('/login')
                          ? 'text-[var(--foreground)] bg-[var(--background-subtle)]'
                          : navLinkClass
                      }`}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors duration-150 shadow-sm"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </>
            )}

            <div className="ml-1 pl-1 border-l border-[var(--border)]">
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile: dark mode toggle + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <DarkModeToggle />
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="p-2 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-colors duration-150"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-1 animate-fade-in">
          <Link
            href="/"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-[var(--background-subtle)] text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]'
            }`}
          >
            Home
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="h-7 w-7 rounded-full bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[var(--brand)]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--foreground-muted)] truncate">
                      {user.name}
                    </span>
                  </div>
                  {user.role === 'author' && (
                    <Link
                      href="/dashboard"
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/dashboard') ? 'bg-[var(--background-subtle)] text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]'
                      }`}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  )
}
