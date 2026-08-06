import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Banknote,
  CalendarX2,
  Check,
  Headphones,
  MapPinned,
  Minus,
  ShieldCheck,
} from 'lucide-react'
import { FinalCta } from '@/components/home/HomeSections'
import { EASE, Tally } from '@/components/home/motion'
import { LinkButton, ArrowTip } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { cx } from '@/lib/format'

/**
 * The argument for AUTOGO, made properly: not adjectives, but a head-to-head
 * with the rental counter, the mechanism behind each promise, and the numbers.
 */

/* ── The comparison that sells the model ── */

const COMPARISON: { row: string; autogo: string; counter: string; win: boolean }[] = [
  { row: 'Booking confirmed in', autogo: 'Under an hour', counter: '1–3 days of calls', win: true },
  { row: 'The price you see', autogo: 'Is the price you pay', counter: 'Plus "extras" at pickup', win: true },
  { row: 'Deposit returned', autogo: 'Within 3 working days', counter: 'Weeks, if you chase it', win: true },
  { row: 'Insurance', autogo: 'Included, every trip', counter: 'Sold as an upsell', win: true },
  { row: 'Choice of cars', autogo: 'Real fleet, real photos', counter: '"Or similar"', win: true },
  { row: 'Cancellation', autogo: 'Free up to 48hrs', counter: 'Ask the manager', win: true },
  { row: 'Support hours', autogo: '7am–11pm, every day', counter: 'Office hours', win: true },
]

/* ── Each promise, with its mechanism ── */

const PROMISES = [
  {
    icon: BadgeCheck,
    title: 'Every owner is verified',
    body: 'Government ID, a live selfie check, and proof of ownership for every listed car. Our team inspects the papers and photos before a listing ever goes public — no ghost cars, no bait pricing.',
  },
  {
    icon: ShieldCheck,
    title: 'Every trip is insured',
    body: 'Comprehensive cover with a collision damage waiver is bundled into the price of every booking, for the named driver, for the full rental window. The certificate is on the listing before you pay.',
  },
  {
    icon: Banknote,
    title: 'Money held in escrow',
    body: 'You are charged at booking, but the owner is only paid after the handover happens. If the car never shows up, neither does their money — and yours comes straight back.',
  },
  {
    icon: MapPinned,
    title: 'GPS on tracked cars',
    body: 'Owners can fit a live tracker: location, route history, geofence and theft alerts, visible to both sides of the booking. Renters see the GPS badge before they commit.',
  },
  {
    icon: CalendarX2,
    title: 'Cancellation that costs nothing',
    body: 'Cancel inside the listing’s free window — 48 hours on most cars — and the refund is automatic, in full, with no phone call required.',
  },
  {
    icon: Headphones,
    title: 'Humans who pick up',
    body: 'Phone, chat and WhatsApp from 7am to 11pm, every day including public holidays. Mid-trip breakdowns get recovery arranged by us, not by you.',
  },
]

const STATS = [
  { value: 2418, label: 'Trips completed', format: (n: number) => Math.round(n).toLocaleString() },
  { value: 4.8, label: 'Average trip rating', format: (n: number) => n.toFixed(1) },
  { value: 96, label: 'Bookings confirmed within 1 hour', format: (n: number) => `${Math.round(n)}%` },
  { value: 1, label: 'Working day to owner payout', format: (n: number) => `${Math.round(n)}` },
]

// initial={false} + keyframes: if the observer never fires, content shows
// un-animated instead of staying hidden.
const fadeUp = {
  initial: false as const,
  whileInView: { opacity: [0, 1], y: [24, 0] },
  viewport: { once: true, margin: '-60px' as const },
}

export default function WhyAutogo() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Opening ── */}
        <header className="mx-auto max-w-3xl py-16 text-center lg:py-24">
          <p className="text-dim text-[0.6875rem] font-bold tracking-[0.22em] uppercase">
            Why AUTOGO
          </p>
          <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.0] font-black tracking-[-0.04em] text-balance">
            Car hire here is broken.
            <br />
            We rebuilt it around trust.
          </h1>
          <p className="text-dim mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty">
            Surprise charges at the counter, deposits that take a month to come back, "or similar"
            cars that are nothing like the photo. Everything AUTOGO does exists because one of
            those happened to someone on our team.
          </p>
        </header>

        {/* ── Head-to-head ── */}
        <section className="pb-20 lg:pb-28">
          <motion.div {...fadeUp} transition={{ duration: 0.6, ease: EASE }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-sm">
                <caption className="sr-only">AUTOGO compared with traditional car hire</caption>
                <thead>
                  <tr>
                    <th className="w-1/3 p-4" />
                    <th className="bg-accent-600 rounded-t-2xl p-4 text-center text-base font-black tracking-tight text-white">
                      AUTOGO
                    </th>
                    <th className="text-dim p-4 text-center text-base font-bold tracking-tight">
                      The rental counter
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.row}>
                      <th
                        scope="row"
                        className="text-dim border-b p-4 text-left font-medium first:border-t"
                      >
                        {row.row}
                      </th>
                      <td
                        className={cx(
                          'border-accent-600/30 bg-accent-600/5 border-x p-4 text-center font-bold',
                          i === COMPARISON.length - 1 && 'rounded-b-2xl border-b',
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Check className="text-accent-600 dark:text-accent-400 size-4 shrink-0" />
                          {row.autogo}
                        </span>
                      </td>
                      <td className="text-dim border-b p-4 text-center">
                        <span className="inline-flex items-center gap-2">
                          <Minus className="size-4 shrink-0 opacity-50" />
                          {row.counter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>
      </div>

      {/* ── Numbers band ── */}
      <div className="bg-ink-950 dark:bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-20">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-t border-white/15 pt-5">
              <p className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                <Tally to={stat.value} format={stat.format} />
              </p>
              <p className="mt-2 text-sm leading-snug text-white/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── The promises, with mechanisms ── */}
        <section className="py-20 lg:py-28">
          <div className="mb-14 max-w-xl">
            <p className="text-dim text-[0.6875rem] font-bold tracking-[0.2em] uppercase">
              How we keep it
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.05] font-black tracking-[-0.035em] text-balance">
              Promises are cheap. Here's the machinery behind ours.
            </h2>
          </div>

          <div className="grid gap-x-16 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: EASE }}
                className="border-t pt-6"
              >
                <item.icon className="size-6" strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="text-dim mt-2 text-sm leading-relaxed text-pretty">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── One voice ── */}
        <section className="pb-20 lg:pb-28">
          <motion.figure
            {...fadeUp}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="flex justify-center">
              <Rating value={5} size="md" />
            </div>
            <blockquote className="mt-6 text-[clamp(1.375rem,3vw,2rem)] leading-[1.3] font-bold tracking-[-0.02em] text-balance">
              "The GPS tracking gave my family real peace of mind on a long inter-state drive.
              Support answered on the first ring."
            </blockquote>
            <figcaption className="text-dim mt-5 text-sm">
              <span className="text-ink-950 font-semibold dark:text-white">Fatima Sani</span> ·
              Renter, Abuja
            </figcaption>
            <div className="mt-10">
              <LinkButton to="/cars" size="lg">
                Browse the fleet
                <ArrowTip />
              </LinkButton>
            </div>
          </motion.figure>
        </section>
      </div>

      <FinalCta />
    </>
  )
}
