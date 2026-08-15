import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '@/lib/format'

interface SliderProps {
  children: ReactNode
  /** Names the carousel for screen readers, e.g. "Trending vehicles". */
  label: string
  className?: string
  /** Rendered beside the arrows — a "View all" link, typically. */
  action?: ReactNode
  title?: ReactNode
}

/**
 * Horizontal carousel built on native scroll snapping rather than a JS
 * transform: swipe, trackpad, keyboard and screen readers all work for free,
 * and it degrades to a plain scrollable row if scripting fails. The arrows
 * just call scrollBy — they're an affordance, not the mechanism.
 */
export function Slider({ children, label, className, action, title }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 8)
    // 8px slack absorbs sub-pixel rounding at the end of the track.
    setCanRight(el.scrollLeft < max - 8)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })

    // Card widths are viewport-relative, so re-measure when the box changes.
    const observer = new ResizeObserver(sync)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [sync, children])

  const nudge = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    // Scroll by most of a viewport so a partial card stays visible as an
    // affordance that there's more to come.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <div className={className}>
      {(title || action) && (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          {title}
          <div className="flex items-center gap-2">
            {action}
            <div className="hidden items-center gap-2 sm:flex">
              <Arrow direction="left" disabled={!canLeft} onClick={() => nudge(-1)} label={label} />
              <Arrow direction="right" disabled={!canRight} onClick={() => nudge(1)} label={label} />
            </div>
          </div>
        </div>
      )}

      {/* min-w-0 is load-bearing: without it the shrink-0 slides force this
          track to expand, which pushes the whole page into horizontal scroll
          instead of scrolling inside the rail. */}
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cx(
          'flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2',
          // Stops the gesture chaining to the document when the rail hits its
          // end — without this, swiping past the last card drags the whole page
          // sideways and exposes blank space beside it.
          'overscroll-x-contain',
          // Hide the scrollbar without disabling scrolling.
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Fixed-width snap target. Widths are the responsive card sizes. */
export function SlideItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  // Fixed widths, not percentages: a percentage width on a shrink-0 child
  // resolves against a container whose own width depends on its children,
  // which is the feedback loop that blew out the page width.
  return (
    <div
      className={cx('shrink-0 snap-start', 'w-72 sm:w-80 lg:w-[21rem]', className)}
    >
      {children}
    </div>
  )
}

function Arrow({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
  label: string
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Scroll ${label} ${direction}`}
      className="surface-raised hover:border-accent-500 hover:text-accent-600 grid size-10 place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon className="size-4.5" />
    </button>
  )
}
