import { Link } from 'react-router-dom'
import { cx } from '@/lib/format'

/** AUTOGO wordmark — a speed-line "G" set in a rounded badge. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="AUTOGO home"
      className={cx('inline-flex items-center gap-2.5', className)}
    >
      <span className="bg-accent-600 grid size-9 shrink-0 place-items-center rounded-[0.625rem]">
        <svg viewBox="0 0 24 24" className="size-5.5" aria-hidden>
          {/* Speed lines trailing a 'G' — the mark reads as motion, not a car icon. */}
          <path
            d="M4 15.4h2.4M2.4 12.1h3.9"
            className="stroke-white/70"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M19 10.2a6 6 0 1 0 .9 5.3H15"
            fill="none"
            className="stroke-white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[1.375rem] leading-none font-black tracking-[-0.05em]">
          AUTO<span className="text-accent-600 dark:text-accent-400">GO</span>
        </span>
      )}
    </Link>
  )
}
