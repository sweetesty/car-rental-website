import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Quote, ShieldCheck, Star, Wallet } from 'lucide-react'
import { Logo } from './Logo'

const POINTS = [
  { icon: ShieldCheck, text: 'KYC-verified owners and inspected cars' },
  { icon: Wallet, text: 'Payments held in escrow until handover' },
  { icon: Star, text: '4.8 average rating across 2,400 trips' },
]

/** Split layout used by sign-in and registration. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Logo />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="text-dim mt-2 text-pretty">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8">{footer}</div>}
        </motion.div>
      </div>

      <aside className="bg-brand-900 dark:bg-brand-950 relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <Quote className="text-accent-300 size-9" />
          <p className="mt-5 max-w-md text-2xl leading-snug font-bold text-balance text-white">
            My two cars used to sit idle between contracts. On AUTOGO they earn about ₦600,000 a
            month.
          </p>
          <p className="text-brand-200 mt-4 text-sm">Chidi Okonkwo · Car owner, Lagos</p>

          <ul className="mt-10 space-y-3 border-t border-white/15 pt-8">
            {POINTS.map((point) => (
              <li key={point.text} className="text-brand-100 flex items-center gap-3 text-sm">
                <point.icon className="text-accent-300 size-4.5 shrink-0" />
                {point.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
