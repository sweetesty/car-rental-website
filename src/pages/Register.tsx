import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Car, Lock, Mail, Phone, User as UserIcon } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Field'
import { useAuth, useToast } from '@/lib/hooks'
import { cx } from '@/lib/format'

/* Google's mark, drawn inline — lucide dropped third-party logos in v1. */
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

type SignupRole = 'customer' | 'owner'

const ROLES: { value: SignupRole; title: string; body: string; icon: typeof UserIcon }[] = [
  {
    value: 'customer',
    title: 'I want to rent',
    body: 'Browse and book cars from verified owners.',
    icon: UserIcon,
  },
  {
    value: 'owner',
    title: 'I want to earn',
    body: 'List my car and take bookings.',
    icon: Car,
  },
]

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [role, setRole] = useState<SignupRole>('customer')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 3) next.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    if (!accepted) next.terms = 'You must accept the terms to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await register({ ...form, role })
      toast('Account created. Verify your identity to unlock bookings.')
      navigate(role === 'owner' ? '/owner' : '/account', { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  /**
   * Signing up with Google still has to say which side of the marketplace you
   * are joining — without passing the role, every Google account was created
   * as a customer and could never list a car.
   */
  const withGoogle = async () => {
    if (!accepted) {
      setErrors({ terms: 'You must accept the terms to continue.' })
      return
    }
    setErrors({})
    setGoogleBusy(true)
    try {
      const user = await loginWithGoogle(role)
      toast(
        user.role === 'owner'
          ? 'Owner account ready. Add your first car to start earning.'
          : 'Account created. Verify your identity to unlock bookings.',
      )
      navigate(user.role === 'owner' ? '/owner' : '/account', { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Google sign-up failed.' })
    } finally {
      setGoogleBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for renting cars and listing your own."
      footer={
        <p className="text-dim text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-brand-700 dark:text-brand-300 font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {errors.form && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {errors.form}
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">I'm joining to…</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={cx(
                  'rounded-xl border p-4 text-left transition-colors',
                  role === option.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                    : 'surface-raised hover:border-brand-300',
                )}
              >
                <option.icon className="text-brand-600 dark:text-brand-400 size-5" />
                <p className="mt-2.5 text-sm font-bold">{option.title}</p>
                <p className="text-dim mt-0.5 text-xs leading-snug">{option.body}</p>
              </button>
            ))}
          </div>
        </fieldset>

        <Input
          label="Full name"
          placeholder="Ada Nwosu"
          autoComplete="name"
          required
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          icon={<UserIcon className="size-4" />}
        />

        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          icon={<Mail className="size-4" />}
        />

        <Input
          type="tel"
          label="Phone number"
          placeholder="+234 800 000 0000"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          icon={<Phone className="size-4" />}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="password"
            label="Password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters"
            icon={<Lock className="size-4" />}
          />
          <Input
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            icon={<Lock className="size-4" />}
          />
        </div>

        <div>
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
          {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Create account
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
          Sign up with Google as {role === 'owner' ? 'a car owner' : 'a renter'}
        </Button>

        <p className="text-dim text-center text-xs">
          Google sign-up uses the option you picked above. You can change roles later by
          contacting support.
        </p>
      </form>
    </AuthShell>
  )
}
