import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx, toISODate, todayISO } from '@/lib/format'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH = new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' })

interface Props {
  unavailableDates: string[]
  /** Highlights the currently selected booking window. */
  range?: { start: string; end: string }
  /** When set, clicking a day toggles it — used by the owner's blackout editor. */
  onToggleDate?: (iso: string) => void
}

export function AvailabilityCalendar({ unavailableDates, range, onToggleDate }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const blocked = useMemo(() => new Set(unavailableDates), [unavailableDates])
  const today = todayISO()

  const days = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    // Monday-first grid, so Sunday (0) becomes the last column.
    const lead = (first.getDay() + 6) % 7
    const count = new Date(year, month + 1, 0).getDate()
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => toISODate(new Date(year, month, i + 1))),
    ]
  }, [cursor])

  const shift = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  const inRange = (iso: string) =>
    !!range?.start && !!range?.end && iso >= range.start && iso <= range.end

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="hover:surface-sunken rounded-lg p-1.5"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-bold">{MONTH.format(cursor)}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="hover:surface-sunken rounded-lg p-1.5"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-dim py-1 text-[11px] font-bold">
            {d}
          </span>
        ))}

        {days.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} />

          const isBlocked = blocked.has(iso)
          const isPast = iso < today
          const selected = inRange(iso)
          const interactive = !!onToggleDate && !isPast

          return (
            <button
              key={iso}
              type="button"
              disabled={!interactive}
              onClick={() => onToggleDate?.(iso)}
              aria-label={`${iso}${isBlocked ? ' — unavailable' : ''}`}
              className={cx(
                'grid aspect-square place-items-center rounded-md text-xs font-semibold transition-colors',
                interactive && 'cursor-pointer hover:ring-2 hover:ring-brand-400',
                isPast && 'text-ink-300 dark:text-ink-700',
                !isPast && isBlocked && 'bg-red-100 text-red-700 line-through dark:bg-red-950 dark:text-red-300',
                !isPast && !isBlocked && selected && 'bg-brand-600 text-white dark:bg-brand-500 dark:text-ink-950',
                !isPast && !isBlocked && !selected && 'surface-sunken',
              )}
            >
              {Number(iso.slice(8))}
            </button>
          )
        })}
      </div>

      <div className="text-dim mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <Key className="surface-sunken border">Available</Key>
        <Key className="bg-red-100 dark:bg-red-950">Booked / blocked</Key>
        {range && <Key className="bg-brand-600 dark:bg-brand-500">Your dates</Key>}
      </div>
    </div>
  )
}

function Key({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx('size-3 rounded', className)} />
      {children}
    </span>
  )
}
