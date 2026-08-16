import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Misc'
import { MIN_PASSWORD_LENGTH, PasswordStrength } from '@/components/ui/PasswordStrength'
import {
  applyEmailAction,
  checkResetCode,
  completePasswordReset,
  firebaseError,
} from '@/lib/firebase'
import { useToast } from '@/lib/hooks'

/**
 * Handles the links Firebase emails out.
 *
 * Firebase hosts this step itself by default, at
 * `<project>.firebaseapp.com/__/auth/action` — which shows customers the
 * internal project id and drops them off autogo.ng at the exact moment they
 * are being asked to trust a page with a new password. Pointing Firebase's
 * action URL at `/auth/action` on our own domain brings it home.
 *
 * Firebase appends the query itself: `?mode=…&oobCode=…&continueUrl=…`. Every
 * mode it can send has to be handled here, because once the action URL is
 * customised Firebase stops handling any of them.
 */
type Phase = 'checking' | 'form' | 'done' | 'invalid'

export default function AuthAction() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const mode = params.get('mode')
  const code = params.get('oobCode')

  const [phase, setPhase] = useState<Phase>('checking')
  const [account, setAccount] = useState('')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!code) {
        setError('This link is missing its code. Request a new email.')
        setPhase('invalid')
        return
      }

      try {
        if (mode === 'resetPassword') {
          // Validated before showing the form: a dead link should say so now,
          // not after someone has chosen and typed a password twice.
          const email = await checkResetCode(code)
          if (cancelled) return
          setAccount(email)
          setPhase('form')
        } else if (mode === 'verifyEmail') {
          await applyEmailAction(code)
          if (cancelled) return
          setPhase('done')
        } else {
          setError('This link is not one we recognise.')
          setPhase('invalid')
        }
      } catch (err) {
        if (cancelled) return
        setError(firebaseError(err))
        setPhase('invalid')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [code, mode])

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setBusy(true)
    try {
      await completePasswordReset(code as string, password)
      toast('Password changed. Sign in with your new one.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(firebaseError(err))
      setBusy(false)
    }
  }

  if (phase === 'checking') {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (phase === 'invalid') {
    return (
      <AuthShell
        title="This link no longer works"
        subtitle="Reset links can only be used once, and expire about an hour after they're sent."
      >
        <div className="space-y-5">
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
          <Link to="/forgot-password" className="block">
            <Button fullWidth size="lg">
              Send a new link
            </Button>
          </Link>
          <Link
            to="/login"
            className="text-dim hover:text-brand-600 block text-center text-sm"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (phase === 'done') {
    return (
      <AuthShell title="Email confirmed" subtitle="Your email address is verified.">
        <div className="space-y-5">
          <p className="text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 flex items-center gap-2 rounded-lg p-3.5 text-sm">
            <CheckCircle2 className="size-4.5 shrink-0" />
            All done — nothing else to do.
          </p>
          <Link to="/login" className="block">
            <Button fullWidth size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={`For ${account}. Pick something you don't use anywhere else.`}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <div>
          <Input
            type="password"
            label="New password"
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="size-4" />}
          />
          <PasswordStrength value={password} />
        </div>

        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="size-4" />}
        />

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Save new password
        </Button>
      </form>
    </AuthShell>
  )
}
