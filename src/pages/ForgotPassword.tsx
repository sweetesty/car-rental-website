import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, MailCheck, Mail } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { authService } from '@/lib/services'
import { apiError } from '@/lib/api'

/**
 * Password reset.
 *
 * The link on the sign-in page used to point at /support, so the only way to
 * recover an account was to email someone and wait. Firebase has sent the
 * actual reset mail all along — nothing was wired to ask it to.
 */
export default function ForgotPassword() {
  const location = useLocation()

  // Carried over from the sign-in form, so nobody types their address twice.
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    const address = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError('Enter a valid email address.')
      return
    }

    setError('')
    setBusy(true)
    try {
      /*
       * Through our own API, not the Firebase client SDK.
       *
       * Firebase sends from noreply@<project>.firebaseapp.com — no SPF/DKIM
       * tie to autogo.ng, a reputation shared with every other free project,
       * and the internal project id shown to customers. The server mints the
       * same link and sends it via Resend from support@autogo.ng, in the same
       * template as every other AUTOGO email.
       *
       * The server also emails people whose address has no account, telling
       * them so. That answer belongs in the inbox rather than on this screen,
       * where anyone typing addresses could read off who your customers are.
       */
      await authService.forgotPassword(address)
      setSent(true)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We've emailed ${email.trim()}.`}
      >
        <div className="space-y-5">
          <div className="text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 flex items-start gap-3 rounded-lg p-4 text-sm">
            <MailCheck className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">You'll get an email either way.</p>
              <p className="mt-1 leading-relaxed">
                If this address has an AUTOGO account, it contains a reset link that works once
                and expires in an hour. If it doesn't, the email says so — so check there before
                trying another address.
              </p>
            </div>
          </div>

          <p className="text-dim text-sm leading-relaxed">
            Give it a minute, and look in spam. Signed up with Google? That account has no AUTOGO
            password — use the <span className="font-semibold">Continue with Google</span> button
            instead.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="flex-1">
              <Button variant="secondary" fullWidth>
                Back to sign in
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setSent(false)
                setError('')
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a link to set a new password."
      footer={
        <Link
          to="/login"
          className="text-dim hover:text-brand-600 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
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
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4" />}
        />

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
