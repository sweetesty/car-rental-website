import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Role, User } from '@/lib/types'
import { authService } from '@/lib/services'
import { isApiUnavailable, setResyncHandler, setUnauthorizedHandler } from '@/lib/api'
import {
  firebaseConfigured,
  firebaseError,
  firebaseSignOut,
  registerWithPassword,
  signInWithGoogle,
  signInWithPassword,
  watchAuth,
} from '@/lib/firebase'
import { allUsers } from '@/lib/mockData'

/** Password for the bundled demo accounts when Firebase/the API is unavailable. */
const DEMO_PASSWORD = 'autogo'

interface AuthValue {
  user: User | null
  loading: boolean
  /** True when the session is a local demo account, not a real Firebase one. */
  demoSession: boolean
  login: (email: string, password: string) => Promise<User>
  /**
   * `role` is only honoured when the account is created — Google sign-in from
   * the register page can therefore produce an owner, while signing in from
   * the login page leaves an existing account's role untouched.
   */
  loginWithGoogle: (role?: 'customer' | 'owner') => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
  updateUser: (patch: Partial<User>) => Promise<void>
  /** Convenience for guards and conditional nav. */
  hasRole: (...roles: Role[]) => boolean
}

export interface RegisterInput {
  name: string
  email: string
  phone: string
  password: string
  role: Exclude<Role, 'admin'>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValue>(null as unknown as AuthValue)

const USER_KEY = 'autogo:user'
const DEMO_KEY = 'autogo:demo-session'

/**
 * Authentication is Firebase on the client, exchanged for the AUTOGO user
 * record via `POST /api/auth/sync`. Firebase owns the credentials; Mongo owns
 * the role, KYC state and everything else the UI needs.
 *
 * When Firebase isn't configured (or the API can't be reached) this falls back
 * to the bundled seed accounts so the whole app stays walkable offline.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [demoSession, setDemoSession] = useState(false)
  const [loading, setLoading] = useState(true)

  // Carried into the /sync call that follows a fresh registration.
  const pendingSignup = useRef<{ role: 'customer' | 'owner'; phone: string } | null>(null)

  const persist = useCallback((next: User | null, demo = false) => {
    setUser(next)
    setDemoSession(demo)
    if (next) {
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      if (demo) localStorage.setItem(DEMO_KEY, '1')
      else localStorage.removeItem(DEMO_KEY)
    } else {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(DEMO_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    void firebaseSignOut()
    persist(null)
  }, [persist])

  useEffect(() => {
    setUnauthorizedHandler(() => persist(null))

    // Lets the API layer repair a valid Firebase session that has no local
    // account record — it creates one and replays the failed request, instead
    // of showing the user an error they can do nothing about.
    setResyncHandler(async () => {
      const synced = await authService.sync()
      persist(synced)
      return synced
    })

    return () => setResyncHandler(null)
  }, [persist])

  /** Restores a demo session across reloads; Firebase restores its own. */
  const restoreDemoSession = useCallback(() => {
    if (localStorage.getItem(DEMO_KEY) !== '1') return false
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return false
    try {
      persist(JSON.parse(raw) as User, true)
      return true
    } catch {
      return false
    }
  }, [persist])

