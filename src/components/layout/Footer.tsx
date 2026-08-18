import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from './Logo'
import { useToast } from '@/lib/hooks'
import { SUPPORT_DISPLAY, SUPPORT_TEL } from '@/lib/whatsapp'

/* Brand marks are hand-rolled — lucide dropped third-party logos in v1. */
const XMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z" />
  </svg>
)

const InstagramMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

const FacebookMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.19 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.25 22 17.08 22 12.06Z" />
  </svg>
)

const COLUMNS = [
  {
    title: 'Rent',
    links: [
      { to: '/cars', label: 'Browse all cars' },
      { to: '/cars?bodyType=suv', label: 'SUVs' },
      { to: '/cars?bodyType=sedan', label: 'Sedans' },
      { to: '/cars?city=Lagos', label: 'Cars in Lagos' },
      { to: '/cars?city=Abuja', label: 'Cars in Abuja' },
    ],
  },
  {
    title: 'Host',
    links: [
      { to: '/become-a-host', label: 'List your car' },
      { to: '/owner', label: 'Owner dashboard' },
      { to: '/how-it-works', label: 'How payouts work' },
      { to: '/trust-and-safety', label: 'Insurance & cover' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/why-autogo', label: 'Why AUTOGO' },
      { to: '/how-it-works', label: 'How it works' },
      { to: '/trust-and-safety', label: 'Trust & safety' },
      { to: '/support', label: 'Help centre' },
      { to: '/terms', label: 'Terms of service' },
      { to: '/privacy', label: 'Privacy policy' },
    ],
  },
]

const SOCIALS = [
  { href: 'https://twitter.com', label: 'AUTOGO on X', icon: XMark },
  {
    href: 'https://www.instagram.com/auto_go_car_rental',
    label: 'AUTOGO on Instagram',
    icon: InstagramMark,
  },
  { href: 'https://facebook.com', label: 'AUTOGO on Facebook', icon: FacebookMark },
]

export function Footer() {
  const toast = useToast()

  const subscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    toast("You're on the list — one email a month, no spam.")
    e.currentTarget.reset()
  }

  return (
    <footer className="surface-sunken mt-24 border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            {/* The emblem gets room to breathe here — in the header it would
                render at 36px, where the ribbon text turns to mush. */}
            <Logo variant="badge" size={104} />
            <p className="text-dim mt-4 max-w-xs text-sm leading-relaxed text-pretty">
              Nigeria's peer-to-peer car rental marketplace. Rent from verified owners near you, or
              turn your idle car into monthly income.
            </p>

            <form onSubmit={subscribe} className="mt-6 flex max-w-xs">
              <label htmlFor="newsletter-email" className="sr-only">
                Subscribe to the newsletter
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Email address"
                className="surface-raised h-11 min-w-0 flex-1 rounded-l-lg border border-r-0 px-3.5 text-sm outline-none focus:border-accent-500"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-accent-600 hover:bg-accent-500 grid h-11 w-12 shrink-0 place-items-center rounded-r-lg text-white transition-colors"
              >
                <ArrowRight className="size-4" />
              </button>
            </form>
            <ul className="text-dim mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0" />
                52 Nile Street, Maitama, Abuja
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0" />
                <a href={SUPPORT_TEL} className="hover:text-brand-600">
                  {SUPPORT_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0" />
                <a href="mailto:support@autogo.ng" className="hover:text-brand-600">
                  support@autogo.ng
                </a>
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-bold tracking-wide uppercase">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-dim hover:text-brand-600 dark:hover:text-brand-400 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-dim text-sm">
            © {new Date().getFullYear()} AUTOGO Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noreferrer noopener"
                className="text-dim hover:text-brand-600 dark:hover:text-brand-400 rounded-lg p-2 transition-colors"
              >
                <s.icon className="size-4.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
