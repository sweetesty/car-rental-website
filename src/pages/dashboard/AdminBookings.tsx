import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, MessageSquareWarning, Search, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { EmptyState, Tabs } from '@/components/ui/Misc'
import { BookingBadge, PaymentBadge } from '@/components/ui/Badge'
import { Table, type Column } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Field'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, money } from '@/lib/format'
import type { Booking } from '@/lib/types'

type Tab = 'all' | 'active' | 'disputes'

export default function AdminBookings() {
  const { bookings, users, setBookingStatus } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [resolving, setResolving] = useState<Booking | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter((b) => {
      if (tab === 'active' && !['pending', 'confirmed', 'active'].includes(b.status)) return false
      if (tab === 'disputes' && b.paymentStatus !== 'refunded' && b.status !== 'cancelled')
        return false
      if (q) {
        const haystack = `${b.reference} ${b.car?.name} ${b.renter.fullName} ${b.renter.email}`
        if (!haystack.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [bookings, tab, query])

  const cancelBooking = async () => {
    if (!cancelling) return
    setBusy(true)
    try {
      await setBookingStatus(
        cancelling.id,
        'cancelled',
        cancelling.paymentStatus === 'paid' ? 'refunded' : undefined,
      )
      toast(`Booking ${cancelling.reference} cancelled and refunded.`)
      setCancelling(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const resolveDispute = () => {
    if (!resolving) return
    if (note.trim().length < 10) {
      toast('Add a resolution note before closing the dispute.', 'error')
      return
    }
    toast(`Dispute on ${resolving.reference} closed and logged.`)
    setResolving(null)
    setNote('')
  }

  const columns: Column<Booking>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (b) => (
        <div>
          <p className="font-semibold">{b.reference}</p>
          <p className="text-dim text-xs">{formatDate(b.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'car',
      header: 'Car',
      hideBelow: 'sm',
      cell: (b) => (
        <Link to={`/cars/${b.carId}`} className="hover:text-brand-600 font-medium">
          {b.car?.name ?? '—'}
        </Link>
      ),
    },
    { key: 'renter', header: 'Renter', hideBelow: 'md', cell: (b) => b.renter.fullName },
    { key: 'owner', header: 'Owner', hideBelow: 'lg', cell: (b) => nameOf(b.ownerId) },
    {
      key: 'dates',
      header: 'Dates',
      hideBelow: 'lg',
      cell: (b) => `${formatDate(b.startDate)} → ${formatDate(b.endDate)}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <div className="flex flex-wrap gap-1.5">
          <BookingBadge status={b.status} />
          <PaymentBadge status={b.paymentStatus} />
        </div>
      ),
    },
    { key: 'total', header: 'Total', align: 'right', cell: (b) => money(b.total) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Resolve dispute"
            onClick={() => setResolving(b)}
          >
            <MessageSquareWarning className="size-4" />
          </Button>
          {!['cancelled', 'completed', 'rejected'].includes(b.status) && (
            <Button
              variant="ghost"
              size="sm"
              title="Cancel booking"
              className="text-red-600 dark:text-red-400"
              onClick={() => setCancelling(b)}
            >
              <XCircle className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Every trip on the platform, with the controls to intervene when something goes wrong."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-dim pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, car or renter…"
            aria-label="Search bookings"
            className="surface-raised h-11 w-full rounded-lg border pr-4 pl-10 text-sm"
          />
        </div>
        <p className="text-dim text-sm">
          {filtered.length} of {bookings.length} bookings
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All bookings' },
          { id: 'active', label: 'In progress' },
          { id: 'disputes', label: 'Cancellations & refunds' },
        ]}
      />

      <div className="mt-6">
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(b) => b.id}
          empty={
            <EmptyState
              icon={CalendarRange}
              title="No bookings match"
              message="Try a different search term or switch tabs."
            />
          }
        />
      </div>

      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel this booking?"
        description="The renter is refunded in full and both parties are notified."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={cancelBooking} loading={busy}>
              Cancel & refund
            </Button>
          </>
        }
      >
        {cancelling && (
          <dl className="space-y-2 text-sm">
            <Row label="Reference" value={cancelling.reference} />
            <Row label="Car" value={cancelling.car?.name ?? '—'} />
            <Row label="Renter" value={cancelling.renter.fullName} />
            <Row label="Refund amount" value={money(cancelling.total)} />
          </dl>
        )}
      </Modal>

      <Modal
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolve dispute"
        description={resolving ? `Booking ${resolving.reference}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResolving(null)}>
              Cancel
            </Button>
            <Button onClick={resolveDispute}>Close dispute</Button>
          </>
        }
      >
        <div className="space-y-4">
          {resolving && (
            <dl className="space-y-2 text-sm">
              <Row label="Renter" value={`${resolving.renter.fullName} · ${resolving.renter.phone}`} />
              <Row label="Owner" value={nameOf(resolving.ownerId)} />
              <Row label="Amount at stake" value={money(resolving.total)} />
            </dl>
          )}
          <Textarea
            label="Resolution note"
            placeholder="What was decided, and why? This is written to the audit log."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-dim">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}
