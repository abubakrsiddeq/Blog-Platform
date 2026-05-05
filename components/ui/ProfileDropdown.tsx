'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import type { PublicUser } from '@/types/index'

// ── Icons ─────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type View = 'menu' | 'edit-name' | 'edit-password'

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarCircle({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold shrink-0 relative`}
      style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)',
        color: '#fff',
        boxShadow: '0 0 0 2px var(--surface), 0 0 0 3px var(--brand)',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileDropdown() {
  const { state, dispatch } = useAuth()
  const router = useRouter()
  const { user } = state

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')

  // Edit name state
  const [nameValue, setNameValue] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)

  // Edit password state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync name input when user changes
  useEffect(() => {
    if (user) setNameValue(user.name)
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    // Reset sub-views after animation
    setTimeout(() => {
      setView('menu')
      setNameError('')
      setNameSuccess(false)
      setPwError('')
      setPwSuccess(false)
      setCurrentPw('')
      setNewPw('')
    }, 200)
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

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) return
    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Surface the first field-level issue if present
        const fieldIssue =
          data.issues?.name?.[0] ?? data.issues?.newPassword?.[0] ?? null
        setNameError(fieldIssue ?? data.error ?? 'Failed to update name')
      } else {
        dispatch({ type: 'SET_USER', payload: data as PublicUser })
        setNameSuccess(true)
        setTimeout(() => setView('menu'), 1200)
      }
    } catch {
      setNameError('Network error. Please try again.')
    } finally {
      setNameLoading(false)
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPw || !newPw) return
    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 400) {
          setPwError('Current password is incorrect')
        } else {
          const fieldIssue =
            data.issues?.currentPassword?.[0] ??
            data.issues?.newPassword?.[0] ??
            null
          setPwError(fieldIssue ?? data.error ?? 'Failed to update password')
        }
      } else {
        setPwSuccess(true)
        setCurrentPw('')
        setNewPw('')
        setTimeout(() => setView('menu'), 1200)
      }
    } catch {
      setPwError('Network error. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full p-0.5 transition-all duration-200 hover:ring-2 hover:ring-[var(--brand)] hover:ring-offset-2 hover:ring-offset-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
      >
        <AvatarCircle name={user.name} size="sm" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl animate-scale-in overflow-hidden z-50"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px var(--border)' }}
          role="dialog"
          aria-label="Profile menu"
        >
          {view === 'menu' && <MenuView user={user} onEditName={() => setView('edit-name')} onEditPassword={() => setView('edit-password')} onLogout={handleLogout} />}
          {view === 'edit-name' && (
            <EditNameView
              value={nameValue}
              onChange={setNameValue}
              onSubmit={handleSaveName}
              onBack={() => setView('menu')}
              loading={nameLoading}
              error={nameError}
              success={nameSuccess}
            />
          )}
          {view === 'edit-password' && (
            <EditPasswordView
              currentPw={currentPw}
              newPw={newPw}
              onCurrentPwChange={setCurrentPw}
              onNewPwChange={setNewPw}
              onSubmit={handleSavePassword}
              onBack={() => setView('menu')}
              loading={pwLoading}
              error={pwError}
              success={pwSuccess}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Menu view ─────────────────────────────────────────────────────────────────

function MenuView({
  user,
  onEditName,
  onEditPassword,
  onLogout,
}: {
  user: PublicUser
  onEditName: () => void
  onEditPassword: () => void
  onLogout: () => void
}) {
  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, var(--brand-subtle) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-3">
          <AvatarCircle name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--foreground-muted)] truncate">{user.email}</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
                border: '1px solid var(--brand)',
                opacity: 0.85,
              }}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={onEditName}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--background-subtle)] group-hover:bg-[var(--brand-subtle)] group-hover:text-[var(--brand)] transition-colors duration-150">
            <UserIcon />
          </span>
          <span className="font-medium">Edit name</span>
          <svg className="h-3.5 w-3.5 ml-auto opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={onEditPassword}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--background-subtle)] group-hover:bg-[var(--brand-subtle)] group-hover:text-[var(--brand)] transition-colors duration-150">
            <LockIcon />
          </span>
          <span className="font-medium">Change password</span>
          <svg className="h-3.5 w-3.5 ml-auto opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="my-1.5 border-t border-[var(--border)]" />

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--error-subtle)] transition-colors duration-150">
            <LogoutIcon />
          </span>
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )
}

// ── Edit name view ────────────────────────────────────────────────────────────

function EditNameView({
  value,
  onChange,
  onSubmit,
  onBack,
  loading,
  error,
  success,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  loading: boolean
  error: string
  success: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-[var(--foreground)]">Edit name</span>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-3">
        <div>
          <label htmlFor="profile-name" className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
            Display name
          </label>
          <input
            id="profile-name"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--background-subtle)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all"
            placeholder="Your name"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--error)]">
            <XIcon /> {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--success)]">
            <CheckIcon /> Name updated!
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full py-2 rounded-xl text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)' }}
        >
          {loading ? 'Saving…' : 'Save name'}
        </button>
      </form>
    </div>
  )
}

// ── Edit password view ────────────────────────────────────────────────────────

function EditPasswordView({
  currentPw,
  newPw,
  onCurrentPwChange,
  onNewPwChange,
  onSubmit,
  onBack,
  loading,
  error,
  success,
}: {
  currentPw: string
  newPw: string
  onCurrentPwChange: (v: string) => void
  onNewPwChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  loading: boolean
  error: string
  success: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-[var(--foreground)]">Change password</span>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-3">
        <div>
          <label htmlFor="current-pw" className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
            Current password
          </label>
          <input
            id="current-pw"
            type="password"
            value={currentPw}
            onChange={(e) => onCurrentPwChange(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--background-subtle)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="new-pw" className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
            New password
          </label>
          <input
            id="new-pw"
            type="password"
            value={newPw}
            onChange={(e) => onNewPwChange(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--background-subtle)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all"
            placeholder="Min. 8 characters"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--error)]">
            <XIcon /> {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--success)]">
            <CheckIcon /> Password updated!
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !currentPw || !newPw}
          className="w-full py-2 rounded-xl text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)' }}
        >
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
