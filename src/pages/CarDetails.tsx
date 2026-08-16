import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleGauge,
  Fuel,
  Gauge,
  GitCompare,
  Heart,
  MapPin,
  Navigation,
  Palette,
  Settings2,
  ShieldCheck,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { CarGallery } from '@/components/cars/CarGallery'
import { AvailabilityCalendar } from '@/components/cars/AvailabilityCalendar'
import { Button, LinkButton } from '@/components/ui/Button'
import { Avatar, Card, EmptyState, SectionHeading, Spinner } from '@/components/ui/Misc'
import { Badge, VerificationBadge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { useAuth, useData, useFavorites, useToast } from '@/lib/hooks'
import { addDays, cx, formatDate, money, number, relativeTime, titleCase, todayISO } from '@/lib/format'
import { isAvailable, quote } from '@/lib/pricing'
import { FEATURE_LABELS, FUEL_POLICY_LABELS } from '@/lib/catalog'
import type { CarFeatureSet } from '@/lib/types'

export default function CarDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getCar, reviewsFor, loadCar, loadReviews, loading, error, refresh } = useData()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite, isComparing, toggleCompare } = useFavorites()
  const toast = useToast()

  const car = getCar(id)
  const [startDate, setStartDate] = useState(addDays(todayISO(), 1))
  const [endDate, setEndDate] = useState(addDays(todayISO(), 4))

  // Deep links arrive before the listing cache is populated.
  useEffect(() => {
    if (id && !car && !loading) loadCar(id)
  }, [id, car, loading, loadCar])

  useEffect(() => {
    if (id) loadReviews(id)
  }, [id, loadReviews])

  const reviews = useMemo(() => (car ? reviewsFor(car.id) : []), [car, reviewsFor])
  const priced = useMemo(
    () => (car ? quote(car, startDate, endDate) : null),
    [car, startDate, endDate],
  )
  const available = car ? isAvailable(car, startDate, endDate) : false

  if (!car) {
    if (loading) {
      return (
        <div className="grid min-h-[60svh] place-items-center">
          <Spinner className="size-8" />
        </div>
      )
    }
    /*
     * A missing car and an unreachable API look identical from here, and
     * saying "removed by its owner" when we simply couldn't fetch it is a
     * confident lie — the listing is very likely fine. When the fleet failed
     * to load, say that instead and offer the retry, matching the banner
     * already showing above.
     */
    if (error) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState
            icon={WifiOff}
            title="Can't load this car right now"
            message="We're having trouble reaching AUTOGO. Check your connection — the listing is probably still there."
            action={
              <Button onClick={() => void refresh()} loading={loading}>
                Try again
              </Button>
            }
          />
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={AlertTriangle}
          title="Car not found"
          message="This listing may have been removed by its owner or taken down by our team."
          action={<LinkButton to="/cars">Browse other cars</LinkButton>}
        />
      </div>
    )
  }

  const onBook = () => {
    if (!user) {
      toast('Sign in to complete a booking.', 'info')
      navigate('/login', { state: { from: `/cars/${car.id}` } })
      return
    }
    if (!available) {
      toast('Those dates are already taken. Pick another window.', 'error')
      return
    }
    if (priced && priced.days < car.policy.minRentalDays) {
      toast(`This car has a ${car.policy.minRentalDays}-day minimum rental.`, 'error')
      return
    }
    navigate(`/book/${car.id}`, { state: { startDate, endDate } })
  }

  const enabledFeatures = (Object.keys(FEATURE_LABELS) as (keyof CarFeatureSet)[]).filter(
    (key) => car.features[key],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-dim mb-5 text-sm">
        <Link to="/cars" className="hover:text-brand-600">
          Cars
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/cars?brand=${car.brand}`} className="hover:text-brand-600">
          {car.brand}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-950 dark:text-ink-100">{car.name}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{car.name}</h1>
          <div className="text-dim mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Rating value={car.rating} count={car.reviewCount} size="md" />
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {car.pickupLocation}
            </span>
            <span>{number(car.tripCount)} completed trips</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleFavorite(car.id)}
            aria-pressed={isFavorite(car.id)}
          >
            <Heart className={cx('size-4', isFavorite(car.id) && 'fill-current text-red-500')} />
            {isFavorite(car.id) ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleCompare(car.id)}
            aria-pressed={isComparing(car.id)}
          >
            <GitCompare className="size-4" />
            {isComparing(car.id) ? 'In compare' : 'Compare'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-10">
          <CarGallery images={car.images} alt={car.name} />

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">At a glance</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Fact icon={Users} label="Seats" value={`${car.seats}`} />
              <Fact icon={Settings2} label="Transmission" value={titleCase(car.transmission)} />
              <Fact icon={Fuel} label="Fuel" value={titleCase(car.fuelType)} />
              <Fact icon={CircleGauge} label="Body" value={titleCase(car.bodyType)} />
              <Fact icon={Gauge} label="Mileage" value={`${number(car.mileage)} km`} />
              <Fact icon={Palette} label="Colour" value={car.color} />
              <Fact icon={CalendarDays} label="Year" value={`${car.year}`} />
              <Fact
                icon={Navigation}
                label="GPS tracker"
                value={car.gpsTrackerId ? 'Fitted' : 'Not fitted'}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold tracking-tight">About this car</h2>
            <p className="text-dim leading-relaxed text-pretty">{car.description}</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Specifications</h2>
            <Card className="divide-y">
              <SpecRow label="Engine" value={car.specs.engine} />
              <SpecRow label="Horsepower" value={`${car.specs.horsepower} hp`} />
              <SpecRow label="Drive type" value={car.specs.driveType.toUpperCase()} />
              <SpecRow label="Doors" value={`${car.specs.doors}`} />
              <SpecRow label="Registration" value={car.registrationNumber} />
              {car.vin && <SpecRow label="VIN" value={car.vin} />}
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Features</h2>
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(FEATURE_LABELS) as (keyof CarFeatureSet)[]).map((key) => {
                const on = car.features[key]
                return (
                  <li
                    key={key}
                    className={cx('flex items-center gap-2 text-sm', !on && 'text-dim')}
                  >
                    {on ? (
                      <Check className="text-brand-600 dark:text-brand-400 size-4 shrink-0" />
                    ) : (
                      <X className="size-4 shrink-0 opacity-50" />
                    )}
                    <span className={cx(!on && 'line-through decoration-1')}>
                      {FEATURE_LABELS[key]}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="text-dim mt-4 text-sm">
              {enabledFeatures.length} of {Object.keys(FEATURE_LABELS).length} features included.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Rental policies</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Policy
                title="Mileage limit"
                body={
                  car.policy.mileageLimitPerDay
                    ? `${number(car.policy.mileageLimitPerDay)} km per day included. Extra kilometres are billed at ₦120/km.`
                    : 'Unlimited mileage on this car.'
                }
              />
              <Policy title="Fuel policy" body={FUEL_POLICY_LABELS[car.policy.fuelPolicy]} />
              <Policy
                title="Cancellation"
                body="Bookings are non-refundable. Once confirmed, the car is held off the market for your dates, so cancelling does not return what you paid."
              />
              <Policy
                title="Security deposit"
                body={`${money(car.policy.securityDeposit)}, refunded within 3 working days of a clean return.`}
              />
              <Policy
                title="Driver requirements"
                body={`Minimum age ${car.policy.driverAgeMin}, with a valid licence held for at least 2 years.`}
              />
              <Policy
                title="Minimum rental"
                body={`${car.policy.minRentalDays} day${car.policy.minRentalDays > 1 ? 's' : ''}.`}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Insurance cover</h2>
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-11 shrink-0 place-items-center rounded-xl">
                  <ShieldCheck className="size-5.5" />
                </span>
                <div>
                  <p className="font-semibold">{car.insurance.provider}</p>
                  <p className="text-dim mt-1 text-sm leading-relaxed">{car.insurance.coverage}</p>
                  <p className="text-dim mt-2 text-xs">
                    Policy {car.insurance.policyNumber} · valid to{' '}
                    {formatDate(car.insurance.expiresAt)}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section id="reviews">
            <SectionHeading
              title={`Reviews (${car.reviewCount})`}
              subtitle={
                reviews.length
                  ? 'Only customers who completed a trip on this car can leave a review.'
                  : undefined
              }
            />
            {reviews.length === 0 ? (
              <p className="text-dim">No reviews yet — be the first to rent this car.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <Card className="p-5">
                      <div className="flex items-start gap-3.5">
                        <Avatar name={review.author.name} src={review.author.avatarUrl} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="font-semibold">{review.author.name}</p>
                            <Rating value={review.rating} />
                            <span className="text-dim text-xs">
                              {relativeTime(review.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 leading-relaxed text-pretty">{review.comment}</p>

                          {review.ownerReply && (
                            <div className="surface-sunken mt-4 rounded-lg border-l-2 border-brand-500 p-3.5">
                              <p className="text-xs font-bold tracking-wide uppercase">
                                Reply from {car.owner?.name}
                              </p>
                              <p className="text-dim mt-1.5 text-sm leading-relaxed">
                                {review.ownerReply.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Booking rail ── */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <Card className="p-5">
              <div className="flex items-end justify-between gap-2">
                <p>
                  <span className="text-2xl font-black tracking-tight">
                    {money(car.pricePerDay)}
                  </span>
                  <span className="text-dim"> / day</span>
                </p>
                <Rating value={car.rating} count={car.reviewCount} />
              </div>

              <dl className="text-dim mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>Weekly rate</dt>
                  <dd className="font-semibold tabular-nums">{money(car.pricePerWeek)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Monthly rate</dt>
                  <dd className="font-semibold tabular-nums">{money(car.pricePerMonth)}</dd>
                </div>
              </dl>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-dim text-xs font-semibold">PICK-UP</span>
                  <input
                    type="date"
                    value={startDate}
                    min={todayISO()}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (e.target.value >= endDate) setEndDate(addDays(e.target.value, 1))
                    }}
                    className="surface-sunken mt-1 h-10 w-full rounded-lg border px-2.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-dim text-xs font-semibold">RETURN</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="surface-sunken mt-1 h-10 w-full rounded-lg border px-2.5 text-sm"
                  />
                </label>
              </div>

              {!available && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Not available on those dates. Check the calendar below.
                </p>
              )}

              {priced && priced.days > 0 && available && (
                <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                  {priced.breakdown.map((line) => (
                    <div key={line.label} className="flex justify-between gap-3">
                      <dt className="text-dim">{line.label}</dt>
                      <dd className="tabular-nums">{money(line.amount)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Service fee</dt>
                    <dd className="tabular-nums">{money(priced.serviceFee)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Insurance</dt>
                    <dd className="tabular-nums">{money(priced.insuranceFee)}</dd>
                  </div>
                  {priced.savings > 0 && (
                    <div className="text-brand-700 dark:text-brand-300 flex justify-between gap-3 font-semibold">
                      <dt>Long-rental discount</dt>
                      <dd className="tabular-nums">−{money(priced.savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 border-t pt-2.5 text-base font-bold">
                    <dt>Total ({priced.days} days)</dt>
                    <dd className="tabular-nums">{money(priced.total)}</dd>
                  </div>
                </dl>
              )}

              <Button fullWidth size="lg" className="mt-5" onClick={onBook} disabled={!available}>
                Book now
              </Button>
              <p className="text-dim mt-3 text-center text-xs">
                You won't be charged until the owner confirms.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-bold tracking-wide uppercase">Availability</h3>
              <AvailabilityCalendar
                unavailableDates={car.unavailableDates}
                range={{ start: startDate, end: endDate }}
              />
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 text-sm font-bold tracking-wide uppercase">Hosted by</h3>
              <div className="flex items-center gap-3.5">
                <Avatar name={car.owner?.name ?? 'Owner'} src={car.owner?.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{car.owner?.name}</p>
                  <p className="text-dim text-sm">
                    Hosting since {formatDate(car.owner?.createdAt ?? car.createdAt)}
                  </p>
                  <div className="mt-1.5">
                    {car.owner && <VerificationBadge status={car.owner.verification} />}
                  </div>
                </div>
              </div>
              <div className="text-dim mt-4 space-y-2 border-t pt-4 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  Pickup at {car.pickupLocation}
                </p>
                {car.gpsTrackerId && (
                  <p className="flex items-center gap-2">
                    <Navigation className="size-4 shrink-0" />
                    Live GPS tracking enabled
                  </p>
                )}
              </div>

              <Badge tone="brand" className="mt-4">
                Typically replies within 1 hour
              </Badge>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="surface-sunken rounded-xl border p-3.5">
      <Icon className="text-brand-600 dark:text-brand-400 size-4.5" />
      <p className="text-dim mt-2 text-xs">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <span className="text-dim">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function Policy({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-dim mt-1.5 text-sm leading-relaxed text-pretty">{body}</p>
    </Card>
  )
}
