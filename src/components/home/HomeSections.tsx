import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Apple,
  BadgeCheck,
  CreditCard,
  Headphones,
  KeyRound,
  MapPinned,
  Play,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { ArrowTip, LinkButton } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { CarCard } from '@/components/cars/CarCard'
import { EASE, Marquee, Tally, TiltCard } from './motion'
import { POPULAR_BRANDS } from '@/lib/catalog'
import { testimonials } from '@/lib/mockData'
import type { Car } from '@/lib/types'

const Section = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <section className={`mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 ${className}`}>
    {children}
  </section>
)

/**
 * Section header with a numbered rule down the left. Reusing one *structure*
 * with real hierarchy beats repeating eyebrow/title/subtitle blocks centred on
 * every band — that sameness is what makes a page feel machine-assembled.
 */
function Chapter({
  index,
  kicker,
  title,
  lede,
  action,
}: {
  index: string
  kicker: string
  title: React.ReactNode
  lede?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-14 flex flex-col gap-6 border-t pt-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-6 sm:gap-10">
        <span className="text-dim shrink-0 pt-1 text-xs font-bold tracking-[0.2em] tabular-nums">
          {index}
        </span>
        <div className="max-w-xl">
          <p className="text-dim text-[0.6875rem] font-bold tracking-[0.2em] uppercase">{kicker}</p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.05] font-black tracking-[-0.035em] text-balance">
            {title}
          </h2>
          {lede && <p className="text-dim mt-4 leading-relaxed text-pretty">{lede}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:pt-2">{action}</div>}
    </div>
  )
}

/* ── Brand marquee ──────────────────────────────────────────────── */

export function BrandStrip() {
  return (
    <div className="border-y py-7">
      <Marquee speed={38}>
        {POPULAR_BRANDS.map((brand) => (
          <Link
            key={brand}
            to={`/cars?brand=${encodeURIComponent(brand)}`}
            className="text-dim hover:text-ink-950 dark:hover:text-white shrink-0 text-xl font-black tracking-[-0.02em] whitespace-nowrap transition-colors sm:text-2xl"
          >
            {brand}
            <span className="text-accent-500 ml-10 align-middle text-xs">◆</span>
          </Link>
        ))}
      </Marquee>
    </div>
  )
}

/* ── Featured cars ──────────────────────────────────────────────── */

export function FeaturedCars({ cars }: { cars: Car[] }) {
  return (
    <Section>
      <Chapter
        index="01"
        kicker="This week's fleet"
        title="Hand-picked cars from owners who answer their phone."
        action={
          <LinkButton to="/cars" variant="secondary">
            All cars
            <ArrowTip />
          </LinkButton>
        }
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cars.map((car, i) => (
          <CarCard key={car.id} car={car} index={i} />
        ))}
      </div>
    </Section>
  )
}

/* ── How it works: scroll-driven ────────────────────────────────── */

const STEPS = [
  {
    icon: Search,
    title: 'Find it',
    body: 'Filter by city, dates, body type and budget. The price you see is the price you pay — service fee and insurance included.',
  },
  {
    icon: CreditCard,
    title: 'Book it',
    body: 'We check the owner’s calendar live, then hold your payment in escrow until the handover is done.',
  },
  {
    icon: KeyRound,
    title: 'Drive it',
    body: 'Meet the owner, run the two-minute inspection together, and go. Support is one tap away for the whole trip.',
  },
  {
    icon: Wallet,
    title: 'Hand it back',
    body: 'Return it as you found it. The deposit releases within three working days and you rate the trip.',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.55'],
  })
  const railHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-ink-950 text-ink-100 dark:bg-ink-900">
      <Section>
        <div className="mb-14 flex flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:justify-between">
          <div className="flex gap-6 sm:gap-10">
            <span className="shrink-0 pt-1 text-xs font-bold tracking-[0.2em] text-white/40 tabular-nums">
              02
            </span>
            <div className="max-w-xl">
              <p className="text-accent-400 text-[0.6875rem] font-bold tracking-[0.2em] uppercase">
                How it works
              </p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.05] font-black tracking-[-0.035em] text-balance text-white">
                Four steps. No counter, no queue, no clipboard.
              </h2>
            </div>
          </div>
        </div>

        <div ref={ref} className="relative pl-10 sm:pl-16">
          {/* Progress rail fills as the section scrolls past. */}
          <div className="absolute top-2 bottom-2 left-[0.4375rem] w-px bg-white/15 sm:left-[1.4375rem]">
            <motion.div
              style={{ height: railHeight }}
              className="bg-accent-500 w-full origin-top"
            />
          </div>

          <ol className="space-y-14 sm:space-y-20">
            {STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.65, ease: EASE }}
                className="relative"
              >
                <span className="border-ink-950 bg-accent-500 absolute top-1.5 -left-10 size-[0.9375rem] rounded-full border-4 sm:-left-16 dark:border-ink-900" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="text-accent-400/80 text-5xl font-black tracking-tighter tabular-nums sm:text-6xl">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="max-w-xl">
                    <h3 className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
                      <step.icon className="text-accent-400 size-5" />
                      {step.title}
                    </h3>
                    <p className="mt-2.5 leading-relaxed text-white/60 text-pretty">{step.body}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Section>
    </div>
  )
}

