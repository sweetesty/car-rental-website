import { useMemo, useState } from 'react'
import { Download, Receipt, RotateCcw, Search, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { EmptyState, StatTile, Tabs } from '@/components/ui/Misc'
import { Badge } from '@/components/ui/Badge'
import { Table, type Column } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, money, moneyCompact, titleCase } from '@/lib/format'
import { downloadCsv, stampedFilename, toCsv } from '@/lib/csv'
import type { Transaction } from '@/lib/types'

type Tab = 'all' | 'payment' | 'payout' | 'refund'

export default function AdminPayments() {
  const { transactions, bookings, setBookingStatus } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [refunding, setRefunding] = useState<Transaction | null>(null)
  const [busy, setBusy] = useState(false)

  const totals = useMemo(() => {
    const sum = (type: Transaction['type']) =>
      transactions
        .filter((t) => t.type === type && t.status === 'success')
        .reduce((acc, t) => acc + t.amount, 0)
    const gross = sum('payment')
    const refunds = sum('refund')
    const payouts = sum('payout')
    return { gross, refunds, payouts, net: gross - refunds - payouts }
  }, [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (tab !== 'all' && t.type !== tab) return false
      if (q) {
        const booking = bookings.find((b) => b.id === t.bookingId)
        const haystack = `${t.reference} ${booking?.reference ?? ''} ${booking?.renter.fullName ?? ''}`
        if (!haystack.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [transactions, bookings, tab, query])

  /**
   * Exports what is currently on screen, not the whole ledger — if the admin
   * has filtered to refunds, a report containing every payment is not the
   * report they asked for. The heading says which view it came from.
   */
  const exportCsv = () => {
    if (!filtered.length) {
      toast('Nothing to export in this view.', 'info')
      return
    }

    const rows = filtered.map((t) => {
      const booking = bookings.find((b) => b.id === t.bookingId)
      return [
        formatDate(t.createdAt),
        t.reference,
        titleCase(t.type),
        t.status,
        // Unformatted so the column stays numeric in a spreadsheet.
        t.amount,
        t.channel,
        booking?.reference ?? '',
        booking?.renter.fullName ?? '',
        booking?.car?.name ?? '',
      ]
    })

    downloadCsv(
      stampedFilename(tab === 'all' ? 'autogo-payments' : `autogo-${tab}s`),
      toCsv(
        [
          'Date',
          'Reference',
          'Type',
          'Status',
          'Amount (NGN)',
          'Channel',
          'Booking',
          'Customer',
          'Car',
        ],
        rows,
      ),
    )

    toast(`${filtered.length} transaction${filtered.length === 1 ? '' : 's'} exported.`)
  }

  // Marking the booking refunded is what creates the refund row — the ledger is
  // derived from booking state rather than stored separately.
  const issueRefund = async () => {
    if (!refunding) return
    setBusy(true)
    try {
      await setBookingStatus(refunding.bookingId, 'cancelled', 'refunded')
      toast(`${money(refunding.amount)} refunded to the customer.`)
      setRefunding(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (t) => (
        <div>
          <p className="font-semibold">{t.reference}</p>
          <p className="text-dim text-xs">{formatDate(t.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'booking',
      header: 'Booking',
      hideBelow: 'sm',
      cell: (t) => bookings.find((b) => b.id === t.bookingId)?.reference ?? '—',
    },
    {
      key: 'customer',
      header: 'Customer',
      hideBelow: 'lg',
      cell: (t) => bookings.find((b) => b.id === t.bookingId)?.renter.fullName ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (t) => (
        <Badge tone={t.type === 'payout' ? 'success' : t.type === 'refund' ? 'warning' : 'brand'}>
          {titleCase(t.type)}
        </Badge>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      hideBelow: 'md',
      cell: (t) => titleCase(t.channel.replace('-', ' ')),
    },
    { key: 'amount', header: 'Amount', align: 'right', cell: (t) => money(t.amount) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (t) =>
        t.type === 'payment' && t.status === 'success' ? (
          <Button
            variant="ghost"
            size="sm"
            title="Refund this payment"
            onClick={() => setRefunding(t)}
          >
            <RotateCcw className="size-4" />
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Every transaction across the platform, with refund controls."
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="size-4" />
            Financial report
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Gross payments" value={moneyCompact(totals.gross)} icon={Wallet} />
        <StatTile label="Refunds issued" value={moneyCompact(totals.refunds)} icon={RotateCcw} />
        <StatTile label="Owner payouts" value={moneyCompact(totals.payouts)} icon={Receipt} />
        <StatTile
          label="Held by AUTOGO"
          value={moneyCompact(totals.net)}
          delta="Commission + funds in escrow"
        />
      </div>

      <div className="mb-5 relative">
        <Search className="text-dim pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by transaction, booking reference or customer…"
          aria-label="Search transactions"
          className="surface-raised h-11 w-full rounded-lg border pr-4 pl-10 text-sm"
        />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: transactions.length },
          { id: 'payment', label: 'Payments' },
          { id: 'payout', label: 'Payouts' },
          { id: 'refund', label: 'Refunds' },
        ]}
      />

      <div className="mt-6">
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          empty={
            <EmptyState
              icon={Receipt}
              title="No transactions match"
              message="Try a different search term or switch tabs."
            />
          }
        />
      </div>

      <Modal
        open={!!refunding}
        onClose={() => setRefunding(null)}
        title="Refund this payment?"
        description="The full amount goes back to the customer's original payment method."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefunding(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={issueRefund} loading={busy}>
              Refund {refunding ? money(refunding.amount) : ''}
            </Button>
          </>
        }
      >
        <p className="text-sm">
          The associated booking is cancelled and both parties are notified by email and SMS.
          Refunds settle in 3–5 working days.
        </p>
      </Modal>
    </>
  )
}
