import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Compass,
  Fingerprint,
  Gauge,
  Lock,
  Mail,
  MapPinned,
  MessageSquare,
  Phone,
  Radar,
  ScrollText,
  ShieldCheck,
  Siren,
} from 'lucide-react'
import { Card, SectionHeading } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'
import { supportLink } from '@/lib/whatsapp'

const Page = ({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: React.ReactNode
}) => (
  <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto max-w-2xl text-center">
      <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">{title}</h1>
      <p className="text-dim mt-4 text-lg leading-relaxed text-pretty">{intro}</p>
    </header>
    <div className="mt-14">{children}</div>
  </div>
)

/* ── Trust & safety ─────────────────────────────────────────────── */

const SAFETY = [
  {
    icon: Fingerprint,
    title: 'Identity verification',
    body: 'Every account submits a government ID and a live selfie. Owners additionally prove ownership of each car they list.',
  },
  {
    icon: ScrollText,
    title: 'Licence checks',
    body: "We verify the driver's licence number and expiry on every booking, and block licences that expire mid-rental.",
  },
  {
    icon: ShieldCheck,
    title: 'Admin approval workflow',
    body: 'No listing goes public until a member of our team has checked the photos, papers and insurance certificate.',
  },
  {
    icon: Lock,
    title: 'Encrypted payments',
    body: 'Card details never touch our servers. Payments run through PCI-DSS certified providers over TLS 1.3.',
  },
  {
    icon: AlertTriangle,
    title: 'Fraud detection',
    body: 'Unusual booking patterns, mismatched documents and repeated failed payments are flagged for manual review.',
  },
  {
    icon: ScrollText,
    title: 'Booking audit logs',
    body: 'Every status change, refund and admin action is written to an immutable log with an actor and a timestamp.',
  },
]

const GPS = [
  { icon: MapPinned, title: 'Live location', body: 'See exactly where the vehicle is, refreshed every 30 seconds.' },
  { icon: Compass, title: 'Route history', body: 'Replay the full trip path for any completed booking.' },
  { icon: Gauge, title: 'Speed monitoring', body: 'Alerts when the car exceeds the limit you set.' },
  { icon: Radar, title: 'Geofencing', body: 'Draw a boundary and get notified the moment the car leaves it.' },
  { icon: Siren, title: 'Theft alerts', body: 'Instant alerts on unauthorised movement, with recovery support.' },
  { icon: ScrollText, title: 'Trip logs', body: 'Automatic start and end records for every journey.' },
]

