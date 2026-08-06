import { useMemo } from 'react'
import { Download, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Table, type Column } from '@/components/ui/Table'
import { EmptyState, StatTile } from '@/components/ui/Misc'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { formatDate, money, titleCase } from '@/lib/format'
import type { Transaction } from '@/lib/types'

export default function MyPayments() {
  const { user } = useAuth()
  const { transactions, bookings } = useData()
  const toast = useToast()

  const mine = useMemo(() => {
    const myBookingIds = new Set(
      bookings.filter((b) => b.customerId === user?.id).map((b) => b.id),
    )
    return transactions.filter((t) => myBookingIds.has(t.bookingId) && t.type !== 'payout')
  }, [transactions, bookings, user?.id])

  const totals = useMemo(() => {
    const paid = mine.filter((t) => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)
    const refunded = mine.filter((t) => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0)
    return { paid, refunded, net: paid - refunded }
  }, [mine])

  const columns: Column<Transaction>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (t) => <span className="font-semibold">{t.reference}</span>,
    },
    {
      key: 'booking',
      header: 'Booking',
      hideBelow: 'md',
      cell: (t) => bookings.find((b) => b.id === t.bookingId)?.reference ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (t) => (
        <Badge tone={t.type === 'refund' ? 'warning' : 'brand'}>{titleCase(t.type)}</Badge>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      hideBelow: 'sm',
      cell: (t) => titleCase(t.channel.replace('-', ' ')),
    },
    { key: 'date', header: 'Date', hideBelow: 'sm', cell: (t) => formatDate(t.createdAt) },
    { key: 'amount', header: 'Amount', align: 'right', cell: (t) => money(t.amount) },
    {
      key: 'receipt',
      header: '',
      align: 'right',
      cell: () => (
        <Button variant="ghost" size="sm" onClick={() => toast('Receipt downloaded.')}>
          <Download className="size-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Payments" subtitle="Every charge and refund on your account." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total paid" value={money(totals.paid)} icon={Receipt} />
        <StatTile label="Refunded" value={money(totals.refunded)} />
        <StatTile label="Net spend" value={money(totals.net)} />
      </div>

      <Table
        columns={columns}
        rows={mine}
        rowKey={(t) => t.id}
        empty={
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            message="Payments and refunds will appear here once you complete your first booking."
          />
        }
      />
    </>
  )
}
