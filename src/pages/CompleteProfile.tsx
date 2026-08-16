import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Phone } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Misc'
import { Checkbox, Input } from '@/components/ui/Field'
import { useAuth, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'

/**
 * The step Google sign-up can't cover.
 *
 * Google hands back a name and an email and nothing else — no phone number.
 * For a car rental that number isn't optional: it's how an owner reaches a
 * renter at handover and how we reach either of them when a trip goes wrong.
 * So instead of leaving the field silently empty, {@link RequireRole} sends
 * anyone without one here before they can use a dashboard.
 */
export default function CompleteProfile() {
  const { user, loading, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [phone, setPhone] = useState(user?.phone ?? '')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Where the guard bounced them from, so they land where they meant to go.
  const from = (location.state as { from?: string } | null)?.from
  const fallback = user?.role === 'owner' ? '/owner' : user?.role === 'admin' ? '/admin' : '/account'

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid phone number.')
      return
    }

    if (!accepted) {
      setError('You must accept the terms to continue.')
      return
    }

    setBusy(true)
    try {
      await updateUser({ phone: phone.trim() })
      toast('Profile complete.')
      navigate(from ?? fallback, { replace: true })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  // This route sits outside the role guard — the guard is what redirects here —
  // so it has to handle an unauthenticated visitor itself rather than render a
  // blank page.
  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <AuthShell
      title="One more thing"
      subtitle={`Welcome, ${user.name.split(' ')[0]}. We just need a phone number before you can ${
        user.role === 'owner' ? 'list a car' : 'book a car'
      }.`}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <Input
          type="tel"
          label="Phone number"
          placeholder="+234 800 000 0000"
          autoComplete="tel"
          autoFocus
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<Phone className="size-4" />}
        />

        <p className="text-dim text-xs leading-relaxed">
          {user.role === 'owner'
            ? 'Renters see this only after you accept their booking, so you can arrange the handover.'
            : 'The owner sees this only after your booking is confirmed, so they can reach you at pickup.'}
        </p>

        <Checkbox
          checked={accepted}
          onChange={setAccepted}
          label={
            <>
              I agree to the{' '}
              <Link to="/terms" className="text-brand-700 dark:text-brand-300 font-semibold">
                terms of service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-brand-700 dark:text-brand-300 font-semibold">
                privacy policy
              </Link>
              .
            </>
          }
        />

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Finish setting up
        </Button>
      </form>
    </AuthShell>
  )
}
