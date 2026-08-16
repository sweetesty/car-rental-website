import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, Mail } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Field'
import { useAuth, useToast } from '@/lib/hooks'
import type { Role } from '@/lib/types'

const HOME_FOR: Record<Role, string> = {
  admin: '/admin',
  owner: '/owner',
  customer: '/account',
}

/* Google's mark is drawn inline — lucide dropped third-party logos in v1. */
const GoogleMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.87c2.27-2.09 3.56-5.17 3.56-8.88Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
)

/** Seeded accounts so the roles can be explored without a backend. */
const DEMOS = [
  { label: 'Customer', email: 'ngozi@example.com' },
  { label: 'Car owner', email: 'chidi@autogo.ng' },
  { label: 'Admin', email: 'admin@autogo.ng' },
]

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  const land = (user: { name: string; role: keyof typeof HOME_FOR }) => {
    toast(`Welcome back, ${user.name.split(' ')[0]}.`)
    navigate(from ?? HOME_FOR[user.role], { replace: true })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      land(await login(email, password, remember))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const withGoogle = async () => {
    setError('')
    setGoogleBusy(true)
    try {
      // Same "Keep me signed in" choice as the password form — the checkbox
      // sits above both buttons and has to mean the same thing for each.
      land(await loginWithGoogle(undefined, remember))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
    } finally {
      setGoogleBusy(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('autogo')
    setError('')
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your bookings, listings and payouts."
      footer={
        <p className="text-dim text-sm">
          New to AUTOGO?{' '}
          <Link to="/register" className="text-brand-700 dark:text-brand-300 font-semibold">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4" />}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="size-4" />}
        />

        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
          <Link to="/support" className="text-dim hover:text-brand-600 text-sm">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Sign in
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-current opacity-15" />
          <span className="text-dim text-xs font-semibold tracking-wide uppercase">or</span>
          <span className="h-px flex-1 bg-current opacity-15" />
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          loading={googleBusy}
          onClick={withGoogle}
        >
          {!googleBusy && <GoogleMark className="size-4.5" />}
          Continue with Google
        </Button>
      </form>

      {/*
        The demo-account shortcuts are a development aid: they publish working
        credentials, so they must never appear on the live site. Gated on the
        dev build rather than deleted, because they save a lot of typing when
        testing the three roles locally.
      */}
      {import.meta.env.DEV && (
        <div className="mt-8 border-t pt-6">
          <p className="text-dim text-xs font-bold tracking-wide uppercase">
            Try a demo account (dev only)
          </p>
          <p className="text-dim mt-1.5 text-xs">
            Any of these with the password <code className="font-semibold">autogo</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="surface-sunken hover:border-brand-400 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  )
}
