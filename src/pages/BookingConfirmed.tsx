import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Check, Download, MapPin } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Misc'
import { BookingBadge, PaymentBadge } from '@/components/ui/Badge'
import { WhatsAppButton } from '@/components/ui/WhatsApp'
import { messages, supportLink } from '@/lib/whatsapp'
import { downloadReceipt } from '@/lib/receipt'
import { useData } from '@/lib/hooks'
import { formatDate, money } from '@/lib/format'

export default function BookingConfirmed() {
  const { id = '' } = useParams()
  const { bookings } = useData()

  const booking = useMemo(() => bookings.find((b) => b.id === id), [bookings, id])

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="bg-brand-600 dark:bg-brand-500 dark:text-ink-950 mx-auto grid size-16 place-items-center rounded-full text-white"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.div>

      <h1 className="mt-6 text-center text-3xl font-black tracking-tight">Booking confirmed</h1>
      <p className="text-dim mt-2 text-center text-pretty">
        Reference <span className="text-ink-950 dark:text-ink-100 font-bold">{booking.reference}</span>.
        The owner has been notified and will meet you at pickup.
      </p>

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
          <Row label="Total paid" value={money(booking.total)} strong />
          <Row label="Payment reference" value={booking.paymentReference ?? '—'} />
        </dl>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => downloadReceipt(booking)}>
          <Download className="size-4" />
          Download receipt
        </Button>
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