export function TrustAndSafety() {
  return (
    <Page
      title="Trust & safety"
      intro="A marketplace only works if both sides feel safe. Here's what sits behind every booking on AUTOGO."
    >
      <section>
        <SectionHeading eyebrow="Security" title="How we protect both sides" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map((item) => (
            <Card key={item.title} className="p-6">
              <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-10 place-items-center rounded-xl">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold tracking-tight">{item.title}</h3>
              <p className="text-dim mt-2 text-sm leading-relaxed text-pretty">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading
          eyebrow="GPS tracking"
          title="Know where your car is, always"
          subtitle="Owners can fit a supported tracker and connect it to their listing. Renters see that a car is tracked before they book — nothing is hidden."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GPS.map((item) => (
            <Card key={item.title} className="p-6">
              <item.icon className="text-brand-600 dark:text-brand-400 size-5.5" />
              <h3 className="mt-4 font-bold tracking-tight">{item.title}</h3>
              <p className="text-dim mt-2 text-sm leading-relaxed">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="surface-sunken rounded-card mt-20 border p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong on a trip?</h2>
        <p className="text-dim mx-auto mt-3 max-w-lg text-pretty">
          Our team is on call from 7am to 11pm every day, including public holidays.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton to="/support">Contact support</LinkButton>
          <a
            href="tel:+2348000000000"
            className="surface-raised inline-flex h-11 items-center gap-2 rounded-lg border px-5 text-sm font-semibold"
          >
            <Phone className="size-4" />
            +234 800 000 0000
          </a>
        </div>
      </section>
    </Page>
  )
}

/* ── Support ────────────────────────────────────────────────────── */

const CHANNELS = [
  {
    icon: Phone,
    title: 'Call us',
    body: '7am–11pm, seven days a week',
    action: '+234 800 000 0000',
    href: 'tel:+2348000000000',
  },
  {
    icon: Mail,
    title: 'Email',
    body: 'We reply within 4 working hours',
    action: 'support@autogo.ng',
    href: 'mailto:support@autogo.ng',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    body: 'Fastest for anything mid-trip',
    action: 'Chat with us',
    href: supportLink(),
  },
]

const TOPICS = [
  { title: 'Booking and payments', body: 'Changing dates, refunds, receipts and failed payments.' },
  { title: 'Listing a car', body: 'Approval requirements, photos, pricing and calendars.' },
  { title: 'During a trip', body: 'Breakdowns, accidents, extensions and late returns.' },
  { title: 'Account and verification', body: 'KYC documents, suspensions and password resets.' },
]

export function Support() {
  return (
    <Page
      title="Help centre"
      intro="Real people, on the phone, during working hours and well past them."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {CHANNELS.map((channel) => (
          <Card key={channel.title} className="p-6">
            <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 grid size-10 place-items-center rounded-xl">
              <channel.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-bold tracking-tight">{channel.title}</h3>
            <p className="text-dim mt-1.5 text-sm">{channel.body}</p>
            <a
              href={channel.href}
              className="text-brand-700 dark:text-brand-300 mt-3 inline-block text-sm font-bold"
            >
              {channel.action} →
            </a>
          </Card>
        ))}
      </div>

      <section className="mt-16">
        <SectionHeading title="Browse by topic" />
        <div className="grid gap-5 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <Card key={topic.title} className="p-6">
              <h3 className="font-bold tracking-tight">{topic.title}</h3>
              <p className="text-dim mt-1.5 text-sm leading-relaxed">{topic.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-dim mt-12 text-center text-sm">
        Looking for the basics?{' '}
        <Link to="/how-it-works" className="text-brand-700 dark:text-brand-300 font-semibold">
          Read how AUTOGO works
        </Link>
        .
      </p>
    </Page>
  )
}

/* ── Legal ──────────────────────────────────────────────────────── */

const TERMS = [
  {
    heading: '1. Who we are',
    body: 'AUTOGO Technologies Ltd operates a marketplace connecting vehicle owners with renters in Nigeria. We are not the owner of any vehicle listed, and we are not a party to the rental agreement between an owner and a renter.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 to hold an account and at least the minimum driver age stated on a listing to book it. You must hold a valid licence, held for at least two years, that remains valid for the whole rental period.',
  },
  {
    heading: '3. Bookings and payment',
    body: 'A booking is formed when payment is authorised and the owner confirms. Prices shown include the rental subtotal, our service fee and insurance. A refundable security deposit is authorised separately at handover.',
  },
  {
    heading: '4. Cancellations',
    body: 'The cancellation window is set per listing and shown before you pay. Cancelling inside the window is refunded in full; outside it, the first rental day is non-refundable. Owners who cancel confirmed bookings without cause may be removed from the platform.',
  },
  {
    heading: '5. Owner obligations',
    body: 'Owners warrant that each listed vehicle is legally owned or lawfully controlled by them, roadworthy, correctly registered, and covered by a valid comprehensive insurance policy for the whole listed period.',
  },
  {
    heading: '6. Renter obligations',
    body: 'Renters must return the vehicle at the agreed time and place, in the condition it was collected, and only allow named drivers to operate it. Traffic offences, tolls and fines incurred during the rental remain the renter’s responsibility.',
  },
  {
    heading: '7. Liability',
    body: 'Our liability is limited to the total fees you paid us for the booking in question. Nothing in these terms excludes liability that cannot lawfully be excluded.',
  },
  {
    heading: '8. Changes',
    body: 'We may update these terms. Material changes will be notified by email at least 14 days before they take effect.',
  },
]

const PRIVACY = [
  {
    heading: 'What we collect',
    body: 'Account details (name, email, phone), identity documents submitted for KYC, driver’s licence details, booking and payment records, device and usage data, and — where a car is tracked — vehicle location data for the duration of a booking.',
  },
  {
    heading: 'Why we collect it',
    body: 'To operate the marketplace: verifying identity, matching renters with owners, processing payments, preventing fraud, resolving disputes, and meeting our legal obligations under the Nigeria Data Protection Act.',
  },
  {
    heading: 'Who we share it with',
    body: 'Payment processors (Paystack, Flutterwave), identity verification providers, insurers on a claim, and law enforcement where legally required. We do not sell personal data.',
  },
  {
    heading: 'Location data',
    body: 'GPS data is recorded only while a booking is active, is visible to the vehicle owner and the renter on that booking, and is deleted 90 days after the trip ends unless retained for an open dispute.',
  },
  {
    heading: 'How long we keep it',
    body: 'Account data for as long as your account is open, then 6 years for financial records as required by law. Identity documents are deleted 12 months after verification.',
  },
  {
    heading: 'Your rights',
    body: 'You can request a copy of your data, correct it, or ask us to delete it by emailing privacy@autogo.ng. We respond within 30 days.',
  },
]

function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string
  intro: string
  sections: { heading: string; body: string }[]
}) {
  return (
    <Page title={title} intro={intro}>
      <p className="text-dim mb-8 text-sm">Last updated 1 August 2026.</p>
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold tracking-tight">{section.heading}</h2>
            <p className="text-dim mt-2 leading-relaxed text-pretty">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="text-dim mt-12 text-sm">
        Questions? Email{' '}
        <a href="mailto:legal@autogo.ng" className="text-brand-700 dark:text-brand-300 font-semibold">
          legal@autogo.ng
        </a>
        .
      </p>
    </Page>
  )
}

export const Terms = () => (
  <LegalPage
    title="Terms of service"
    intro="The agreement between you and AUTOGO Technologies Ltd."
    sections={TERMS}
  />
)

export const Privacy = () => (
  <LegalPage
    title="Privacy policy"
    intro="What we collect, why we collect it, and what you can do about it."
    sections={PRIVACY}
  />
)
