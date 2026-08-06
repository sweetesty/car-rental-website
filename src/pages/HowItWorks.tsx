import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  KeyRound,
  Search,
  ShieldCheck,
  Star,
  Upload,
  Wallet,
} from 'lucide-react'
import { Card, Reveal, SectionHeading } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'

const RENTER_STEPS = [
  { icon: Search, title: 'Search', body: 'Filter by city, dates, body type and budget.' },
  { icon: CalendarCheck, title: 'Book', body: 'Pick your dates — we check the owner’s calendar live.' },
  { icon: CreditCard, title: 'Pay', body: 'Card, transfer or wallet. Funds are held in escrow.' },
  { icon: KeyRound, title: 'Drive', body: 'Meet the owner, inspect together, and go.' },
  { icon: Star, title: 'Review', body: 'Rate the car and the handover after you return it.' },
]

const OWNER_STEPS = [
  { icon: Upload, title: 'List', body: 'Add photos, pricing and availability. Listing is free.' },
  { icon: BadgeCheck, title: 'Get approved', body: 'We check your documents and insurance within 24 hours.' },
  { icon: CalendarCheck, title: 'Accept bookings', body: 'Approve requests, or switch on instant booking.' },
  { icon: Wallet, title: 'Get paid', body: 'Payout lands the working day after each completed trip.' },
]

const FAQS = [
  {
    q: 'How is the total price calculated?',
    a: 'Rental days are priced at the best available tier — monthly first, then weekly, then daily — plus a flat 10% service fee and daily insurance. Nothing is added at pickup.',
  },
  {
    q: 'What happens if the car breaks down?',
    a: 'Call support on the number in your booking confirmation. We arrange recovery, and if the trip is cut short you are refunded for the unused days.',
  },
  {
    q: 'When do owners actually get paid?',
    a: 'The payout is queued the moment a trip is marked complete and settles into your bank account the next working day.',
  },
  {
    q: 'Can I cancel after booking?',
    a: 'Yes. Most cars offer free cancellation up to 48 hours before pickup. After that the first rental day is non-refundable. The exact window is on every listing.',
  },
  {
    q: 'Who is covered by the insurance?',
    a: 'The named driver on the booking, for the dates of the booking. Comprehensive cover with a collision damage waiver is included in every rental.',
  },
  {
    q: 'Do I need a Nigerian driver’s licence?',
    a: 'A valid Nigerian or international licence held for at least two years is required, and it must stay valid through the whole rental period.',
  },
]

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">
          How AUTOGO works
        </h1>
        <p className="text-dim mt-4 text-lg leading-relaxed text-pretty">
          A marketplace with two sides. Here's exactly what happens on each of them.
        </p>
      </header>

      <section className="mt-16">
        <SectionHeading eyebrow="For renters" title="Search to steering wheel in five steps" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {RENTER_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.06}>
              <li className="h-full">
                <Card className="h-full p-5">
                  <span className="bg-brand-600 dark:bg-brand-500 dark:text-ink-950 grid size-10 place-items-center rounded-xl text-white">
                    <step.icon className="size-5" />
                  </span>
                  <p className="text-dim mt-4 text-xs font-bold tracking-widest uppercase">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-bold tracking-tight">{step.title}</h3>
                  <p className="text-dim mt-1.5 text-sm leading-relaxed">{step.body}</p>
                </Card>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="For owners" title="From listing to payout in four" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OWNER_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.06}>
              <li className="h-full">
                <Card className="h-full p-5">
                  <span className="bg-accent-600 grid size-10 place-items-center rounded-xl text-white">
                    <step.icon className="size-5" />
                  </span>
                  <p className="text-dim mt-4 text-xs font-bold tracking-widest uppercase">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-bold tracking-tight">{step.title}</h3>
                  <p className="text-dim mt-1.5 text-sm leading-relaxed">{step.body}</p>
                </Card>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="Money" title="What everything costs" />
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-3xl font-black tracking-tight">10%</p>
            <p className="mt-2 font-bold">Service fee</p>
            <p className="text-dim mt-1.5 text-sm leading-relaxed">
              Charged on the rental subtotal. It covers payment processing, support and the
              guarantee fund.
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-black tracking-tight">₦3,500</p>
            <p className="mt-2 font-bold">Insurance, per day</p>
            <p className="text-dim mt-1.5 text-sm leading-relaxed">
              Comprehensive cover with a collision damage waiver, for the named driver on the
              booking.
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-black tracking-tight">₦0</p>
            <p className="mt-2 font-bold">To list a car</p>
            <p className="text-dim mt-1.5 text-sm leading-relaxed">
              No listing fee, no subscription, no minimum commitment. You only pay when you earn.
            </p>
          </Card>
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="FAQ" title="Questions people actually ask" />
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="surface-raised rounded-card group border p-5 open:shadow-lift"
            >
              <summary className="cursor-pointer list-none font-bold tracking-tight marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  {faq.q}
                  <span className="text-brand-600 dark:text-brand-400 shrink-0 transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="text-dim mt-3 text-sm leading-relaxed text-pretty">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="surface-sunken rounded-card mt-20 border p-8 text-center sm:p-12">
        <ShieldCheck className="text-brand-600 dark:text-brand-400 mx-auto size-10" />
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Ready when you are
        </h2>
        <p className="text-dim mx-auto mt-3 max-w-lg text-pretty">
          Book a car for this weekend, or list yours and take your first booking within 48 hours.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton to="/cars" size="lg">
            Find a car
          </LinkButton>
          <LinkButton to="/become-a-host" size="lg" variant="secondary">
            List your car
          </LinkButton>
        </div>
      </section>
    </div>
  )
}
