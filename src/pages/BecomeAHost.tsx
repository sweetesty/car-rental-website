import { useMemo, useState } from 'react'
import { CalendarCheck, Camera, FileCheck2, ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import { Card, Reveal, SectionHeading } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { money } from '@/lib/format'
import { BODY_TYPES, CITIES } from '@/lib/catalog'
import { useAuth } from '@/lib/hooks'

/** Rough daily rates by body type, before the city multiplier. */
const BASE_RATE: Record<string, number> = {
  hatchback: 25_000,
  sedan: 42_000,
  coupe: 70_000,
  suv: 88_000,
  pickup: 72_000,
  van: 55_000,
}

const CITY_MULTIPLIER: Record<string, number> = {
  Lagos: 1.15,
  Abuja: 1.1,
  'Port Harcourt': 1,
  Ibadan: 0.85,
  Kano: 0.8,
  Enugu: 0.85,
  'Benin City': 0.8,
  Kaduna: 0.78,
}

const REQUIREMENTS = [
  { icon: FileCheck2, title: 'Valid papers', body: 'Vehicle licence, roadworthiness certificate and proof of ownership.' },
  { icon: ShieldCheck, title: 'Comprehensive insurance', body: 'Active policy covering third party, fire, theft and collision.' },
  { icon: Camera, title: 'Six clear photos', body: 'Exterior from four angles, plus front and rear interior.' },
  { icon: CalendarCheck, title: 'Honest availability', body: 'Keep your calendar current so renters never get a surprise.' },
]

export default function BecomeAHost() {
  const { user } = useAuth()
  const [bodyType, setBodyType] = useState('sedan')
  const [city, setCity] = useState('Lagos')
  const [daysPerMonth, setDaysPerMonth] = useState(12)

  const estimate = useMemo(() => {
    const daily = Math.round(BASE_RATE[bodyType] * (CITY_MULTIPLIER[city] ?? 1))
    const gross = daily * daysPerMonth
    const fee = Math.round(gross * 0.1)
    return { daily, gross, fee, net: gross - fee, yearly: (gross - fee) * 12 }
  }, [bodyType, city, daysPerMonth])

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <span className="bg-accent-500 size-1.5 rounded-full" />
            Free to list · no subscription
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-balance sm:text-5xl">
            Turn your idle car into monthly income.
          </h1>
          <p className="text-dim mt-5 max-w-lg text-lg leading-relaxed text-pretty">
            Set your own price and availability, approve only the bookings you want, and get paid
            the working day after each trip. Every renter is identity-verified before they can book.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to={user?.role === 'owner' ? '/owner/cars/new' : '/register'} size="lg">
              {user?.role === 'owner' ? 'List a car' : 'Start earning'}
            </LinkButton>
            <LinkButton to="/how-it-works" size="lg" variant="secondary">
              How payouts work
            </LinkButton>
          </div>
        </div>

        <img
          src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1100&q=75"
          alt="A car owner handing over keys outside a house"
          className="rounded-card aspect-4/3 w-full object-cover shadow-lift-lg"
        />
      </header>

      <section className="mt-20">
        <SectionHeading
          eyebrow="Earnings calculator"
          title="What could your car earn?"
          subtitle="A rough estimate based on what similar cars charge in your city."
        />

        <Card className="p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Select
              label="Car type"
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              options={BODY_TYPES}
            />
            <Select
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
            <div>
              <label htmlFor="days" className="text-sm font-medium">
                Days rented per month: <span className="font-bold">{daysPerMonth}</span>
              </label>
              <input
                id="days"
                type="range"
                min={1}
                max={28}
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                className="accent-brand-600 dark:accent-brand-400 mt-4 w-full cursor-pointer"
              />
              <div className="text-dim flex justify-between text-xs">
                <span>1 day</span>
                <span>28 days</span>
              </div>
            </div>

            <div className="bg-brand-900 dark:bg-brand-950 min-w-52 rounded-xl border border-brand-800 p-5 text-center">
              <p className="text-brand-200 text-xs font-bold tracking-wide uppercase">
                Estimated take-home
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-white tabular-nums">
                {money(estimate.net)}
              </p>
              <p className="text-brand-300 mt-1 text-xs">per month, after fees</p>
            </div>
          </div>

          <dl className="text-dim mt-6 grid gap-4 border-t pt-6 text-sm sm:grid-cols-4">
            <Line label="Suggested daily rate" value={money(estimate.daily)} />
            <Line label="Gross monthly" value={money(estimate.gross)} />
            <Line label="AUTOGO fee (10%)" value={`−${money(estimate.fee)}`} />
            <Line label="Annualised" value={money(estimate.yearly)} />
          </dl>

          <p className="text-dim mt-4 text-xs">
            Estimates only, based on average rates for similar cars. Actual earnings depend on your
            pricing, availability and reviews.
          </p>
        </Card>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="Requirements" title="What you need to list" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REQUIREMENTS.map((req, i) => (
            <Reveal key={req.title} delay={i * 0.06}>
              <Card className="h-full p-5">
                <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-10 place-items-center rounded-xl">
                  <req.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold tracking-tight">{req.title}</h3>
                <p className="text-dim mt-1.5 text-sm leading-relaxed">{req.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <Wallet className="text-brand-600 dark:text-brand-400 size-6" />
          <h3 className="mt-4 font-bold tracking-tight">Paid next working day</h3>
          <p className="text-dim mt-2 text-sm leading-relaxed">
            No waiting two weeks for a settlement run. The payout is queued as soon as the trip is
            marked complete.
          </p>
        </Card>
        <Card className="p-6">
          <ShieldCheck className="text-brand-600 dark:text-brand-400 size-6" />
          <h3 className="mt-4 font-bold tracking-tight">Protected on every trip</h3>
          <p className="text-dim mt-2 text-sm leading-relaxed">
            Renters pass KYC and licence checks. Comprehensive cover and a security deposit sit
            behind every booking.
          </p>
        </Card>
        <Card className="p-6">
          <TrendingUp className="text-brand-600 dark:text-brand-400 size-6" />
          <h3 className="mt-4 font-bold tracking-tight">You set the terms</h3>
          <p className="text-dim mt-2 text-sm leading-relaxed">
            Your price, your calendar, your mileage limits. Accept the bookings you want and decline
            the rest.
          </p>
        </Card>
      </section>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs">{label}</dt>
      <dd className="text-ink-950 dark:text-ink-50 mt-1 font-bold tabular-nums">{value}</dd>
    </div>
  )
}
