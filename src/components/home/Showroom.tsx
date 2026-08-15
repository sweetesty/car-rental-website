import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarDays,
  KeyRound,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { SlideItem, Slider } from '@/components/ui/Slider'
import { EASE } from './motion'
import { addDays, cx, money, todayISO } from '@/lib/format'
import { CITIES } from '@/lib/catalog'
import type { Car } from '@/lib/types'

/**
 * Showroom landing layout: full-bleed monochrome photography, generous
 * whitespace, flat cards — and red reserved for the few things you can press.
 */

/**
 * Failure-safe scroll entrance. `initial: false` + keyframes means the hidden
 * state only ever exists DURING the animation — if IntersectionObserver never
 * fires (odd embed, ancient browser), content is simply visible with no
 * entrance, rather than stuck at opacity 0 forever.
 */
const fadeUp = {
  initial: false as const,
  whileInView: { opacity: [0, 1], y: [24, 0] },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.6, ease: EASE },
}

/* ── Hero: dark showroom shot with the search strip overlapping it ── */

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1920&q=75'

export function ShowroomHero() {
  return (
    <section className="relative">
      <div className="relative h-[30rem] overflow-hidden sm:h-[36rem]">
        <img
          src={HERO_IMAGE}
          alt="A car in a dark showroom"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        {/* Darkened top and bottom so both text blocks sit on quiet ground. */}
        <div
          aria-hidden
          className="from-ink-950/85 via-ink-950/25 to-ink-950/45 absolute inset-0 bg-gradient-to-t"
        />

        <div className="absolute inset-x-0 bottom-0 pb-28 sm:pb-32">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="max-w-md text-5xl leading-[1.02] font-black tracking-[-0.04em] text-white sm:text-6xl"
            >
              Premium car rental
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="max-w-xs text-sm leading-relaxed text-white/70"
            >
              We want hiring a car to be stress-free — verified owners, honest pricing, and
              pick-up points across the city. Search, book, drive.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Search strip riding the hero's bottom edge. */}
      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 sm:px-6">
        <RateSearch />
      </div>
    </section>
  )
}

/* ── Rate tabs + search fields ── */

const RATES = [
  { id: 'daily', label: 'Daily', days: 1 },
  { id: 'weekly', label: 'Weekly', days: 7 },
  { id: 'monthly', label: 'Monthly', days: 30 },
] as const

type RateId = (typeof RATES)[number]['id']

