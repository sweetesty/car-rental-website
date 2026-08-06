import { useMemo, useState } from 'react'
import { CalendarRange, Check, Mail, Phone, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, ListSkeleton, Tabs } from '@/components/ui/Misc'
import { BookingBadge, PaymentBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, money } from '@/lib/format'
import type { Booking } from '@/lib/types'

type Tab = 'requests' | 'upcoming' | 'history'

export default function OwnerBookings() {
  const { user } = useAuth()
  const { bookings, setBookingStatus, loading } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('requests')
  const [viewing, setViewing] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)

  const mine = useMemo(() => bookings.filter((b) => b.ownerId === user?.id), [bookings, user?.id])

  const groups = useMemo(
    () => ({
      requests: mine.filter((b) => b.status === 'pending'),
      upcoming: mine.filter((b) => ['confirmed', 'active'].includes(b.status)),
      history: mine.filter((b) => ['completed', 'cancelled', 'rejected'].includes(b.status)),
    }),
    [mine],
  )

  /** Every status change goes through the API; the store updates from its reply. */
  const changeStatus = async (
    booking: Booking,
    status: Booking['status'],
    message: string,
    paymentStatus?: string,
  ) => {
    setBusy(true)
    try {
      await setBookingStatus(booking.id, status, paymentStatus)
      toast(message, status === 'rejected' ? 'info' : 'success')
      setViewing(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const accept = (booking: Booking) =>
    changeStatus(
      booking,
      'confirmed',
      `Booking ${booking.reference} accepted. The renter has been notified.`,
    )

  const reject = (booking: Booking) =>
    changeStatus(
      booking,
      'rejected',
      `Booking ${booking.reference} rejected and the renter refunded.`,
      booking.paymentStatus === 'paid' ? 'refunded' : undefined,
    )

  const list = groups[tab]

  return (
    <>
      <PageHeader
        title="Booking requests"
        subtitle="Accept or decline requests, and track trips in progress."
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'requests', label: 'Needs action', count: groups.requests.length },
          { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { id: 'history', label: 'History', count: groups.history.length },
        ]}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <ListSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title={tab === 'requests' ? 'Nothing needs your attention' : 'Nothing here yet'}
            message={
              tab === 'requests'
                ? 'New booking requests appear here. You have 12 hours to respond before they expire.'
                : 'Bookings will show up as they progress.'
            }
          />
        ) : (
          list.map((booking) => (
            <Card key={booking.id} className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                <img
                  src={booking.car?.images[0]}
                  alt=""
                  className="h-24 w-full shrink-0 rounded-lg object-cover sm:w-36"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold tracking-tight">{booking.car?.name}</p>
                      <p className="text-dim mt-1 text-sm">
                        {booking.reference} · requested {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <BookingBadge status={booking.status} />
                      <PaymentBadge status={booking.paymentStatus} />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Detail label="Renter" value={booking.renter.fullName} />
                    <Detail label="Pickup" value={formatDate(booking.startDate)} />
                    <Detail label="Return" value={formatDate(booking.endDate)} />
                    <Detail label="You earn" value={money(booking.subtotal)} />
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setViewing(booking)}>
                      View details
                    </Button>

                    {booking.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => accept(booking)}>
                          <Check className="size-3.5" />
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => reject(booking)}
                        >
                          <X className="size-3.5" />
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => changeStatus(booking, 'active', 'Trip marked as started.')}
                      >
                        Mark handover complete
                      </Button>
                    )}

                    {booking.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          changeStatus(
                            booking,
                            'completed',
                            'Trip completed. Your payout is queued for tomorrow.',
                          )
                        }
                      >
                        Mark trip complete
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
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Booking ${viewing?.reference ?? ''}`}
        description={viewing?.car?.name}
        footer={
          viewing?.status === 'pending' ? (
            <>
              <Button variant="danger" onClick={() => reject(viewing)} loading={busy}>
                Decline
              </Button>
              <Button onClick={() => accept(viewing)} loading={busy}>
                Accept booking
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
          )
        }
      >
        {viewing && (
          <div className="space-y-5 text-sm">
            <section>
              <h3 className="text-dim mb-2 text-xs font-bold tracking-wide uppercase">
                Trip
              </h3>
              <dl className="space-y-2">
                <Detail label="Pickup" value={`${formatDate(viewing.startDate)} — ${viewing.pickupLocation}`} />
                <Detail label="Return" value={formatDate(viewing.endDate)} />
                <Detail label="Duration" value={`${viewing.days} days`} />
              </dl>
            </section>

            <section className="border-t pt-4">
              <h3 className="text-dim mb-2 text-xs font-bold tracking-wide uppercase">
                Driver
              </h3>
              <dl className="space-y-2">
                <Detail label="Name" value={viewing.renter.fullName} />
                <Detail label="Licence" value={viewing.renter.licenseNumber} />
                <Detail label="Licence expiry" value={viewing.renter.licenseExpiry} />
                <Detail
                  label="Emergency contact"
                  value={`${viewing.renter.emergencyContactName} · ${viewing.renter.emergencyContactPhone}`}
                />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`tel:${viewing.renter.phone}`}
                  className="surface-sunken flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                >
                  <Phone className="size-3.5" />
                  {viewing.renter.phone}
                </a>
                <a
                  href={`mailto:${viewing.renter.email}`}
                  className="surface-sunken flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                >
                  <Mail className="size-3.5" />
                  {viewing.renter.email}
                </a>
              </div>
            </section>

            <section className="border-t pt-4">
              <h3 className="text-dim mb-2 text-xs font-bold tracking-wide uppercase">
                Money
              </h3>
              <dl className="space-y-2">
                <Detail label="Rental subtotal" value={money(viewing.subtotal)} />
                <Detail label="AUTOGO service fee" value={`−${money(viewing.serviceFee)}`} />
                <Detail label="Insurance (collected)" value={money(viewing.insuranceFee)} />
                <Detail label="Renter paid" value={money(viewing.total)} />
                <Detail label="Your payout" value={money(viewing.subtotal)} />
              </dl>
            </section>
          </div>
        )}
      </Modal>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-dim shrink-0 text-xs sm:text-sm">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}
