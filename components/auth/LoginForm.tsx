'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { loginSchema } from '@/lib/validation/authSchemas'
import type { PublicUser } from '@/types/index'

interface FieldErrors {
  email?: string
  password?: string
  form?: string
}

export default function LoginForm() {
  const router = useRouter()
  const { dispatch } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const result = loginSchema.safeParse({ email, password })
    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors
      if (field === 'email' || field === 'password') {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 400 && data.fields) {
          setErrors(data.fields as FieldErrors)
        } else {
          setErrors({ form: data.error ?? 'Login failed. Please try again.' })
        }
        return
      }

      const user = data as PublicUser
      dispatch({ type: 'SET_USER', payload: user })
      router.push('/')
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Sign in to your account
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
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-required="true"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={!!errors.email}
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required="true"
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={!!errors.password}
            className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password}
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}
