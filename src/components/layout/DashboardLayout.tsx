import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  CalendarRange,
  CarFront,
  CreditCard,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Header } from './Header'
import { Avatar } from '@/components/ui/Misc'
import { VerificationBadge } from '@/components/ui/Badge'
import { useAuth, useLockBodyScroll } from '@/lib/hooks'
import { cx, titleCase } from '@/lib/format'
import type { Role } from '@/lib/types'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  customer: [
    { to: '/account', label: 'My bookings', icon: LayoutDashboard, end: true },
    { to: '/account/reviews', label: 'My reviews', icon: Star },
    { to: '/account/payments', label: 'Payments', icon: Receipt },
    { to: '/account/profile', label: 'Profile & KYC', icon: Settings },
  ],
  owner: [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/owner/cars', label: 'My cars', icon: CarFront },
    { to: '/owner/cars/new', label: 'List a car', icon: PlusCircle },
    { to: '/owner/bookings', label: 'Booking requests', icon: CalendarRange },
    { to: '/owner/calendar', label: 'Availability', icon: CalendarRange },
    { to: '/owner/earnings', label: 'Earnings & payouts', icon: Wallet },
    { to: '/account/profile', label: 'Profile & KYC', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: 'Analytics', icon: BarChart3, end: true },
    { to: '/admin/cars', label: 'Car approvals', icon: CarFront },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarRange },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  ],
}

export function DashboardLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useLockBodyScroll(open)
  useEffect(() => setOpen(false), [pathname])

  if (!user) return null
  const items = NAV_BY_ROLE[user.role]

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="surface-sunken rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="text-dim truncate text-xs">{titleCase(user.role)}</p>
          </div>
        </div>
        <div className="mt-3">
          <VerificationBadge status={user.verification} />
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                  : 'text-dim hover:surface-sunken hover:text-ink-950 dark:hover:text-white',
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user.verification !== 'verified' && (
        <div className="bg-brand-50 dark:bg-brand-950 mt-4 rounded-xl p-4">
          <ShieldCheck className="text-brand-700 dark:text-brand-300 size-5" />
          <p className="mt-2 text-sm font-bold">Finish verification</p>
          <p className="text-dim mt-1 text-xs leading-relaxed">
            Verified accounts get faster confirmations and higher booking limits.
          </p>
          <NavLink
            to="/account/profile"
            className="text-brand-700 dark:text-brand-300 mt-2.5 inline-block text-xs font-bold"
          >
            Verify now →
          </NavLink>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">{sidebar}</div>
        </aside>

        <main className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="surface-raised mb-5 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold lg:hidden"
          >
            <Menu className="size-4" />
            Dashboard menu
          </button>
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-90 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="bg-ink-950/60 absolute inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="surface absolute inset-y-0 left-0 w-[min(18rem,85vw)] overflow-y-auto p-4"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="hover:surface-sunken mb-3 ml-auto block rounded-lg p-1.5"
              >
                <X className="size-5" />
              </button>
              {sidebar}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Consistent page header inside every dashboard screen. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-dim mt-1.5 text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
