import { useState } from 'react'
import { BadgeCheck, Check, IdCard, ShieldCheck, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Misc'
import { Input } from '@/components/ui/Field'
import { VerificationBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Misc'
import { useAuth, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { firebaseError, isGoogleAccount, sendPasswordReset } from '@/lib/firebase'
import { uploadService, type KycDocument } from '@/lib/services'
import { cx, formatDate, titleCase } from '@/lib/format'

const KYC_STEPS: { kind: KycDocument; icon: typeof IdCard; title: string; body: string }[] = [
  {
    kind: 'governmentId',
    icon: IdCard,
    title: 'Government ID',
    body: 'NIN slip, international passport or voter’s card. Both sides, clearly readable.',
  },
  {
    kind: 'driversLicence',
    icon: BadgeCheck,
    title: 'Driver’s licence',
    body: 'A valid Nigerian or international licence held for at least two years.',
  },
  {
    kind: 'selfie',
    icon: ShieldCheck,
    title: 'Selfie check',
    body: 'A live photo so we can confirm the documents belong to you.',
  },
]

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  // Files chosen but not yet sent, and which one is in flight right now.
  const [picked, setPicked] = useState<Partial<Record<KycDocument, File>>>({})
  const [uploading, setUploading] = useState<KycDocument | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  /**
   * Sends a real Firebase password-reset email. This previously only showed a
   * toast claiming a link had been sent, so anyone who clicked it waited for
   * an email that was never going to arrive.
   */
  const resetPassword = async () => {
    if (!user?.email) return

    if (isGoogleAccount()) {
      toast('You sign in with Google, so there is no AUTOGO password to reset.', 'info')
      return
    }

    setResetting(true)
    try {
      await sendPasswordReset(user.email)
      toast(`Reset link sent to ${user.email}. Check your inbox and spam folder.`)
    } catch (error) {
      toast(firebaseError(error), 'error')
    } finally {
      setResetting(false)
    }
  }

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

  /**
   * Uploads to Cloudinary, then saves the returned URL on the account. Unlike
   * a KYC document this one is public — it is shown to the other party on a
   * booking — so a plain secure_url is the right thing to store.
   */
  const changeAvatar = async (file: File | null) => {
    if (!file) return

    if (file.size > MAX_DOCUMENT_BYTES) {
      toast('Your photo must be 5MB or smaller.', 'error')
      return
    }

    setAvatarBusy(true)
    try {
      const { url } = await uploadService.avatar(file)
      await updateUser({ avatarUrl: url })
      toast('Profile photo updated.')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setAvatarBusy(false)
    }
  }

  const documentsOnFile = KYC_STEPS.filter((step) => user?.kyc?.[step.kind]).length

  const chooseDocument = (kind: KycDocument, file: File | null) => {
    if (!file) return

    if (file.size > MAX_DOCUMENT_BYTES) {
      toast('Each document must be 5MB or smaller.', 'error')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast('Upload a photo or scan — JPEG, PNG, WebP or AVIF.', 'error')
      return
    }

    setPicked((prev) => ({ ...prev, [kind]: file }))
  }

  /**
   * Uploads whatever the person picked, then submits the storage IDs.
   *
   * The two steps are separate on purpose: the files go to Cloudinary under
   * authenticated delivery, and only their IDs reach our own record. The server
   * decides the verification status from which documents are actually present —
   * this call cannot set itself to verified.
   */
  const submitKyc = async () => {
    const pending = KYC_STEPS.map((step) => step.kind).filter((kind) => picked[kind])
    if (!pending.length) return

    setSubmitting(true)
    try {
      const ids: Partial<Record<KycDocument, string>> = {}
      for (const kind of pending) {
        setUploading(kind)
        ids[kind] = await uploadService.kyc(picked[kind] as File, kind)
      }
      setUploading(null)

      const updated = await updateUser({ kyc: ids })
      setPicked({})

      toast(
        updated?.verification === 'pending'
          ? 'Documents submitted. Verification usually takes under 24 hours.'
          : 'Documents saved. Upload the remaining ones to start your review.',
      )
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setUploading(null)
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
              <label
                className={cx(
                  'surface-raised inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-bold',
                  'focus-within:ring-brand-500 hover:border-brand-300 focus-within:ring-2 focus-within:ring-offset-1',
                  avatarBusy && 'pointer-events-none opacity-60',
                )}
              >
                <Upload className="size-4" />
                {avatarBusy ? 'Uploading…' : 'Change photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={avatarBusy}
                  onChange={(e) => {
                    changeAvatar(e.target.files?.[0] ?? null)
                    e.target.value = ''
                  }}
                />
              </label>
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

          {/* Verification is for the two sides of the marketplace. Platform
              staff approve documents rather than submit them. */}
          {user.role !== 'admin' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight">Identity verification (KYC)</h2>
              <p className="text-dim mt-1.5 text-sm text-pretty">
                {user.role === 'owner'
                  ? 'We verify every owner before we send them money. It protects renters from fake listings and you from fraudulent bookings.'
                  : 'We verify renters before they drive away in someone else’s car. Your documents are stored privately and only seen by our review team.'}
              </p>

              {user.verification === 'rejected' && user.kyc?.rejectionReason && (
                <p className="mt-4 rounded-lg bg-red-50 p-3.5 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
                  <span className="font-bold">Not approved:</span> {user.kyc.rejectionReason}
                  <br />
                  Upload a clearer copy below and we'll review it again.
                </p>
              )}

              <ul className="mt-6 space-y-4">
                {KYC_STEPS.map((step) => {
                  const onFile = user.kyc?.[step.kind]
                  const chosen = picked[step.kind]
                  const busy = uploading === step.kind

                  return (
                    <li key={step.kind} className="flex items-start gap-4">
                      <span
                        className={cx(
                          'grid size-10 shrink-0 place-items-center rounded-xl',
                          onFile && !chosen
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
                        )}
                      >
                        {onFile && !chosen ? (
                          <Check className="size-5" />
                        ) : (
                          <step.icon className="size-5" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="text-dim mt-0.5 text-sm leading-relaxed">{step.body}</p>

                        {user.verification !== 'verified' && (
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {/* A styled label wrapping a hidden input — the
                                native file button can't be themed, and this
                                stays keyboard- and screen-reader-accessible. */}
                            <label
                              className={cx(
                                'surface-raised inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold',
                                'focus-within:ring-brand-500 focus-within:ring-2 focus-within:ring-offset-1',
                                busy && 'pointer-events-none opacity-60',
                              )}
                            >
                              <Upload className="size-3.5" />
                              {chosen || onFile ? 'Replace' : 'Choose file'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="sr-only"
                                disabled={busy || submitting}
                                onChange={(e) => {
                                  chooseDocument(step.kind, e.target.files?.[0] ?? null)
                                  // Reset so picking the same file twice still fires.
                                  e.target.value = ''
                                }}
                              />
                            </label>

                            <span className="text-dim min-w-0 truncate text-xs">
                              {busy
                                ? 'Uploading…'
                                : chosen
                                  ? chosen.name
                                  : onFile
                                    ? 'On file'
                                    : 'Not uploaded'}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {user.verification === 'verified' ? (
                <p className="text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 mt-6 flex items-center gap-2 rounded-lg p-3.5 text-sm">
                  <BadgeCheck className="size-4.5 shrink-0" />
                  Your identity is verified. Nothing more to do.
                </p>
              ) : (
                <>
                  {/* "Under review" only when something is genuinely on file.
                      Accounts marked pending by the old flow have no documents
                      stored at all, and telling those people to sit tight leaves
                      them waiting on a review that can never happen. */}
                  {user.verification === 'pending' &&
                    !Object.keys(picked).length &&
                    (documentsOnFile > 0 ? (
                      <p className="mt-6 rounded-lg bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {documentsOnFile === KYC_STEPS.length
                          ? "Your documents are under review. We'll email you once a decision is made."
                          : `We have ${documentsOnFile} of your ${KYC_STEPS.length} documents. Upload the rest to complete your review.`}
                      </p>
                    ) : (
                      <p className="mt-6 rounded-lg bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        We don't have any of your documents yet. Upload all three above to start
                        your review.
                      </p>
                    ))}

                  <Button
                    className="mt-6"
                    onClick={submitKyc}
                    loading={submitting}
                    disabled={!Object.keys(picked).length}
                  >
                    <Upload className="size-4" />
                    Submit {Object.keys(picked).length || ''} document
                    {Object.keys(picked).length === 1 ? '' : 's'}
                  </Button>

                  <p className="text-dim mt-3 text-xs leading-relaxed">
                    Images up to 5MB each. Documents are encrypted at rest and are never shown on
                    your public profile or to anyone you rent from.
                  </p>
                </>
              )}
            </Card>
          )}
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
                loading={resetting}
                onClick={resetPassword}
              >
                Change password
              </Button>
              {/* Deliberately plain text, not a button. A control that only
                  says "coming soon" invites a click and then disappoints. */}
              <p className="text-dim pt-1 text-xs">
                Two-factor authentication is not available yet.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}