  // Firebase is the source of truth for "is someone signed in". Every state
  // change re-syncs the Mongo record so role/KYC edits land without a reload.
  useEffect(() => {
    let cancelled = false

    const unsubscribe = watchAuth(async (firebaseUser) => {
      if (cancelled) return

      if (!firebaseUser) {
        if (!restoreDemoSession()) persist(null)
        setLoading(false)
        return
      }

      const signup = pendingSignup.current
      pendingSignup.current = null

      const redirectRole = sessionStorage.getItem('autogo:google-role') as 'customer' | 'owner' | null
      if (redirectRole) {
        sessionStorage.removeItem('autogo:google-role')
      }

      // Typed explicitly: without it the union of the three shapes below has no
      // common `phone`, and reading it in the fallback fails to compile.
      const syncPayload: { role?: 'customer' | 'owner'; phone?: string } =
        signup ?? (redirectRole ? { role: redirectRole } : {})

      try {
        const synced = await authService.sync(syncPayload)
        if (!cancelled) persist(synced)
      } catch (err) {
        if (cancelled) return
        // Signed in with Firebase but the API can't confirm the record. Keep the
        // session rather than bouncing the user out of an app they just entered.
        if (isApiUnavailable(err)) {
          persist({
            id: firebaseUser.uid,
            name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'AUTOGO user',
            email: firebaseUser.email ?? '',
            phone: syncPayload.phone,
            role: syncPayload.role ?? 'customer',
            verification: 'unverified',
            status: 'active',
            createdAt: new Date().toISOString(),
          })
        } else {
          persist(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [persist, restoreDemoSession])

  /** Signs in against the bundled seed accounts when there's no real backend. */
  const demoLogin = useCallback(
    (email: string, password: string) => {
      const found = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!found || password !== DEMO_PASSWORD) {
        throw new Error('Incorrect email or password.')
      }
      if (found.status === 'suspended') {
        throw new Error('This account is suspended. Contact support@autogo.ng.')
      }
      persist(found, true)
      setLoading(false)
      return found
    },
    [persist],
  )

  /**
   * Exchanges a live Firebase session for the Mongo record, tolerating a down API.
   *
   * `role` reaches the server only to seed a brand-new account; /auth/sync
   * ignores it for an existing user, so signing in again can never silently
   * change someone's role.
   */
  const syncOrFallback = useCallback(
    async (uid: string, email: string, role?: 'customer' | 'owner') => {
      try {
        const synced = await authService.sync(role ? { role } : {})
        persist(synced)
        return synced
      } catch (err) {
        if (!isApiUnavailable(err)) throw err
        const stub: User = {
          id: uid,
          name: email.split('@')[0],
          email,
          role: role ?? 'customer',
          verification: 'unverified',
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        persist(stub)
        return stub
      }
    },
    [persist],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      if (!firebaseConfigured) return demoLogin(email, password)
      try {
        const firebaseUser = await signInWithPassword(email.trim(), password)
        return await syncOrFallback(firebaseUser.uid, email)
      } catch (err) {
        // A demo email typed against a live Firebase project should still work.
        if (allUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
          return demoLogin(email, password)
        }
        throw new Error(firebaseError(err))
      }
    },
    [demoLogin, syncOrFallback],
  )

  const loginWithGoogle = useCallback(
    async (role?: 'customer' | 'owner') => {
      if (!firebaseConfigured) {
        throw new Error('Google sign-in needs Firebase configured. Use a demo account for now.')
      }

      if (role) {
        pendingSignup.current = { role, phone: '' }
        sessionStorage.setItem('autogo:google-role', role)
      }

      try {
        const firebaseUser = await signInWithGoogle()
        // Null means the popup was blocked and a full-page redirect started —
        // the browser is navigating away, so there is nothing to resolve with.
        // watchAuth picks the session up when it returns.
        if (!firebaseUser) return null as never
        return await syncOrFallback(firebaseUser.uid, firebaseUser.email ?? '', role)
      } catch (err) {
        if (role) {
          pendingSignup.current = null
          sessionStorage.removeItem('autogo:google-role')
        }
        throw new Error(firebaseError(err))
      }
    },
    [syncOrFallback],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const email = input.email.trim().toLowerCase()
      const name = input.name.trim()

      if (!firebaseConfigured) {
        // Offline: mint a local-only account so the flow can still be walked.
        const created: User = {
          id: `u-${Date.now()}`,
          name,
          email,
          phone: input.phone.trim(),
          role: input.role,
          verification: 'unverified',
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        persist(created, true)
        setLoading(false)
        return created
      }

      try {
        // Handed to the watchAuth listener, which creates the Mongo record.
        pendingSignup.current = { role: input.role, phone: input.phone.trim() }
        await registerWithPassword(email, input.password, name)
        const synced = await authService.sync({ role: input.role, phone: input.phone.trim() })
        persist(synced)
        return synced
      } catch (err) {
        pendingSignup.current = null
        if (isApiUnavailable(err)) {
          const created: User = {
            id: `u-${Date.now()}`,
            name,
            email,
            phone: input.phone.trim(),
            role: input.role,
            verification: 'unverified',
            status: 'active',
            createdAt: new Date().toISOString(),
          }
          persist(created)
          return created
        }
        throw new Error(firebaseError(err))
      }
    },
    [persist],
  )

  const updateUser = useCallback(
    async (patch: Partial<User>) => {
      if (demoSession || !firebaseConfigured) {
        if (user) persist({ ...user, ...patch }, demoSession)
        return
      }
      try {
        const updated = await authService.updateProfile({
          name: patch.name,
          phone: patch.phone,
          verification: patch.verification,
        })
        persist(updated)
      } catch (err) {
        if (!isApiUnavailable(err) || !user) throw err
        persist({ ...user, ...patch })
      }
    },
    [persist, user, demoSession],
  )

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      demoSession,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
      hasRole,
    }),
    [user, loading, demoSession, login, loginWithGoogle, register, logout, updateUser, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
