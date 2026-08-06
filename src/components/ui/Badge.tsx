import type { ReactNode } from 'react'
import { cx } from '@/lib/format'
import type { BookingStatus, ListingStatus, PaymentStatus, VerificationStatus } from '@/lib/types'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent'

const TONES: Record<Tone, string> = {
  neutral: 'surface-sunken text-ink-600 border-subtle dark:text-ink-300',
  brand: 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:border-brand-800',
  success:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  danger: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  accent:
    'bg-accent-100 text-accent-800 border-accent-300 dark:bg-accent-800/30 dark:text-accent-300 dark:border-accent-700',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  pending: 'warning',
  confirmed: 'brand',
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
  rejected: 'danger',
}

export const BookingBadge = ({ status }: { status: BookingStatus }) => (
  <Badge tone={BOOKING_TONE[status]}>{status}</Badge>
)

const LISTING_TONE: Record<ListingStatus, Tone> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
}

export const ListingBadge = ({ status }: { status: ListingStatus }) => (
  <Badge tone={LISTING_TONE[status]}>{status}</Badge>
)

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  unpaid: 'warning',
  paid: 'success',
  refunded: 'neutral',
  failed: 'danger',
}

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAYMENT_TONE[status]}>{status}</Badge>
)

const VERIFY_TONE: Record<VerificationStatus, Tone> = {
  unverified: 'neutral',
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
}

export const VerificationBadge = ({ status }: { status: VerificationStatus }) => (
  <Badge tone={VERIFY_TONE[status]}>{status}</Badge>
)
