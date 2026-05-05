'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { registerSchema } from '@/lib/validation/authSchemas'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  role?: string
  form?: string
}

export default function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'author' | 'reader'>('reader')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const result = registerSchema.safeParse({ name, email, password, role })
    if (result.success) {
      setErrors({})
      return true
    }
    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors
      if (field === 'name' || field === 'email' || field === 'password' || field === 'role') {
        fieldErrors[field] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 400 && data.fields) {
          setErrors(data.fields as FieldErrors)
        } else {
          setErrors({ form: data.error ?? 'Registration failed. Please try again.' })
        }
        return
      }

      router.push('/login?registered=true')
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase =
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all duration-150'

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
          Create an account
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Join the community and start reading or writing
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.form && (
          <div
            role="alert"
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[var(--error-subtle)] border border-[var(--error)]/20 text-sm text-[var(--error)]"
          >
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.form}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="block text-sm font-medium text-[var(--foreground)]">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-required="true"
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            aria-invalid={!!errors.name}
            placeholder="Jane Smith"
            className={`${inputBase} ${errors.name ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
          />
          {errors.name && (
            <p id="register-name-error" role="alert" className="text-xs text-[var(--error)]">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="block text-sm font-medium text-[var(--foreground)]">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-required="true"
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            aria-invalid={!!errors.email}
            placeholder="you@example.com"
            className={`${inputBase} ${errors.email ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
          />
          {errors.email && (
            <p id="register-email-error" role="alert" className="text-xs text-[var(--error)]">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-describedby={errors.password ? 'register-password-error' : 'register-password-hint'}
              aria-invalid={!!errors.password}
              placeholder="••••••••"
              className={`${inputBase} pr-10 ${errors.password ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="register-password-error" role="alert" className="text-xs text-[var(--error)]">
              {errors.password}
            </p>
          ) : (
            <p id="register-password-hint" className="text-xs text-[var(--foreground-subtle)]">
              Must be at least 8 characters
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['reader', 'author'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex flex-col items-start gap-1 px-3.5 py-3 rounded-lg border text-left transition-all duration-150 ${
                  role === r
                    ? 'border-[var(--brand)] bg-[var(--brand-subtle)] ring-1 ring-[var(--brand)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]'
                }`}
                aria-pressed={role === r}
              >
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {r === 'reader' ? 'Read' : 'Write'}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {r === 'reader' ? 'Browse & comment on posts' : 'Publish your own posts'}
                </span>
              </button>
            ))}
          </div>
          {errors.role && (
            <p role="alert" className="text-xs text-[var(--error)]">
              {errors.role}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm mt-2"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--foreground-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
