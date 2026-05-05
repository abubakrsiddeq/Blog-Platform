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

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Create an account
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.form && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400"
          >
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="Jane Smith"
          />
          {errors.name && (
            <p id="register-name-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="register-email-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required="true"
            aria-describedby={errors.password ? 'register-password-error' : 'register-password-hint'}
            aria-invalid={!!errors.password}
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="••••••••"
          />
          {errors.password ? (
            <p id="register-password-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          ) : (
            <p id="register-password-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            I want to
          </label>
          <select
            id="register-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'author' | 'reader')}
            aria-required="true"
            aria-describedby={errors.role ? 'register-role-error' : undefined}
            aria-invalid={!!errors.role}
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.role ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <option value="reader">Read posts</option>
            <option value="author">Write posts</option>
          </select>
          {errors.role && (
            <p id="register-role-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.role}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {submitting && <LoadingSpinner size="sm" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
