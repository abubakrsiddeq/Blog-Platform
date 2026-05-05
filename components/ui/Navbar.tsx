'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import DarkModeToggle from '@/components/ui/DarkModeToggle'
import ProfileDropdown from '@/components/ui/ProfileDropdown'
import { useRouter } from 'next/navigation'

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

  // Detect scroll for glass effect
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
      // ignore
    }
    dispatch({ type: 'CLEAR_USER' })
    router.push('/')
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl border-b border-[var(--border)]'
          : 'border-b border-transparent'
      }`}
      style={
        scrolled
          ? {
              background:
                'linear-gradient(to right, rgba(var(--surface-rgb, 255,255,255), 0.85), rgba(var(--surface-rgb, 255,255,255), 0.85))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'color-mix(in srgb, var(--surface) 88%, transparent)',
            }
          : { backgroundColor: 'var(--surface)' }
      }
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--brand) 30%, #a78bfa 60%, #38bdf8 80%, transparent 100%)',
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Blog Platform home"
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)',
                boxShadow: '0 0 12px rgba(99,102,241,0.35)',
              }}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-gradient hidden sm:block">
              BKR Blog Platform
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" active={isActive('/')}>Home</NavLink>

            {!loading && (
              <>
                {user ? (
                  <>
                    {user.role === 'author' && (
                      <NavLink href="/dashboard" active={isActive('/dashboard')}>
                        Dashboard
                      </NavLink>
                    )}

                    <div className="flex items-center gap-2 ml-3 pl-3 border-l border-[var(--border)]">
                      <ProfileDropdown />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--border)]">
                    <NavLink href="/login" active={isActive('/login')}>Sign in</NavLink>
                    <Link
                      href="/register"
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)',
                        boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                      }}
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

          {/* ── Mobile: dark mode + hamburger ── */}
          <div className="flex md:hidden items-center gap-1">
            {!loading && user && <ProfileDropdown />}
            <DarkModeToggle />
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="p-2 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-colors duration-150"
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

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-1 animate-fade-in">
          <MobileNavLink href="/" active={isActive('/')}>Home</MobileNavLink>

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'author' && (
                    <MobileNavLink href="/dashboard" active={isActive('/dashboard')}>
                      Dashboard
                    </MobileNavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" active={isActive('/login')}>Sign in</MobileNavLink>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-3 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)' }}
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

// ── Helper link components ────────────────────────────────────────────────────

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'text-[var(--foreground)] bg-[var(--background-subtle)]'
          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--background-subtle)] text-[var(--foreground)]'
          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]'
      }`}
    >
      {children}
    </Link>
  )
}
