import { useMemo, useState } from 'react'
import { BadgeCheck, Ban, Search, ShieldCheck, Undo2, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { EmptyState, Tabs, Avatar } from '@/components/ui/Misc'
import { Badge, VerificationBadge } from '@/components/ui/Badge'
import { Table, type Column } from '@/components/ui/Table'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, titleCase } from '@/lib/format'
import type { Role, User } from '@/lib/types'

type Tab = 'all' | 'customer' | 'owner' | 'flagged'

export default function AdminUsers() {
  const { users, cars, bookings, setUserStatus, setUserVerification } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')

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
          {u.verification !== 'verified' && (
            <Button
              variant="ghost"
              size="sm"
              title="Approve verification"
              onClick={async () => {
                try {
                  await setUserVerification(u.id, 'verified')
                  toast(`${u.name} is now verified.`)
                } catch (err) {
                  toast(apiError(err), 'error')
                }
              }}
            >
              <BadgeCheck className="size-4" />
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
    </>
  )
}