/* ── Why choose us: editorial list, varied weight ───────────────── */

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Verified owners only',
    body: 'Every host passes KYC and every car is checked by our team before it goes live. No ghost listings, no bait pricing.',
  },
  {
    icon: ShieldCheck,
    title: 'Insured on every trip',
    body: 'Comprehensive cover with a collision damage waiver is bundled into the price of each booking, for the named driver.',
  },
  {
    icon: MapPinned,
    title: 'Live GPS tracking',
    body: 'Tracked vehicles stream location, route history and geofence alerts — visible to both parties, hidden from neither.',
  },
  {
    icon: Headphones,
    title: 'Support that answers',
    body: 'Real people on phone and chat from 7am to 11pm, every day, including public holidays.',
  },
]

export function WhyChooseUs() {
  return (
    <Section>
      <Chapter
        index="03"
        kicker="Why AUTOGO"
        title="Built around the two things that break car hire here."
        lede="Trust and transparency. Everything below exists because one of those was missing somewhere else."
      />

      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {REASONS.map((reason, i) => (
          <motion.div
            key={reason.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: (i % 2) * 0.08, ease: EASE }}
            className="border-t pt-6"
          >
            <reason.icon className="size-6" strokeWidth={1.6} />
            <h3 className="mt-5 text-xl font-bold tracking-tight">{reason.title}</h3>
            <p className="text-dim mt-2.5 leading-relaxed text-pretty">{reason.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

/* ── Testimonials: one hero quote, two supporting ───────────────── */

export function Testimonials() {
  const [lead, ...rest] = testimonials

  return (
    <div className="surface-sunken border-y">
      <Section>
        <Chapter index="04" kicker="Testimonials" title="What renters and owners actually say." />

        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex flex-col justify-between"
          >
            <blockquote className="text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.25] font-bold tracking-[-0.03em] text-balance">
              <span className="text-accent-500">“</span>
              {lead.quote}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t pt-6">
              <span className="bg-accent-600 grid size-11 place-items-center rounded-full text-sm font-black text-white">
                {lead.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
              <span>
                <span className="block font-bold">{lead.name}</span>
                <span className="text-dim block text-sm">{lead.role}</span>
              </span>
              <Rating value={lead.rating} className="ml-auto" />
            </figcaption>
          </motion.figure>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((t, i) => (
              <motion.figure
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE }}
                className="surface-raised rounded-2xl border p-6"
              >
                <Rating value={t.rating} />
                <blockquote className="mt-3 leading-relaxed text-pretty">{t.quote}</blockquote>
                <figcaption className="text-dim mt-4 text-sm">
                  <span className="text-ink-950 font-semibold dark:text-white">{t.name}</span> ·{' '}
                  {t.role}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ── Owner CTA ──────────────────────────────────────────────────── */

const OWNER_STATS = [
  { value: 412_000, prefix: '₦', label: 'Average monthly earnings', format: (n: number) => `₦${Math.round(n / 1000)}k` },
  { value: 48, label: 'Hours to first booking', format: (n: number) => `${Math.round(n)}hrs` },
  { value: 0, label: 'Cost to list a car', format: () => '₦0' },
  { value: 10, label: 'Flat service fee', format: (n: number) => `${Math.round(n)}%` },
]

export function OwnerCta() {
  return (
    <Section>
      <TiltCard intensity={3} className="[transform-style:preserve-3d]">
        <div className="bg-ink-950 dark:bg-ink-900 relative overflow-hidden rounded-[1.75rem] p-8 sm:p-14">
          <div
            aria-hidden
            className="bg-accent-500/22 absolute -top-28 -right-20 size-80 rounded-full blur-[90px]"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, white 0 1px, transparent 1px 14px)',
            }}
          />

          <div className="relative grid items-end gap-12 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <p className="text-accent-400 text-[0.6875rem] font-bold tracking-[0.2em] uppercase">
                Earn with your car
              </p>
              <h2 className="mt-4 text-[clamp(1.875rem,4vw,3.25rem)] leading-[1.02] font-black tracking-[-0.04em] text-balance text-white">
                Your car earns nothing sitting in the compound.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-white/60 text-pretty">
                List it in ten minutes, set your own price and calendar, and approve only the
                bookings you want. Payouts land the working day after each trip ends.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <LinkButton to="/become-a-host" variant="accent" size="lg">
                  Start earning
                  <ArrowTip />
                </LinkButton>
                <LinkButton
                  to="/how-it-works"
                  size="lg"
                  variant="ghost"
                  className="border border-white/20 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
                >
                  See how payouts work
                </LinkButton>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-8">
              {OWNER_STATS.map((stat) => (
                <div key={stat.label} className="border-t border-white/15 pt-4">
                  <dt className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    <Tally to={stat.value} format={stat.format} />
                  </dt>
                  <dd className="mt-2 text-xs leading-snug text-white/50">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </TiltCard>
    </Section>
  )
}

/* ── Mobile app ─────────────────────────────────────────────────── */

export function MobileApp() {
  return (
    <Section className="!pt-0">
      <div className="grid items-center gap-12 border-t pt-14 lg:grid-cols-[1fr_auto]">
        <div className="max-w-lg">
          <p className="text-dim text-[0.6875rem] font-bold tracking-[0.2em] uppercase">
            Coming soon
          </p>
          <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.08] font-black tracking-[-0.035em] text-balance">
            Every trip, managed from your pocket.
          </h2>
          <p className="text-dim mt-4 leading-relaxed text-pretty">
            Live GPS on the map, digital handover checklists, instant booking alerts and one-tap
            support. Landing on iOS and Android this year.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <StoreButton icon={Apple} top="Download on the" bottom="App Store" />
            <StoreButton icon={Play} top="Get it on" bottom="Google Play" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36, rotate: -4 }}
          whileInView={{ opacity: 1, y: 0, rotate: -4 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="from-ink-900 to-ink-950 mx-auto flex aspect-9/16 w-60 flex-col justify-end rounded-[2.25rem] bg-gradient-to-b p-3.5 shadow-lift-lg ring-1 ring-white/10"
        >
          <div className="surface-raised rounded-[1.5rem] p-4">
            <p className="text-dim text-[0.625rem] font-bold tracking-[0.14em] uppercase">
              Trip in progress
            </p>
            <p className="mt-1.5 font-bold tracking-tight">Toyota Camry SE</p>
            <p className="text-dim mt-0.5 text-xs">Lekki Phase 1 → Ikeja</p>
            <div className="bg-ink-200 dark:bg-ink-700 mt-4 h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="bg-accent-500 h-full rounded-full"
                initial={{ width: '8%' }}
                whileInView={{ width: '68%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
              />
            </div>
            <p className="text-dim mt-2 text-[0.625rem]">Returns in 2 days · 148km driven</p>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

function StoreButton({
  icon: Icon,
  top,
  bottom,
}: {
  icon: React.ComponentType<{ className?: string }>
  top: string
  bottom: string
}) {
  return (
    <button
      type="button"
      className="bg-ink-950 hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-200 flex items-center gap-3 rounded-[0.625rem] px-5 py-2.5 text-white transition-colors"
    >
      <Icon className="size-6" />
      <span className="text-left leading-tight">
        <span className="block text-[0.625rem] opacity-70">{top}</span>
        <span className="block text-sm font-bold">{bottom}</span>
      </span>
    </button>
  )
}
