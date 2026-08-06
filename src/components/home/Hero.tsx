import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Fuel, MapPin, Star, Users } from 'lucide-react'
import { SearchBar } from '@/components/cars/SearchBar'
import { ArrowTip, LinkButton } from '@/components/ui/Button'
import { EASE, Float, Parallax, RisingWords, Tally } from './motion'
import { money } from '@/lib/format'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80'

/** Two staggered glints, different heights and speeds so the sweep never loops visibly. */
const STREAKS = [
  { top: '22%', duration: 2.6, delay: 2.4, gap: 3.4, opacity: 0.9 },
  { top: '38%', duration: 3.2, delay: 4.1, gap: 4.6, opacity: 0.55 },
]

export function Hero({ carCount }: { carCount: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // The whole fold drifts and dims slightly as you scroll past it.
  const foldY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const foldFade = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section ref={ref} className="relative overflow-hidden pb-4">
      <Backdrop progress={scrollYProgress} />

      <motion.div
        style={{ y: foldY, opacity: foldFade }}
        className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-16"
      >
        <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          {/* ── Copy column ── */}
          <div className="relative z-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-dim flex items-center gap-3 text-[0.6875rem] font-bold tracking-[0.22em] uppercase"
            >
              <span className="bg-accent-500 inline-block h-2 w-2 rounded-full" />
              Peer-to-peer car hire · Nigeria
            </motion.p>

            {/* Display type: tight tracking, heavy weight, deliberately oversized. */}
            <h1 className="mt-6 text-[clamp(2.75rem,7.2vw,5.5rem)] leading-[0.92] font-black tracking-[-0.045em]">
              <RisingWords text="Rent the car" delay={0.1} />
              <span className="block">
                <RisingWords text="parked next door." delay={0.28} highlight={['door']} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
              className="text-dim mt-7 max-w-md text-lg leading-[1.6] text-pretty"
            >
              No counters. No week-long deposits. Book a verified car from a real owner near you and
              collect the keys the same day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.78, ease: EASE }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <LinkButton to="/cars" variant="accent" size="lg">
                Find a car
                <ArrowTip />
              </LinkButton>
              <LinkButton to="/become-a-host" variant="secondary" size="lg">
                List yours instead
              </LinkButton>
            </motion.div>

            {/* Editorial stat rule — small caps over big numbers, hairline dividers. */}
            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              className="mt-12 grid max-w-lg grid-cols-3 border-t pt-6"
            >
              <Stat label="Cars listed" value={<Tally to={carCount} />} />
              <Stat label="Trips completed" value={<Tally to={2418} />} bordered />
              <Stat
                label="Average rating"
                value={
                  <span className="flex items-center gap-1.5">
                    <Tally to={4.8} format={(n) => n.toFixed(1)} />
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                  </span>
                }
                bordered
              />
            </motion.dl>
          </div>

          {/* ── Image column ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="relative"
          >
            <Parallax progress={scrollYProgress} distance={34}>
              <div className="relative overflow-hidden rounded-[1.5rem]">
                {/*
                 * Driving illusion: the photo is held over-scaled (1.12) and
                 * glides slowly side to side inside the frame, so the scenery
                 * appears to roll past the car. The over-scale is what gives
                 * the pan room — without it the drift would expose the edges.
                 */}
                <motion.img
                  src={HERO_IMAGE}
                  alt="A sports car on a desert road"
                  fetchPriority="high"
                  className="aspect-4/5 w-full object-cover sm:aspect-4/3"
                  initial={{ scale: 1.3 }}
                  animate={
                    reduced
                      ? { scale: 1.12 }
                      : { scale: 1.12, x: ['0%', '-3.5%', '0%'] }
                  }
                  transition={{
                    scale: { duration: 1.6, delay: 0.3, ease: EASE },
                    x: { duration: 16, delay: 1.9, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />

                {/* Light streaks sweeping across — the speed cue. */}
                {!reduced &&
                  STREAKS.map((s) => (
                    <motion.span
                      key={s.top}
                      aria-hidden
                      style={{ top: s.top }}
                      className="absolute left-0 h-px w-40 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
                      initial={{ x: '-140%', opacity: 0 }}
                      animate={{ x: ['-140%', '560%'], opacity: [0, s.opacity, 0] }}
                      transition={{
                        duration: s.duration,
                        delay: s.delay,
                        repeat: Infinity,
                        repeatDelay: s.gap,
                        ease: 'easeIn',
                      }}
                    />
                  ))}

                {/* Wipe that uncovers the photo on load. */}
                <motion.span
                  aria-hidden
                  className="bg-ink-950 absolute inset-0 origin-bottom"
                  initial={{ scaleY: 1 }}
                  animate={{ scaleY: 0 }}
                  transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                />
              </div>
            </Parallax>

            <Float className="absolute -bottom-6 -left-4 hidden sm:block" duration={6}>
              <PriceChip />
            </Float>

            <Float className="absolute top-8 -right-3 hidden lg:block" duration={7} delay={0.8}>
              <SpecChip />
            </Float>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
          className="mt-14 lg:mt-20"
        >
          <SearchBar />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-dim mt-10 flex items-center justify-center gap-2 text-xs font-medium tracking-wide"
        >
          <ArrowDown className="size-3.5 animate-bounce" />
          Scroll to browse this week's fleet
        </motion.p>
      </motion.div>
    </section>
  )
}

function Stat({
  label,
  value,
  bordered,
}: {
  label: string
  value: React.ReactNode
  bordered?: boolean
}) {
  return (
    <div className={bordered ? 'border-l pl-5' : 'pr-5'}>
      <dt className="text-dim text-[0.625rem] font-bold tracking-[0.16em] uppercase">{label}</dt>
      <dd className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">{value}</dd>
    </div>
  )
}

function PriceChip() {
  return (
    <div className="surface-raised w-52 rounded-2xl border p-4 shadow-lift-lg">
      <div className="flex items-center gap-2">
        <MapPin className="text-accent-600 dark:text-accent-500 size-3.5" />
        <p className="text-dim text-[0.625rem] font-bold tracking-[0.14em] uppercase">
          Lekki, Lagos
        </p>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight">
        {money(45000)}
        <span className="text-dim text-sm font-semibold"> /day</span>
      </p>
      <p className="text-dim mt-1 text-xs">Toyota Camry SE · 2022</p>
    </div>
  )
}

function SpecChip() {
  return (
    <div className="surface-raised text-dim flex items-center gap-4 rounded-full border px-4 py-2.5 text-xs font-semibold shadow-lift">
      <span className="flex items-center gap-1.5">
        <Users className="size-3.5" />5 seats
      </span>
      <span className="bg-ink-300 dark:bg-ink-700 h-3 w-px" />
      <span className="flex items-center gap-1.5">
        <Fuel className="size-3.5" />
        Petrol
      </span>
    </div>
  )
}

/** Grid, glow and grain — the texture behind the fold. */
function Backdrop({ progress }: { progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const glowY = useTransform(progress, [0, 1], [0, 160])

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--color-ink-400) 22%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-ink-400) 22%, transparent) 1px, transparent 1px)',
          backgroundSize: '76px 76px',
        }}
      />
      {/* Red reads as an alert at full strength across a whole fold, so the
          wash is kept faint — enough to warm the white, not enough to shout. */}
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="bg-accent-400/12 dark:bg-accent-500/10 absolute -top-40 left-1/2 -z-20 size-[34rem] -translate-x-1/2 rounded-full blur-[110px]"
      />
      <div
        aria-hidden
        className="from-brand-100/40 absolute -top-24 -left-32 -z-20 size-[26rem] rounded-full bg-gradient-to-br to-transparent blur-[90px] dark:from-brand-900/25"
      />
    </>
  )
}
