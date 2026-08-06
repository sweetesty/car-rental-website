import { useMemo, useState } from 'react'
import { CalendarRange, Info } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { AvailabilityCalendar } from '@/components/cars/AvailabilityCalendar'
import { Card, EmptyState } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { cx, formatDate, money } from '@/lib/format'

export default function OwnerCalendar() {
  const { user } = useAuth()
  const { cars, bookings, setCarAvailability } = useData()
  const toast = useToast()

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === user?.id), [cars, user?.id])
  const [selectedId, setSelectedId] = useState(myCars[0]?.id ?? '')

  const car = myCars.find((c) => c.id === selectedId) ?? myCars[0]

  const carBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.carId === car?.id && !['cancelled', 'rejected'].includes(b.status))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [bookings, car?.id],
  )

  // Dates held by a live booking can't be freed by hand — only blackouts toggle.
  const bookedDates = useMemo(() => {
    const set = new Set<string>()
    for (const b of carBookings) {
      const end = new Date(b.endDate)
      for (const d = new Date(b.startDate); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(d.toISOString().slice(0, 10))
      }
    }
    return set
  }, [carBookings])

  if (myCars.length === 0 || !car) {
    return (
      <>
        <PageHeader title="Availability" />
        <EmptyState
          icon={CalendarRange}
          title="No cars to manage"
          message="Once you list a car you can block out dates it isn't available."
          action={<LinkButton to="/owner/cars/new">List a car</LinkButton>}
        />
      </>
    )
  }

  const toggleDate = async (iso: string) => {
    if (bookedDates.has(iso)) {
      toast('That date is held by a confirmed booking and cannot be freed here.', 'error')
      return
    }
    const isBlocked = car.unavailableDates.includes(iso)
    const next = isBlocked
      ? car.unavailableDates.filter((d) => d !== iso)
      : [...car.unavailableDates, iso]

    try {
      await setCarAvailability(car.id, next)
      toast(
        isBlocked ? `${formatDate(iso)} is available again.` : `${formatDate(iso)} blocked off.`,
      )
    } catch (err) {
      toast(apiError(err), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Block out the days your car isn't available for hire."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {myCars.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={cx(
              'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
              c.id === car.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'surface-raised hover:border-brand-300',
            )}
          >
            <img src={c.images[0]} alt="" className="size-8 rounded object-cover" />
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="p-6">
          <h2 className="mb-4 font-bold tracking-tight">{car.name}</h2>
          <AvailabilityCalendar
            unavailableDates={car.unavailableDates}
            onToggleDate={toggleDate}
          />
          <p className="text-dim mt-5 flex items-start gap-2 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Click any future date to block or unblock it. Dates held by confirmed bookings are
            locked.
          </p>
        </Card>

        <section>
          <h2 className="mb-4 font-bold tracking-tight">Scheduled trips</h2>
          {carBookings.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Nothing scheduled"
              message="This car has no confirmed bookings on the calendar right now."
            />
          ) : (
            <ul className="space-y-3">
              {carBookings.map((booking) => (
                <li key={booking.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-bold">{booking.renter.fullName}</p>
                      <p className="text-dim mt-0.5 text-xs">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)} ·{' '}
                        {booking.days} days
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums">{money(booking.subtotal)}</p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