function RateSearch() {
  const navigate = useNavigate()
  const [rate, setRate] = useState<RateId>('daily')
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState(addDays(todayISO(), 1))

  // The tab picks the rental length; the range lands pre-filled on /cars.
  const days = RATES.find((r) => r.id === rate)?.days ?? 1
  const endDate = addDays(startDate, days - 1)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    params.set('startDate', startDate)
    params.set('endDate', endDate)
    navigate(`/cars?${params}`)
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
      className="surface-raised rounded-2xl border shadow-lift-lg"
    >
      <div className="flex justify-center border-b p-2">
        <div className="surface-sunken flex rounded-full p-1" role="tablist" aria-label="Rate type">
          {RATES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={rate === r.id}
              onClick={() => setRate(r.id)}
              className={cx(
                'rounded-full px-5 py-1.5 text-sm font-semibold transition-colors',
                rate === r.id
                  ? 'bg-accent-600 text-white'
                  : 'text-dim hover:text-ink-950 dark:hover:text-white',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-center gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:gap-0 lg:divide-x lg:divide-[var(--border-subtle)]">
        <Field icon={MapPin} label="Pick-up city">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Pick-up city"
            className="w-full cursor-pointer bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">Anywhere in Nigeria</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={CalendarDays} label="Pick-up date">
          <input
            type="date"
            value={startDate}
            min={todayISO()}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Pick-up date"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </Field>

        <Field icon={CalendarDays} label="Return date">
          {/* Derived from the rate tab, so it can't disagree with it. */}
          <p className="text-sm font-semibold">{endDate}</p>
        </Field>

        <div className="p-1 lg:pl-3">
          <Button type="submit" variant="accent" fullWidth className="lg:w-auto lg:px-8">
            <Search className="size-4" />
            Search
          </Button>
        </div>
      </div>
    </motion.form>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon className="size-4.5 shrink-0" strokeWidth={1.7} />
      <div className="min-w-0 flex-1">
        <p className="text-dim text-[0.625rem] font-bold tracking-[0.14em] uppercase">{label}</p>
        {children}
      </div>
    </div>
  )
}

/* ── Car category: brands derived from the live fleet ── */

const BODY_LABELS: Record<Car['bodyType'], string> = {
  suv: 'SUV',
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  pickup: 'Pickup',
  van: 'Van & bus',
  coupe: 'Coupé',
}

/**
 * Categories are body types, not brands.
 *
 * A tile labelled "Toyota" is only honest if its photo is genuinely a Toyota,
 * which no stock image can guarantee. A tile labelled "SUV" just needs a photo
 * of an SUV — and since each car records its own body type, the picture is
 * drawn from a car that IS one. Body type is also what renters actually filter
 * by ("I need seven seats"), so it earns its place twice over.
 */
export function CarCategory({ cars }: { cars: Car[] }) {
  const categories = useMemo(() => {
    const grouped = new Map<Car['bodyType'], { count: number; image: string }>()

    for (const car of cars) {
      if (car.status !== 'approved' || !car.images[0]) continue
      const seen = grouped.get(car.bodyType)
      grouped.set(car.bodyType, {
        count: (seen?.count ?? 0) + 1,
        image: seen?.image ?? car.images[0],
      })
    }

    return [...grouped.entries()]
      .map(([bodyType, data]) => ({ bodyType, label: BODY_LABELS[bodyType], ...data }))
      .sort((a, b) => b.count - a.count)
  }, [cars])

  if (categories.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <Slider
        label="car categories"
        title={
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">Car category</h2>
            <p className="text-dim mt-2">Find the shape of car you need.</p>
          </motion.div>
        }
        action={
          <LinkButton to="/cars" variant="secondary" size="sm" className="rounded-full">
            All cars
            <ArrowUpRight className="size-3.5" />
          </LinkButton>
        }
      >
        {categories.map((cat, i) => (
          <SlideItem key={cat.bodyType}>
            <Link
              to={`/cars?bodyType=${cat.bodyType}`}
              className="group relative block aspect-4/5 overflow-hidden rounded-xl"
            >
              {/* Full colour always: greyscale-until-hover hid the actual cars,
                  and on touch devices there is no hover to reveal them. */}
              <img
                src={cat.image}
                alt={`${cat.label} cars for hire`}
                loading={i < 4 ? 'eager' : 'lazy'}
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="from-ink-950/80 absolute inset-0 bg-gradient-to-b via-ink-950/10 to-ink-950/50"
              />

              {/* Name only — no price on the picture. */}
              <div className="absolute top-4 left-4 max-w-[85%]">
                <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  {cat.label}
                </h3>
              </div>

              <span
                className={cx(
                  'absolute right-3 bottom-3 grid size-9 place-items-center rounded-full text-white transition-[background-color,translate] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                  i === 0
                    ? 'bg-accent-600'
                    : 'border border-white/50 backdrop-blur group-hover:bg-accent-600 group-hover:border-transparent',
                )}
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </SlideItem>
        ))}
      </Slider>
    </section>
  )
}

/* ── Trend vehicles ── */

export function TrendVehicles({ cars }: { cars: Car[] }) {
  if (cars.length === 0) return null

  return (
    <section className="surface-sunken border-y">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Slider
          label="trending vehicles"
          title={
            <motion.div {...fadeUp}>
              <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
                Trend vehicles
              </h2>
              <p className="text-dim mt-2">A fresh mix from across the fleet.</p>
            </motion.div>
          }
          action={
            <LinkButton to="/cars" variant="secondary" size="sm" className="rounded-full">
              View all
              <ArrowUpRight className="size-3.5" />
            </LinkButton>
          }
        >
          {cars.map((car, i) => (
            <SlideItem key={car.id}>
              <article
                className={cx(
                  'flex h-full flex-col rounded-xl border p-5',
                  i === 0 ? 'bg-brand-50 dark:bg-brand-950/40' : 'surface-raised',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold tracking-tight">
                    {car.brand} {car.model}
                  </h3>
                  <Rating value={car.rating} />
                </div>
                <p className="text-dim mt-0.5 text-xs">
                  {car.year} · {car.seats} seats · {car.city}
                </p>

                <Link
                  to={`/cars/${car.id}`}
                  className="group my-5 block overflow-hidden rounded-lg"
                >
                  <img
                    src={car.images[0]}
                    alt={car.name}
                    loading={i < 4 ? 'eager' : 'lazy'}
                    className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-lg font-black tracking-tight">
                    {money(car.pricePerDay)}
                    <span className="text-dim text-xs font-medium">/day</span>
                  </p>
                  <LinkButton
                    to={`/cars/${car.id}`}
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                  >
                    Book now
                  </LinkButton>
                </div>
              </article>
            </SlideItem>
          ))}
        </Slider>
      </div>
    </section>
  )
}

/* ── Perks strip: dark band, one hot cell ── */

const PERKS = [
  { icon: KeyRound, text: 'Seamless booking — keys in your hand the same day' },
  { icon: ShieldCheck, text: 'Every owner verified, every trip fully insured' },
  { icon: RefreshCcw, text: 'Change or cancel up to 48 hours before pick-up', hot: true },
  { icon: Wallet, text: 'No hidden fees — the price you see is what you pay' },
]

export function PerksStrip() {
  return (
    <section className="bg-ink-950 dark:bg-ink-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((perk) => (
          <div
            key={perk.text}
            className={cx(
              'flex flex-col items-start gap-4 border-b border-white/10 p-8 last:border-b-0 sm:border-b-0 sm:border-l sm:first:border-l-0',
              perk.hot && 'bg-accent-600',
            )}
          >
            <perk.icon className="size-7 text-white" strokeWidth={1.4} />
            <p className={cx('text-sm leading-relaxed', perk.hot ? 'text-white' : 'text-white/65')}>
              {perk.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Promo banner: the Tesla in the fleet, with the red discount tag ── */

export function PromoBanner({ cars }: { cars: Car[] }) {
  const tesla = cars.find((c) => c.brand === 'Tesla' && c.status === 'approved')
  if (!tesla) return null

  return (
    // -mb-24 cancels the footer's mt-24, so the dark band meets it flush.
    <section className="bg-ink-950 dark:bg-ink-900 -mb-24 border-t border-white/10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1.3fr_auto] lg:px-8 lg:py-20">
        <motion.div {...fadeUp}>
          <h2 className="text-4xl leading-[1.05] font-black tracking-[-0.035em] text-balance text-white sm:text-5xl">
            Book a Tesla with a big discount
          </h2>
          <LinkButton to={`/cars/${tesla.id}`} variant="accent" className="mt-7">
            Book now
          </LinkButton>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}>
          <img
            src={tesla.images[0]}
            alt={tesla.name}
            loading="lazy"
            className="aspect-16/9 w-full rounded-2xl object-cover"
          />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="bg-accent-600 w-full rounded-2xl p-6 text-white lg:w-44"
        >
          <p className="text-5xl font-black tracking-tight">20%</p>
          <p className="mt-2 text-sm leading-snug text-white/85">
            off weekday trips on {tesla.name}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
