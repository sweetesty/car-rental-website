import { Star } from 'lucide-react'
import { cx } from '@/lib/format'

interface RatingProps {
  value: number
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

/** Read-only star display. Half-stars are shown by clipping the filled layer. */
export function Rating({ value, count, size = 'sm', className }: RatingProps) {
  const star = size === 'sm' ? 'size-3.5' : 'size-4.5'
  return (
    <span className={cx('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(1, Math.max(0, value - i))
          return (
            <span key={i} className="relative">
              <Star className={cx(star, 'text-ink-300 dark:text-ink-700')} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={cx(star, 'fill-amber-400 text-amber-400')} />
              </span>
            </span>
          )
        })}
      </span>
      <span className={cx('font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className={cx('text-dim', size === 'sm' ? 'text-xs' : 'text-sm')}>({count})</span>
      )}
      <span className="sr-only">
        {value.toFixed(1)} out of 5{count !== undefined ? ` from ${count} reviews` : ''}
      </span>
    </span>
  )
}

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
}

/** Clickable 1–5 star picker for the review form. */
export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cx(
              'size-6',
              n <= value ? 'fill-amber-400 text-amber-400' : 'text-ink-300 dark:text-ink-700',
            )}
          />
        </button>
      ))}
    </div>
  )
}
