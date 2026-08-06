import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, CarFront, TrendingUp, Users, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Card, StatTile } from '@/components/ui/Misc'
import { BarChart, type Bar } from '@/components/ui/BarChart'
import { Rating } from '@/components/ui/Rating'
import { ListingBadge } from '@/components/ui/Badge'
import { useData } from '@/lib/hooks'
import { money, moneyCompact, number } from '@/lib/format'

const MONTH_LABEL = new Intl.DateTimeFormat('en-NG', { month: 'short' })

export default function AdminAnalytics() {
  const { cars, bookings, users, transactions } = useData()

  const stats = useMemo(() => {
    const revenue = transactions
      .filter((t) => t.type === 'payment' && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0)
    const refunded = transactions
      .filter((t) => t.type === 'refund' && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0)
    const commission = bookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.serviceFee, 0)
    return {
      revenue,
      refunded,
      commission,
      owners: users.filter((u) => u.role === 'owner').length,
      customers: users.filter((u) => u.role === 'customer').length,
      pendingCars: cars.filter((c) => c.status === 'pending').length,
    }
  }, [transactions, bookings, users, cars])

  const monthlyRevenue = useMemo<Bar[]>(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const value = transactions
        .filter((t) => t.type === 'payment' && t.createdAt.startsWith(key))
        .reduce((sum, t) => sum + t.amount, 0)
      return { label: MONTH_LABEL.format(d), value }
    })
  }, [transactions])

  const mostRented = useMemo(() => {
    const counts = new Map<string, number>()
    for (const b of bookings) counts.set(b.carId, (counts.get(b.carId) ?? 0) + 1)
    return [...cars]
      .map((car) => ({ car, bookings: counts.get(car.id) ?? 0 }))
      .sort((a, b) => b.bookings - a.bookings || b.car.tripCount - a.car.tripCount)
      .slice(0, 5)
  }, [cars, bookings])

  return (
    <>
      <PageHeader
        title="Platform analytics"
        subtitle="How AUTOGO is performing across users, listings and money."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total users"
          value={number(users.length)}
          delta={`${stats.owners} owners · ${stats.customers} renters`}
          icon={Users}
        />
        <StatTile
          label="Total cars"
          value={number(cars.length)}
          delta={`${stats.pendingCars} awaiting approval`}
          icon={CarFront}
        />
        <StatTile
          label="Total bookings"
          value={number(bookings.length)}
          delta={`${bookings.filter((b) => b.status === 'completed').length} completed`}
          icon={CalendarRange}
        />
        <StatTile
          label="Gross revenue"
          value={moneyCompact(stats.revenue)}
          delta={`${moneyCompact(stats.commission)} in service fees`}
          icon={Wallet}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="font-bold tracking-tight">Revenue, last 6 months</h2>
          <p className="text-dim mt-1 mb-6 text-sm">Successful customer payments, gross.</p>
          <BarChart
            data={monthlyRevenue}
            format={moneyCompact}
            seriesLabel="Monthly gross revenue from successful payments"
          />
        </Card>

        <Card className="p-6">
          <h2 className="font-bold tracking-tight">Money at a glance</h2>
          <dl className="mt-5 space-y-4">
            <Line label="Gross payments" value={money(stats.revenue)} />
            <Line label="Refunds issued" value={`−${money(stats.refunded)}`} />
            <Line label="AUTOGO commission" value={money(stats.commission)} />
            <Line
              label="Owner payouts"
              value={money(Math.max(0, stats.revenue - stats.refunded - stats.commission))}
            />
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <dt className="font-bold">Net platform revenue</dt>
              <dd className="text-lg font-black tabular-nums">
                {money(stats.commission)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold tracking-tight">Most rented cars</h2>
            <p className="text-dim mt-1 text-sm">Ranked by bookings on the platform.</p>
          </div>
          <Link to="/admin/cars" className="text-brand-700 dark:text-brand-300 text-sm font-semibold">
            Manage listings
          </Link>
        </div>

        <ol className="space-y-3">
          {mostRented.map(({ car, bookings: count }, i) => (
            <li key={car.id}>
              <div className="surface-sunken flex items-center gap-4 rounded-xl border p-3.5">
                <span className="text-dim w-5 shrink-0 text-center text-sm font-black tabular-nums">
                  {i + 1}
                </span>
                <img src={car.images[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/cars/${car.id}`} className="hover:text-brand-600 truncate text-sm font-bold">
                    {car.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Rating value={car.rating} count={car.reviewCount} />
                    <ListingBadge status={car.status} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{number(count)}</p>
                  <p className="text-dim text-xs">bookings</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex items-start gap-4">
          <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-11 shrink-0 place-items-center rounded-xl">
            <TrendingUp className="size-5.5" />
          </span>
          <div>
            <h2 className="font-bold tracking-tight">Approval queue</h2>
            <p className="text-dim mt-1.5 text-sm leading-relaxed">
              {stats.pendingCars === 0
                ? 'Nothing is waiting for review. The queue is clear.'
                : `${stats.pendingCars} listing${stats.pendingCars === 1 ? '' : 's'} waiting for review. Owners expect a decision within 24 hours.`}
            </p>
            <Link
              to="/admin/cars"
              className="text-brand-700 dark:text-brand-300 mt-3 inline-block text-sm font-bold"
            >
              Go to approvals →
            </Link>
          </div>
        </div>
      </Card>
    </>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-dim text-sm">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
