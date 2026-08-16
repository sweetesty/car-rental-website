import { useMemo } from 'react'
import { Banknote, Clock, Download, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Card, EmptyState, StatTile } from '@/components/ui/Misc'
import { BarChart, type Bar } from '@/components/ui/BarChart'
import { Table, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { formatDate, money, moneyCompact, titleCase } from '@/lib/format'
import { downloadCsv, stampedFilename, toCsv } from '@/lib/csv'
import type { Transaction } from '@/lib/types'

const MONTH_LABEL = new Intl.DateTimeFormat('en-NG', { month: 'short' })

export default function OwnerEarnings() {
  const { user } = useAuth()
  const { bookings, transactions } = useData()
  const toast = useToast()

  const myBookings = useMemo(
    () => bookings.filter((b) => b.ownerId === user?.id),
    [bookings, user?.id],
  )

  const totals = useMemo(() => {
    const completed = myBookings.filter((b) => b.status === 'completed')
    const paid = completed.reduce((sum, b) => sum + b.subtotal, 0)
    const pendingPayout = myBookings
      .filter((b) => ['confirmed', 'active'].includes(b.status))
      .reduce((sum, b) => sum + b.subtotal, 0)
    const fees = myBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.serviceFee, 0)
    const avg = completed.length ? paid / completed.length : 0
    return { paid, pendingPayout, fees, avg, trips: completed.length }
  }, [myBookings])

  /** Last six months of completed-trip earnings, oldest first. */
  const monthly = useMemo<Bar[]>(() => {
    const now = new Date()
    const buckets: Bar[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const value = myBookings
        .filter((b) => b.status === 'completed' && b.endDate.startsWith(key))
        .reduce((sum, b) => sum + b.subtotal, 0)
      buckets.push({ label: MONTH_LABEL.format(d), value })
    }
    return buckets
  }, [myBookings])

  const myTransactions = useMemo(() => {
    const ids = new Set(myBookings.map((b) => b.id))
    return transactions.filter((t) => ids.has(t.bookingId))
  }, [transactions, myBookings])

  /**
   * A statement an owner can hand to an accountant: every transaction on their
   * own bookings, with the commission AUTOGO took on each so the gross and the
   * net are both visible rather than just the figure that landed.
   */
  const exportStatement = () => {
    if (!myTransactions.length) {
      toast('No transactions to export yet.', 'info')
      return
    }

    const rows = myTransactions.map((t) => {
      const booking = myBookings.find((b) => b.id === t.bookingId)
      return [
        formatDate(t.createdAt),
        t.reference,
        titleCase(t.type),
        t.status,
        t.amount,
        booking?.serviceFee ?? '',
        titleCase(t.channel.replace('-', ' ')),
        booking?.reference ?? '',
        booking?.car?.name ?? '',
      ]
    })

    downloadCsv(
      stampedFilename('autogo-statement'),
      toCsv(
        [
          'Date',
          'Reference',
          'Type',
          'Status',
          'Amount (NGN)',
          'AUTOGO commission (NGN)',
          'Channel',
          'Booking',
          'Car',
        ],
        rows,
      ),
    )

    toast(`${myTransactions.length} transactions exported.`)
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (t) => <span className="font-semibold">{t.reference}</span>,
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
      hideBelow: 'sm',
      cell: (t) => titleCase(t.channel.replace('-', ' ')),
    },
    { key: 'date', header: 'Date', hideBelow: 'sm', cell: (t) => formatDate(t.createdAt) },
    { key: 'amount', header: 'Amount', align: 'right', cell: (t) => money(t.amount) },
  ]

  return (
    <>
      <PageHeader
        title="Earnings & payouts"
        subtitle="What you've earned, what's on the way, and where it went."
        action={
          <Button
            variant="secondary"
            onClick={exportStatement}
            disabled={!myTransactions.length}
          >
            <Download className="size-4" />
            Export statement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Paid out"
          value={moneyCompact(totals.paid)}
          delta={`${totals.trips} completed trips`}
          icon={Wallet}
        />
        <StatTile
          label="Pending payout"
          value={moneyCompact(totals.pendingPayout)}
          delta="Released after each trip ends"
          icon={Clock}
        />
        <StatTile
          label="Average per trip"
          value={moneyCompact(totals.avg)}
          delta="After service fee"
          icon={TrendingUp}
        />
        <StatTile
          label="Service fees paid"
          value={moneyCompact(totals.fees)}
          delta="Flat 10% of each rental"
          icon={Banknote}
        />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-bold tracking-tight">Earnings, last 6 months</h2>
        <p className="text-dim mt-1 mb-6 text-sm">Payouts from completed trips, net of fees.</p>
        <BarChart
          data={monthly}
          format={moneyCompact}
          seriesLabel="Monthly earnings from completed trips"
        />
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 font-bold tracking-tight">Transaction history</h2>
        <Table
          columns={columns}
          rows={myTransactions}
          rowKey={(t) => t.id}
          empty={
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              message="Payouts appear here the day after each completed trip."
            />
          }
        />
      </section>
    </>
  )
}
