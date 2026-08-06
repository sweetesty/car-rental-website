import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { cx } from '@/lib/format'

/**
 * Shared motion pieces for the landing page. Each one respects
 * prefers-reduced-motion by falling back to a static render rather than a
 * shortened animation — a jitter at 0.01s is worse than no movement.
 */

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Headline reveal: each word rises out of its own overflow-hidden clip, so the
 * type looks like it's being set rather than fading in as one block.
 */
export function RisingWords({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  highlight,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  /** Words matching this get the accent underline treatment. */
  highlight?: string[]
}) {
  const reduced = useReducedMotion()
  const words = text.split(' ')

  if (reduced) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {words.map((word, i) => {
        const marked = highlight?.includes(word.replace(/[.,]/g, ''))
        return (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.85, delay: delay + i * stagger, ease: EASE }}
            >
              {marked ? <Marked delay={delay + i * stagger + 0.5}>{word}</Marked> : word}
              {i < words.length - 1 && ' '}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

/** A hand-drawn-feeling accent stroke that sweeps under a word. */
function Marked({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="relative inline-block">
      {children}
      <motion.span
        aria-hidden
        className="bg-accent-500 absolute -bottom-[0.06em] left-0 h-[0.11em] w-full origin-left rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay, ease: EASE }}
      />
    </span>
  )
}

const defaultTallyFormat = (n: number) => Math.round(n).toLocaleString('en-NG')

/**
 * Counts up to a target the first time it scrolls into view.
 *
 * `format` is held in a ref rather than listed as an effect dependency: callers
 * pass inline arrow functions, so a fresh identity every render would restart
 * the count from zero on each re-render and the number would never settle.
 */
export function Tally({
  to,
  format = defaultTallyFormat,
  duration = 1.4,
  className,
}: {
  to: number
  format?: (value: number) => string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()

  const formatRef = useRef(format)
  formatRef.current = format

  const [display, setDisplay] = useState(() => format(reduced ? to : 0))

  useEffect(() => {
    const render = (value: number) => setDisplay(formatRef.current(value))

    // Nothing to count to yet (data still loading) — show the target as-is and
    // let the effect re-run when a real value arrives.
    if (reduced || !inView || to === 0) {
      render(to)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      // Ease-out cubic: fast off the line, settles gently on the number.
      render(to * (1 - (1 - t) ** 3))
      if (t < 1) frame = requestAnimationFrame(tick)
      else render(to)
    }

    frame = requestAnimationFrame(tick)

    // Safety net: if rAF is throttled (background tab, headless virtual time,
    // a struggling device) the tween can stall part-way. Land on the real
    // number regardless — a wrong figure on screen is worse than no animation.
    const settle = setTimeout(() => {
      cancelAnimationFrame(frame)
      render(to)
    }, duration * 1000 + 150)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
  }, [inView, reduced, to, duration])

  return (
    <span ref={ref} className={cx('tabular-nums', className)}>
      {display}
    </span>
  )
}

/**
 * Infinite horizontal marquee. Duplicates its children once and translates the
 * pair by exactly -50%, so the seam is never visible.
 */
export function Marquee({
  children,
  speed = 32,
  reverse = false,
  className,
}: {
  children: React.ReactNode
  speed?: number
  reverse?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={cx('flex gap-10 overflow-x-auto', className)}>{children}</div>
  }

  return (
    <div className={cx('group/marquee relative flex overflow-hidden', className)}>
      {[0, 1].map((copy) => (
        <motion.div
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 items-center gap-10 pr-10 group-hover/marquee:[animation-play-state:paused]"
          initial={{ x: reverse ? '-100%' : 0 }}
          animate={{ x: reverse ? '0%' : '-100%' }}
          transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        >
          {children}
        </motion.div>
      ))}
    </div>
  )
}

/** Card that tilts toward the cursor. Subtle — 6 degrees at the corners. */
export function TiltCard({
  children,
  className,
  intensity = 6,
}: {
  children: React.ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), {
    stiffness: 220,
    damping: 22,
  })
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), {
    stiffness: 220,
    damping: 22,
  })

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        px.set((e.clientX - rect.left) / rect.width)
        py.set((e.clientY - rect.top) / rect.height)
      }}
      onPointerLeave={() => {
        px.set(0.5)
        py.set(0.5)
      }}
    >
      {children}
    </motion.div>
  )
}

/** Drifts an element slowly up and down forever — for floating overlay chips. */
export function Float({
  children,
  amplitude = 8,
  duration = 5,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  amplitude?: number
  duration?: number
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Applies a scroll-linked parallax offset to its children. */
export function Parallax({
  progress,
  distance = 60,
  children,
  className,
}: {
  progress: MotionValue<number>
  distance?: number
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  const y = useTransform(progress, [0, 1], [distance, -distance])

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

export { EASE }
