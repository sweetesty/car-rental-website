import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX, MapPin, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, EmptyState, ListSkeleton, Tabs } from '@/components/ui/Misc'
import { BookingBadge, PaymentBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { RatingInput } from '@/components/ui/Rating'
import { Textarea } from '@/components/ui/Field'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, money, todayISO } from '@/lib/format'
import type { Booking } from '@/lib/types'

type Tab = 'upcoming' | 'past' | 'cancelled'

export default function MyBookings() {
  const { user } = useAuth()
  const { bookings, setBookingStatus, addReview, getCar, loading } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('upcoming')
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [reviewing, setReviewing] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const mine = useMemo(
    () => bookings.filter((b) => b.customerId === user?.id),
    [bookings, user?.id],
  )

  const groups = useMemo(
    () => ({
      upcoming: mine.filter((b) => ['pending', 'confirmed', 'active'].includes(b.status)),
      past: mine.filter((b) => b.status === 'completed'),
      cancelled: mine.filter((b) => ['cancelled', 'rejected'].includes(b.status)),
    }),
    [mine],
  )

  const list = groups[tab]

  /** Free cancellation only inside the car's policy window. */
  const refundable = (booking: Booking) => {
    const car = getCar(booking.carId)
    const hours = car?.policy.cancellationWindowHours ?? 48
    const msToPickup = new Date(booking.startDate).getTime() - Date.now()
    return msToPickup > hours * 3_600_000
  }

  const confirmCancel = async () => {
    if (!cancelling) return
    const full = refundable(cancelling)
    setBusy(true)
    try {
      await setBookingStatus(
        cancelling.id,
        'cancelled',
        cancelling.paymentStatus === 'paid' ? 'refunded' : undefined,
      )
      toast(
        full
          ? 'Booking cancelled. Your full refund is on the way.'
          : 'Booking cancelled. The first rental day is non-refundable.',
        full ? 'success' : 'info',
      )
      setCancelling(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitReview = async () => {
    if (!reviewing || !user) return
    if (comment.trim().length < 10) {
      toast('Add a few more words to your review.', 'error')
      return
    }
    setBusy(true)
    try {
      await addReview({ carId: reviewing.carId, rating, comment: comment.trim() })
      toast('Thanks — your review is live.')
      setReviewing(null)
      setComment('')
      setRating(5)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My bookings"
        subtitle="Every trip you've booked, past and upcoming."
        action={<LinkButton to="/cars">Book another car</LinkButton>}
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { id: 'past', label: 'Completed', count: groups.past.length },
          { id: 'cancelled', label: 'Cancelled', count: groups.cancelled.length },
        ]}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <ListSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={`No ${tab} bookings`}
            message={
              tab === 'upcoming'
                ? "When you book a car it'll show up here with pickup details and your receipt."
                : 'Nothing in this list yet.'
            }
            action={tab === 'upcoming' ? <LinkButton to="/cars">Find a car</LinkButton> : undefined}
          />
        ) : (
          list.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="flex flex-col gap-5 p-5 sm:flex-row">
                <img
                  src={booking.car?.images[0]}
                  alt=""
                  className="h-28 w-full shrink-0 rounded-lg object-cover sm:w-44"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/cars/${booking.carId}`}
                        className="hover:text-brand-600 font-bold tracking-tight"
                      >
                        {booking.car?.name}
                      </Link>
                      <p className="text-dim mt-1 flex items-center gap-1.5 text-sm">
                        <MapPin className="size-3.5 shrink-0" />
                        {booking.pickupLocation}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <BookingBadge status={booking.status} />
                      <PaymentBadge status={booking.paymentStatus} />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Detail label="Reference" value={booking.reference} />
                    <Detail label="Pickup" value={formatDate(booking.startDate)} />
                    <Detail label="Return" value={formatDate(booking.endDate)} />
                    <Detail label="Total" value={money(booking.total)} />
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <LinkButton to={`/cars/${booking.carId}`} variant="secondary" size="sm">
                      View car
                    </LinkButton>

                    {['pending', 'confirmed'].includes(booking.status) &&
                      booking.startDate > todayISO() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => setCancelling(booking)}
                        >
                          Cancel booking
                        </Button>
                      )}

                    {booking.status === 'completed' && (
                      <Button size="sm" onClick={() => setReviewing(booking)}>
                        <Star className="size-4" />
                        Leave a review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel this booking?"
        description={
          cancelling && refundable(cancelling)
            ? "You're inside the free cancellation window — you'll be refunded in full."
            : 'This is outside the free cancellation window, so the first rental day is non-refundable.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={confirmCancel} loading={busy}>
              Cancel booking
            </Button>
          </>
        }
      >
        {cancelling && (
          <dl className="space-y-2 text-sm">
            <Detail label="Car" value={cancelling.car?.name ?? ''} />
            <Detail label="Dates" value={`${formatDate(cancelling.startDate)} → ${formatDate(cancelling.endDate)}`} />
            <Detail label="Amount paid" value={money(cancelling.total)} />
            <Detail
              label="Estimated refund"
              value={money(refundable(cancelling) ? cancelling.total : cancelling.total - cancelling.subtotal / cancelling.days)}
            />
          </dl>
        )}
      </Modal>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Rate your trip"
        description={reviewing?.car?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewing(null)}>
              Not now
            </Button>
            <Button onClick={submitReview} loading={busy}>
              Publish review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Your rating</p>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <Textarea
            label="Your review"
            placeholder="How was the car, the handover and the owner?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            hint="Reviews are public and can't be edited once published."
          />
        </div>
      </Modal>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-dim text-xs">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}
