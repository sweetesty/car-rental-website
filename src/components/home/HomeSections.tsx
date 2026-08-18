import { useMemo, useRef } from 'react'
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
import { money } from '@/lib/format'
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

/* ── Browse by city: image-led, numbers pulled from the live fleet ── */

const CITY_IMAGES: Record<string, string> = {
  Lagos: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=70',
  Abuja: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=900&q=70',
  'Port Harcourt':
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=70',
  Ibadan:
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=70',
}

export function CityShowcase({ cars }: { cars: Car[] }) {
  // Count and floor-price per city, so the cards state facts, not slogans.
  const cities = useMemo(() => {
    const byCity = new Map<string, { count: number; from: number }>()
    for (const car of cars) {
      if (car.status !== 'approved') continue
      const entry = byCity.get(car.city)
      byCity.set(car.city, {
        count: (entry?.count ?? 0) + 1,
        from: entry ? Math.min(entry.from, car.pricePerDay) : car.pricePerDay,
      })
    }
    return Object.keys(CITY_IMAGES)
      .map((name) => ({ name, ...byCity.get(name) }))
      .filter((c): c is { name: string; count: number; from: number } => !!c.count)
  }, [cars])

  if (cities.length === 0) return null

  return (
    <Section>
      <Chapter
        index="02"
        kicker="Where we are"
        title="Pick a city, pick up the keys."
        lede="AUTOGO runs wherever owners list — these are the busiest cities right now."
      />

      {/* First card double-width: an even 4-up grid reads like a template. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city, i) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
            className={i === 0 ? 'sm:col-span-2' : ''}
          >
            <Link
              to={`/cars?city=${encodeURIComponent(city.name)}`}
              className="group relative block h-72 overflow-hidden rounded-2xl"
            >
              <img
                src={CITY_IMAGES[city.name]}
                alt={`Cars for hire in ${city.name}`}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="from-ink-950/85 absolute inset-0 bg-gradient-to-t via-ink-950/25 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">{city.name}</h3>
                  <p className="mt-1 text-sm text-white/70">
                    {city.count} car{city.count === 1 ? '' : 's'} · from {money(city.from)}/day
                  </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-[background-color,translate] duration-200 group-hover:translate-x-1 group-hover:bg-accent-600">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
                    <path
                      d="M2.5 8h11m0 0L9.5 4m4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </motion.div>
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
              03
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
        index="04"
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
        <Chapter index="05" kicker="Testimonials" title="What renters and owners actually say." />

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

/* ── FAQ: the four questions that actually stall a first booking ── */

const FAQS = [
  {
    q: 'How do I know the car is safe and legit?',
    a: 'Every owner passes identity verification and every listing is inspected by our team before it goes public — papers, insurance certificate and photos. Comprehensive insurance with a collision damage waiver is included in every booking.',
  },
  {
    q: 'What do I need before I can rent?',
    a: 'A licence held for at least two years, and you must meet the minimum driver age on the listing (most cars: 23). Bring the licence and a government ID to the handover — the owner checks both before releasing the car.',
  },
  {
    q: 'When am I actually charged?',
    a: 'You pay at booking, but the money is held in escrow — the owner only receives it after the handover is done. Cancel inside the free window (48 hours on most cars) and you get every naira back automatically.',
  },
  {
    q: 'How do payouts work if I list my car?',
    a: 'Listing is free. AUTOGO takes a flat 10% service fee per trip and your payout lands in your bank account the working day after each completed trip — no monthly settlement runs.',
  },
]

export function Faq() {
  return (
    <Section className="!pt-0">
      <Chapter
        index="06"
        kicker="Before you ask"
        title="The questions everyone asks first."
        action={
          <LinkButton to="/how-it-works" variant="secondary">
            Full FAQ
            <ArrowTip />
          </LinkButton>
        }
      />

      <div className="mx-auto grid max-w-3xl gap-3">
        {FAQS.map((faq, i) => (
          <motion.details
            key={faq.q}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            className="surface-raised group rounded-2xl border px-6 py-5 open:shadow-lift"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-tight marker:hidden">
              {faq.q}
              <span
                aria-hidden
                className="text-accent-600 dark:text-accent-400 shrink-0 text-xl leading-none font-black transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-dim mt-3 max-w-xl leading-relaxed text-pretty">{faq.a}</p>
          </motion.details>
        ))}
      </div>
    </Section>
  )
}

/* ── Final CTA: the red band that closes the page ───────────────── */

export function FinalCta() {
  return (
    // -mb-24 cancels the footer's mt-24, so the band sits flush against it.
    <section className="from-brand-600 to-brand-800 relative -mb-24 overflow-hidden bg-gradient-to-br">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'repeating-linear-gradient(115deg, white 0 1px, transparent 1px 16px)',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-32 right-[10%] size-96 rounded-full bg-white/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <motion.h2
          initial={false}
          whileInView={{ opacity: [0, 1], y: [24, 0] }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.75rem)] leading-[1.02] font-black tracking-[-0.04em] text-balance text-white"
        >
          Your next trip starts down the road.
        </motion.h2>

        <motion.p
          initial={false}
          whileInView={{ opacity: [0, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/75 text-pretty"
        >
          Verified cars, real owners, one honest price. Book in minutes — or list your car and let
          it pay for itself.
        </motion.p>

        <motion.div
          initial={false}
          whileInView={{ opacity: [0, 1], y: [16, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mt-9 flex flex-wrap justify-center gap-3"
        >
          <LinkButton to="/cars" size="lg" variant="inverse">
            Browse cars
            <ArrowTip />
          </LinkButton>
          <LinkButton
            to="/become-a-host"
            size="lg"
            variant="ghost"
            className="border border-white/30 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
          >
            List your car
          </LinkButton>
        </motion.div>

        <p className="mt-8 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
          Verified owners · No card surcharges · Support 7am–11pm
        </p>
      </div>
    </section>
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
