import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Check, Clock, Download, MapPin } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, EmptyState, Spinner } from '@/components/ui/Misc'
import { BookingBadge, PaymentBadge } from '@/components/ui/Badge'
import { WhatsAppButton } from '@/components/ui/WhatsApp'
import { messages, supportLink } from '@/lib/whatsapp'
import { downloadReceipt } from '@/lib/receipt'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { cx, formatDate, money } from '@/lib/format'

export default function BookingConfirmed() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { bookings, confirmPayment, startPayment, refresh } = useData()
  const toast = useToast()

  const booking = useMemo(() => bookings.find((b) => b.id === id), [bookings, id])

  // Paystack appends ?reference=… when it sends the customer back.
  const reference = params.get('reference') ?? params.get('trxref')

  const [checking, setChecking] = useState(Boolean(reference))
  const [failed, setFailed] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const settled = useRef(false)

  /** Sends them back to Paystack for the same booking, rather than rebooking. */
  const retry = async () => {
    setRetrying(true)
    try {
      const { authorization_url } = await startPayment(id)
      window.location.href = authorization_url
    } catch (err) {
      toast(apiError(err), 'error')
      setRetrying(false)
    }
  }

  /*
   * Ask the server whether that reference really succeeded.
   *
   * Nothing used to do this. The reference Paystack put in the URL was ignored,
   * and the page rendered a green tick and "Total paid" regardless — so a
   * declined card looked exactly like a successful one, and the booking stayed
   * unpaid with the customer believing otherwise.
   *
   * The check runs on the server, which asks Paystack directly, because a
   * reference in a URL is just a string a browser handed us.
   */
  useEffect(() => {
    if (!reference || settled.current) return
    settled.current = true
    ;(async () => {
      try {
        await confirmPayment(reference)
      } catch {
        // A genuine decline, an abandoned checkout, or a reference Paystack
        // does not recognise all land here. The webhook may still settle it
        // moments later, so this is reported as "not confirmed", not "failed
        // forever".
        setFailed(true)
      } finally {
        setChecking(false)
      }
    })()
  }, [reference, confirmPayment])

  if (checking) {
    return (
      <div className="mx-auto grid min-h-[60svh] max-w-md place-items-center px-4 text-center">
        <div>
          <Spinner className="mx-auto size-8" />
          <p className="mt-5 font-bold">Confirming your payment…</p>
          <p className="text-dim mt-1.5 text-sm">
            Checking with Paystack. Don't close this page.
          </p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={AlertTriangle}
          title="Booking not found"
          message="This confirmation link is no longer valid."
          action={<LinkButton to="/account">Go to my bookings</LinkButton>}
        />
      </div>
    )
  }

  // The booking is the source of truth, not the fact that we got here. Paystack
  // redirects back after a decline just as it does after a success.
  const paid = booking.paymentStatus === 'paid'

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={cx(
          'mx-auto grid size-16 place-items-center rounded-full',
          paid
            ? 'bg-brand-600 dark:bg-brand-500 dark:text-ink-950 text-white'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        )}
      >
        {paid ? <Check className="size-8" strokeWidth={3} /> : <Clock className="size-8" />}
      </motion.div>

      <h1 className="mt-6 text-center text-3xl font-black tracking-tight">
        {paid ? 'Booking confirmed' : 'Payment not completed'}
      </h1>
      <p className="text-dim mt-2 text-center text-pretty">
        Reference <span className="text-ink-950 dark:text-ink-100 font-bold">{booking.reference}</span>.{' '}
        {paid
          ? 'The owner has been notified and will meet you at pickup.'
          : 'Your dates are held, but the car is not booked until payment goes through.'}
      </p>

      {!paid && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-bold">
            {failed ? "We couldn't confirm this payment." : 'No payment has been received yet.'}
          </p>
          <p className="mt-1.5 leading-relaxed">
            If money left your account, don't pay again — it can take a minute to reach us, and this
            page updates on its own. Still showing this after a few minutes? Send us the reference
            above on WhatsApp and we'll sort it.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Button size="sm" onClick={retry} loading={retrying}>
              Try payment again
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              Check again
            </Button>
          </div>
        </div>
      )}

      <Card className="mt-10 overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center">
          <img
            src={booking.car?.images[0]}
            alt=""
            className="h-24 w-full rounded-lg object-cover sm:w-36"
          />
          <div className="flex-1">
            <p className="text-lg font-bold tracking-tight">{booking.car?.name}</p>
            <p className="text-dim mt-1 flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5" />
              {booking.pickupLocation}
            </p>
            <div className="mt-2.5 flex gap-2">
              <BookingBadge status={booking.status} />
              <PaymentBadge status={booking.paymentStatus} />
            </div>
          </div>
        </div>

        <dl className="divide-y text-sm">
          <Row
            label="Rental period"
            value={`${formatDate(booking.startDate)} → ${formatDate(booking.endDate)} (${booking.days} days)`}
          />
          <Row label="Driver" value={booking.renter.fullName} />
          <Row label="Licence" value={booking.renter.licenseNumber} />
          <Row label="Rental subtotal" value={money(booking.subtotal)} />
          <Row label="Service fee" value={money(booking.serviceFee)} />
          <Row label="Insurance" value={money(booking.insuranceFee)} />
          {/* "Total paid" on an unpaid booking is the same lie as the green
              tick was — it becomes an amount due until the money arrives. */}
          <Row label={paid ? 'Total paid' : 'Total due'} value={money(booking.total)} strong />
          <Row label="Payment reference" value={booking.paymentReference ?? '—'} />
        </dl>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {/* No receipt for money we haven't received — it would read as proof
            of payment to anyone the customer showed it to. */}
        {paid && (
          <Button variant="secondary" onClick={() => downloadReceipt(booking)}>
            <Download className="size-4" />
            Download receipt
          </Button>
        )}
        <LinkButton to="/account">
          <CalendarDays className="size-4" />
          View my bookings
        </LinkButton>
        <WhatsAppButton
          href={supportLink(messages.aboutBooking(booking.reference, booking.car?.name ?? 'my car'))}
        >
          Chat with support
        </WhatsAppButton>
      </div>

      <p className="text-dim mt-8 text-center text-sm">
        Need to change something?{' '}
        <Link to="/support" className="text-brand-700 dark:text-brand-300 font-semibold">
          Contact support
        </Link>
      </p>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-3">
      <dt className="text-dim">{label}</dt>
      <dd className={strong ? 'text-base font-black' : 'font-semibold'}>{value}</dd>
    </div>
  )
}
