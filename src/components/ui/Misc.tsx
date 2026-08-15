import type { ComponentType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { cx, initials } from '@/lib/format'

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Tag className={cx('surface-raised rounded-card border shadow-lift', className)}>
      {children}
    </Tag>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  action?: ReactNode
}) {
  return (
    <div
      className={cx(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center',
      )}
    >
      <div className={cx('max-w-2xl', align === 'center' && 'text-center')}>
        {eyebrow && (
          <p className="text-brand-600 dark:text-brand-400 mb-2 text-xs font-bold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {subtitle && <p className="text-dim mt-2 leading-relaxed text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatTile({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string
  value: string
  delta?: string
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-dim text-sm font-medium">{label}</p>
        {Icon && (
          <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-9 shrink-0 place-items-center rounded-lg">
            <Icon className="size-4.5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {delta && <p className="text-dim mt-1 text-xs">{delta}</p>}
    </Card>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-16 text-center">
      <span className="surface-sunken text-dim grid size-12 place-items-center rounded-full">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="text-dim mt-1 max-w-sm text-sm text-pretty">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base' }[size]
  if (src) {
    return <img src={src} alt="" className={cx(dim, 'rounded-full object-cover')} />
  }
  return (
    <span
      aria-hidden
      className={cx(
        dim,
        'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 grid shrink-0 place-items-center rounded-full font-bold',
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Fades a section in the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Placeholder rows while a dashboard list is loading from the API. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="surface-raised rounded-card flex gap-5 border p-5">
          <div className="skeleton h-24 w-36 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Sitewide notice that the API is unreachable and the bundled seed dataset is
 * standing in — so nobody mistakes demo cars and bookings for live data.
 */
export function DemoBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <WifiOff className="size-4 shrink-0" />
        <p className="flex-1">
          <span className="font-bold">Demo mode.</span> The AUTOGO API isn't reachable, so sample
          data is being shown. Start the backend in <code className="font-semibold">/server</code>{' '}
          (with MongoDB running) for live data. Demo sign-in password:{' '}
          <code className="font-semibold">autogo</code>
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-400 px-3 py-1 font-semibold dark:border-amber-800"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

/**
 * Shown to real customers when the fleet genuinely fails to load.
 *
 * Says nothing about servers, APIs or reconnecting: a renter can't act on any
 * of that, and infrastructure language makes a site feel broken rather than
 * busy. Loading is covered by skeletons instead — a warning banner during a
 * normal two-second fetch reads as an outage when nothing is wrong.
 */
export function ReconnectingBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <WifiOff className="size-4 shrink-0" />
        <p className="flex-1">
          <span className="font-bold">Having trouble loading cars.</span> Check your connection —
          we'll keep trying.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-400 px-3 py-1 font-semibold dark:border-amber-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx(
        'border-brand-600 dark:border-brand-400 inline-block size-5 animate-spin rounded-full border-2 border-t-transparent',
        className,
      )}
    />
  )
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="border-subtle flex gap-1 overflow-x-auto border-b" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            'relative shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors',
            active === tab.id ? 'text-brand-700 dark:text-brand-300' : 'text-dim hover:text-ink-900 dark:hover:text-ink-100',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="surface-sunken ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums">
              {tab.count}
            </span>
          )}
          {active === tab.id && (
            <motion.span
              layoutId="tab-underline"
              className="bg-brand-600 dark:bg-brand-400 absolute inset-x-2 -bottom-px h-0.5 rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  )
}
