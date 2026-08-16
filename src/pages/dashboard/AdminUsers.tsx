import { useMemo, useState } from 'react'
import { Ban, FileSearch, Search, ShieldCheck, Undo2, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner, Tabs, Avatar } from '@/components/ui/Misc'
import { Badge, VerificationBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, type Column } from '@/components/ui/Table'
import { adminService, type KycDocument, type KycReview } from '@/lib/services'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, titleCase } from '@/lib/format'
import type { Role, User } from '@/lib/types'

type Tab = 'all' | 'customer' | 'owner' | 'flagged'

const DOCUMENT_LABELS: { key: KycDocument; label: string }[] = [
  { key: 'governmentId', label: 'Government ID' },
  { key: 'driversLicence', label: 'Driver’s licence' },
  { key: 'selfie', label: 'Selfie' },
]

export default function AdminUsers() {
  const { users, cars, bookings, setUserStatus, setUserVerification } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')

  // Who is being reviewed, and the signed links fetched when the modal opened.
  const [reviewing, setReviewing] = useState<User | null>(null)
  const [review, setReview] = useState<KycReview | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [reason, setReason] = useState('')
  const [deciding, setDeciding] = useState(false)

  // Approval requires the full set — a missing licence is not an identity you
  // have checked.
  const hasAllDocuments = DOCUMENT_LABELS.every(({ key }) => review?.documents[key])

  const openReview = async (user: User) => {
    setReviewing(user)
    setReview(null)
    setReason('')
    setLoadingReview(true)
    try {
      setReview(await adminService.userKyc(user.id))
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setLoadingReview(false)
    }
  }

  const decide = async (verification: User['verification']) => {
    if (!reviewing) return

    if (verification === 'rejected' && !reason.trim()) {
      toast('Give a reason — it is emailed to them so they know what to fix.', 'error')
      return
    }

    setDeciding(true)
    try {
      await setUserVerification(reviewing.id, verification, reason.trim() || undefined)
      toast(
        verification === 'verified'
          ? `${reviewing.name} is now verified.`
          : `${reviewing.name}'s documents were rejected.`,
        verification === 'verified' ? 'success' : 'info',
      )
      setReviewing(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setDeciding(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (tab === 'customer' || tab === 'owner') {
        if (u.role !== (tab as Role)) return false
      }
      if (tab === 'flagged' && u.status === 'active' && u.verification !== 'pending') return false
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, tab, query])

  const counts = useMemo(
    () => ({
      all: users.length,
      customer: users.filter((u) => u.role === 'customer').length,
      owner: users.filter((u) => u.role === 'owner').length,
      flagged: users.filter((u) => u.status === 'suspended' || u.verification === 'pending').length,
    }),
    [users],
  )

  const activityFor = (user: User) => {
    if (user.role === 'owner') {
      const count = cars.filter((c) => c.ownerId === user.id).length
      return `${count} car${count === 1 ? '' : 's'} listed`
    }
    if (user.role === 'customer') {
      const count = bookings.filter((b) => b.customerId === user.id).length
      return `${count} booking${count === 1 ? '' : 's'}`
    }
    return 'Platform staff'
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{u.name}</p>
            <p className="text-dim truncate text-xs">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      hideBelow: 'sm',
      cell: (u) => <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{titleCase(u.role)}</Badge>,
    },
    { key: 'activity', header: 'Activity', hideBelow: 'md', cell: (u) => activityFor(u) },
    {
      key: 'verification',
      header: 'KYC',
      cell: (u) => <VerificationBadge status={u.verification} />,
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'sm',
      cell: (u) => (
        <Badge tone={u.status === 'active' ? 'success' : 'danger'}>{titleCase(u.status)}</Badge>
      ),
    },
    { key: 'joined', header: 'Joined', hideBelow: 'lg', cell: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          {/* Reviewing means looking at the documents, so this opens them
              rather than approving straight from the row. There is no
              one-click approve here on purpose — approving an identity you
              have not seen is not a review. */}
          {u.role !== 'admin' && u.verification !== 'verified' && (
            <Button
              variant="ghost"
              size="sm"
              title="Review documents"
              onClick={() => openReview(u)}
            >
              <FileSearch className="size-4" />
            </Button>
          )}
          {u.role !== 'admin' &&
            (u.status === 'active' ? (
              <Button
                variant="ghost"
                size="sm"
                title="Suspend account"
                className="text-red-600 dark:text-red-400"
                onClick={async () => {
                  try {
                    await setUserStatus(u.id, 'suspended')
                    toast(`${u.name}'s account is suspended.`, 'info')
                  } catch (err) {
                    toast(apiError(err), 'error')
                  }
                }}
              >
                <Ban className="size-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                title="Reinstate account"
                onClick={async () => {
                  try {
                    await setUserStatus(u.id, 'active')
                    toast(`${u.name}'s account is active again.`)
                  } catch (err) {
                    toast(apiError(err), 'error')
                  }
                }}
              >
                <Undo2 className="size-4" />
              </Button>
            ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Verify identities, suspend bad actors and keep the marketplace clean."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-dim pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="surface-raised h-11 w-full rounded-lg border pr-4 pl-10 text-sm"
          />
        </div>
        <p className="text-dim text-sm">
          {filtered.length} of {users.length} users
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'customer', label: 'Renters', count: counts.customer },
          { id: 'owner', label: 'Owners', count: counts.owner },
          { id: 'flagged', label: 'Needs attention', count: counts.flagged },
        ]}
      />

      <div className="mt-6">
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          empty={
            <EmptyState
              icon={Users}
              title="No users match"
              message="Try a different search term or switch tabs."
            />
          }
        />
      </div>

      <p className="text-dim mt-5 flex items-start gap-2 text-xs">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        Every suspension and verification decision is written to the audit log with your admin ID
        and a timestamp.
      </p>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={reviewing ? `Verify ${reviewing.name}` : ''}
        description="Check that the documents are readable, unexpired and belong to the same person."
        size="lg"
        footer={
          reviewing && (
            <>
              <Button variant="danger" loading={deciding} onClick={() => decide('rejected')}>
                Reject
              </Button>
              <Button
                loading={deciding}
                disabled={!hasAllDocuments}
                onClick={() => decide('verified')}
              >
                Approve verification
              </Button>
            </>
          )
        }
      >
        {loadingReview ? (
          <div className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : review ? (
          <div className="space-y-5">
            <div className="text-dim flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>{review.user.email}</span>
              <span>
                Submitted {review.submittedAt ? formatDate(review.submittedAt) : 'not yet'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {DOCUMENT_LABELS.map(({ key, label }) => {
                const src = review.documents[key]
                return (
                  <div key={key}>
                    <p className="text-dim mb-1.5 text-xs font-bold tracking-wide uppercase">
                      {label}
                    </p>
                    {src ? (
                      // Opens full size in a new tab — a licence number is
                      // unreadable at thumbnail size.
                      <a href={src} target="_blank" rel="noreferrer noopener">
                        <img
                          src={src}
                          alt={label}
                          className="aspect-3/4 w-full rounded-lg border object-cover transition-opacity hover:opacity-90"
                        />
                      </a>
                    ) : (
                      <div className="text-dim grid aspect-3/4 w-full place-items-center rounded-lg border border-dashed text-xs">
                        Not uploaded
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!hasAllDocuments && (
              <p className="rounded-lg bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Not every document is in yet, so this cannot be approved. You can still reject with
                a reason to prompt them.
              </p>
            )}

            <div>
              <label htmlFor="kyc-reason" className="text-sm font-bold">
                Reason (required to reject)
              </label>
              <textarea
                id="kyc-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. The licence photo is too blurred to read the expiry date."
                className="surface-raised mt-2 w-full rounded-lg border p-3 text-sm"
              />
              <p className="text-dim mt-1.5 text-xs">
                This is emailed to them, so write what they need to do differently.
              </p>
            </div>

            <p className="text-dim flex items-start gap-2 border-t pt-4 text-xs">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              These links are signed and expire in about {Math.round(review.expiresInSeconds / 60)}{' '}
              minutes. Don't save or forward the images.
            </p>
          </div>
        ) : (
          <p className="text-dim py-8 text-center text-sm">
            Could not load the documents. Close this and try again.
          </p>
        )}
      </Modal>
    </>
  )
}
