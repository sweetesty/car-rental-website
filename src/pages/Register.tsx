import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Car, Lock, Mail, Phone, User as UserIcon } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Field'
import { useAuth, useToast } from '@/lib/hooks'
import { cx } from '@/lib/format'

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
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [role, setRole] = useState<SignupRole>('customer')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

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
      </form>
    </AuthShell>
  )
}
