import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, CarFront, Plus, Star, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Card, EmptyState, StatTile } from '@/components/ui/Misc'
import { BookingBadge, ListingBadge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { useAuth, useData } from '@/lib/hooks'
import { formatDate, money, moneyCompact, number } from '@/lib/format'

export default function OwnerOverview() {
  const { user } = useAuth()
  const { cars, bookings } = useData()

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === user?.id), [cars, user?.id])
  const myBookings = useMemo(
    () => bookings.filter((b) => b.ownerId === user?.id),
    [bookings, user?.id],
  )

  const stats = useMemo(() => {
    const earned = myBookings
      .filter((b) => b.status === 'completed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.subtotal, 0)
    const upcoming = myBookings.filter((b) => ['confirmed', 'active'].includes(b.status))
    const pending = myBookings.filter((b) => b.status === 'pending')
    const rated = myCars.filter((c) => c.reviewCount > 0)
    const avgRating = rated.length ? rated.reduce((sum, c) => sum + c.rating, 0) / rated.length : 0
    return {
      earned,
      upcoming,
      pending,
      avgRating,
      live: myCars.filter((c) => c.status === 'approved'),
    }
  }, [myBookings, myCars])

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        subtitle="Here's how your fleet is doing."
        action={
          <LinkButton to="/owner/cars/new">
            <Plus className="size-4" />
            List a car
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total earnings"
          value={moneyCompact(stats.earned)}
          delta="From completed trips"
          icon={Wallet}
        />
        <StatTile
          label="Live listings"
          value={`${stats.live.length} of ${myCars.length}`}
          delta={`${myCars.length - stats.live.length} awaiting approval or paused`}
          icon={CarFront}
        />
        <StatTile
          label="Upcoming trips"
          value={number(stats.upcoming.length)}
          delta={`${stats.pending.length} request${stats.pending.length === 1 ? '' : 's'} to review`}
          icon={CalendarRange}
        />
        <StatTile
          label="Average rating"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          delta={`${number(myCars.reduce((s, c) => s + c.reviewCount, 0))} reviews`}
          icon={Star}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold tracking-tight">Booking requests</h2>
            <Link
              to="/owner/bookings"
              className="text-brand-700 dark:text-brand-400 text-sm font-semibold"
            >
              View all
            </Link>
          </div>

          {myBookings.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No bookings yet"
              message="Once your listings are approved, requests will land here."
            />
          ) : (
            <ul className="space-y-3">
              {myBookings.slice(0, 4).map((booking) => (
                <li key={booking.id}>
                  <Card className="flex items-center gap-4 p-4">
                    <img
                      src={booking.car?.images[0]}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{booking.car?.name}</p>
                      <p className="text-dim mt-0.5 text-xs">
                        {booking.renter.fullName} · {formatDate(booking.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{money(booking.total)}</p>
                      <div className="mt-1">
                        <BookingBadge status={booking.status} />
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold tracking-tight">Your cars</h2>
            <Link
              to="/owner/cars"
              className="text-brand-700 dark:text-brand-400 text-sm font-semibold"
            >
              Manage
            </Link>
          </div>

          {myCars.length === 0 ? (
            <EmptyState
              icon={CarFront}
              title="No cars listed"
              message="Add your first car and start taking bookings within 48 hours."
              action={<LinkButton to="/owner/cars/new">List a car</LinkButton>}
            />
          ) : (
            <ul className="space-y-3">
              {myCars.slice(0, 4).map((car) => (
                <li key={car.id}>
                  <Card className="flex items-center gap-4 p-4">
                    <img
                      src={car.images[0]}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/cars/${car.id}`}
                        className="hover:text-brand-600 truncate text-sm font-bold"
                      >
                        {car.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-3">
                        <Rating value={car.rating} count={car.reviewCount} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{money(car.pricePerDay)}</p>
                      <div className="mt-1">
                        <ListingBadge status={car.status} />
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-start gap-4">
          <span className="bg-accent-100 text-accent-800 dark:bg-accent-800/30 dark:text-accent-300 grid size-11 shrink-0 place-items-center rounded-xl">
            <TrendingUp className="size-5.5" />
          </span>
          <div>
            <h2 className="font-bold tracking-tight">Earn more from your fleet</h2>
            <p className="text-dim mt-1.5 text-sm leading-relaxed text-pretty">
              Listings with six or more photos, a filled-in description and instant confirmation get
              roughly 3× more booking requests. Cars priced within 10% of the local average book
              fastest.
            </p>
            <LinkButton to="/owner/cars" variant="secondary" size="sm" className="mt-4">
              Review my listings
            </LinkButton>
          </div>
        </div>
      </Card>
    </>
  )
}
