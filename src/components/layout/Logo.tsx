import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/lib/format'

/** Drop the emblem PNG here and every `variant="badge"` usage picks it up. */
const BADGE_SRC = '/logo.png'

/**
 * Fallback wordmark: a speed-line "G" in a rounded tile. Used in the header,
 * where the circular badge would be unreadable at 36px — its ribbon text and
 * speedometer detail collapse into mush below roughly 80px.
 */
function WordmarkTile() {
  return (
    <span className="bg-accent-600 grid size-9 shrink-0 place-items-center rounded-[0.625rem]">
      <svg viewBox="0 0 24 24" className="size-5.5" aria-hidden>
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
  )
}

interface LogoProps {
  className?: string
  /** Hides the AUTOGO text, leaving just the mark. */
  compact?: boolean
  /**
   * `wordmark` (default) — tile + AUTOGO text, built for small sizes.
   * `badge` — the full circular emblem, for footers, auth pages and anywhere
   * it can be rendered at 80px or larger.
   */
  variant?: 'wordmark' | 'badge'
  /** Badge size in pixels. Below ~72 the ribbon text stops being legible. */
  size?: number
}

export function Logo({
  className,
  compact = false,
  variant = 'wordmark',
  size = 96,
}: LogoProps) {
  // Until logo.png exists the badge would render as a broken image, so fall
  // back to the wordmark rather than showing a placeholder icon.
  const [badgeFailed, setBadgeFailed] = useState(false)
  const useBadge = variant === 'badge' && !badgeFailed

  return (
    <Link
      to="/"
      aria-label="AUTOGO home"
      className={cx('inline-flex items-center gap-2.5', className)}
    >
      {useBadge ? (
        <img
          src={BADGE_SRC}
          alt="AUTOGO — car rentals and car hire"
          width={size}
          height={size}
          onError={() => setBadgeFailed(true)}
          className="shrink-0 object-contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <>
          <WordmarkTile />
          {!compact && (
            <span className="text-[1.375rem] leading-none font-black tracking-[-0.05em]">
              AUTO<span className="text-accent-600 dark:text-accent-400">GO</span>
            </span>
          )}
        </>
      )}
    </Link>
  )
}
