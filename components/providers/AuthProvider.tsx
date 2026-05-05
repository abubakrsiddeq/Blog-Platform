'use client'

import React, { createContext, useContext, useReducer, useEffect, Dispatch } from 'react'
import type { PublicUser } from '@/types/index'

// ── State & Action types ──────────────────────────────────────────────────────

export interface AuthState {
  user: PublicUser | null
  loading: boolean
}

export type AuthAction =
  | { type: 'SET_USER'; payload: PublicUser }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean }

// ── Reducer ───────────────────────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'CLEAR_USER':
      return { ...state, user: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  state: AuthState
  dispatch: Dispatch<AuthAction>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, loading: true })

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me')
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) {
          const user: PublicUser = await res.json()
          dispatch({ type: 'SET_USER', payload: user })
        } else {
          dispatch({ type: 'CLEAR_USER' })
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'CLEAR_USER' })
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>
}
