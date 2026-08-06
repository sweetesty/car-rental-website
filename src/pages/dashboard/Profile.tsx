import { useState } from 'react'
import { BadgeCheck, IdCard, ShieldCheck, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Misc'
import { Input } from '@/components/ui/Field'
import { VerificationBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Misc'
import { useAuth, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, titleCase } from '@/lib/format'

const KYC_STEPS = [
  {
    icon: IdCard,
    title: 'Government ID',
    body: 'NIN slip, international passport or voter’s card. Both sides, clearly readable.',
  },
  {
    icon: BadgeCheck,
    title: 'Driver’s licence',
    body: 'A valid Nigerian or international licence held for at least two years.',
  },
  {
    icon: ShieldCheck,
    title: 'Selfie check',
    body: 'A live photo so we can confirm the documents belong to you.',
  },
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const save = async () => {
    setSaving(true)
    try {
      await updateUser({ name: form.name.trim(), phone: form.phone.trim() })
      toast('Profile updated.')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const startKyc = async () => {
    setSubmitting(true)
    try {
      await updateUser({ verification: 'pending' })
      toast('Documents submitted. Verification usually takes under 24 hours.')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile & verification" subtitle="Keep your details current so bookings run smoothly." />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight">Personal details</h2>

            <div className="mt-5 flex items-center gap-4">
              <Avatar name={user.name} src={user.avatarUrl} size="lg" />
              <Button variant="secondary" size="sm" onClick={() => toast('Photo upload coming soon.', 'info')}>
                <Upload className="size-4" />
                Change photo
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Email address"
                value={user.email}
                disabled
                hint="Contact support to change your email."
              />
              <Input label="Account type" value={titleCase(user.role)} disabled />
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={save} loading={saving}>
                Save changes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight">Identity verification (KYC)</h2>
            <p className="text-dim mt-1.5 text-sm text-pretty">
              We verify every account before money changes hands. It protects owners from fraud and
              renters from fake listings.
            </p>

            <ul className="mt-6 space-y-4">
              {KYC_STEPS.map((step) => (
                <li key={step.title} className="flex items-start gap-4">
                  <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-10 shrink-0 place-items-center rounded-xl">
                    <step.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="text-dim mt-0.5 text-sm leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            {user.verification === 'verified' ? (
              <p className="text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 mt-6 flex items-center gap-2 rounded-lg p-3.5 text-sm">
                <BadgeCheck className="size-4.5 shrink-0" />
                Your identity is verified. Nothing more to do.
              </p>
            ) : user.verification === 'pending' ? (
              <p className="mt-6 rounded-lg bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Your documents are under review. We'll email you once a decision is made.
              </p>
            ) : (
              <Button className="mt-6" onClick={startKyc} loading={submitting}>
                <Upload className="size-4" />
                Upload documents
              </Button>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-dim text-xs font-bold tracking-wide uppercase">Account status</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-dim">Verification</span>
                <VerificationBadge status={user.verification} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-dim">Status</span>
                <span className="font-semibold">{titleCase(user.status)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-dim">Member since</span>
                <span className="font-semibold">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-dim text-xs font-bold tracking-wide uppercase">Security</p>
            <div className="mt-4 space-y-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => toast('Password reset link sent to your email.')}
              >
                Change password
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => toast('Two-factor authentication coming soon.', 'info')}
              >
                Enable two-factor auth
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}
