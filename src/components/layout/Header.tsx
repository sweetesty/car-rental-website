import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  GitCompare,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { Button, LinkButton } from '@/components/ui/Button'
import { Avatar, DemoBanner } from '@/components/ui/Misc'
import {
  useAuth,
  useData,
  useFavorites,
  useLockBodyScroll,
  useScrolled,
  useTheme,
} from '@/lib/hooks'
import { cx, titleCase } from '@/lib/format'

const NAV = [
  { to: '/cars', label: 'Browse cars' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/become-a-host', label: 'List your car' },
]

/** Where each role's "Dashboard" link points. */
const DASHBOARD_HOME = {
  admin: '/admin',
  owner: '/owner',
  customer: '/account',
} as const

export function Header() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { favorites, compare } = useFavorites()
  const { demo, refresh } = useData()
  const scrolled = useScrolled(4)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useLockBodyScroll(mobileOpen)

  // Route changes should always close whatever was open.
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const onLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-shadow duration-200',
        scrolled ? 'shadow-lift backdrop-blur-md' : '',
      )}
      style={{ backgroundColor: scrolled ? 'color-mix(in oklab, var(--surface) 88%, transparent)' : 'var(--surface)' }}
    >
      {demo && <DemoBanner onRetry={refresh} />}

      <div className="border-subtle border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-ink-950 dark:text-white' : 'text-dim hover:text-ink-950 dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="bg-accent-500 absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <IconLink to="/compare" label="Compare cars" count={compare.length}>
              <GitCompare className="size-5" />
            </IconLink>
            <IconLink to="/favorites" label="Saved cars" count={favorites.length}>
              <Heart className="size-5" />
            </IconLink>

            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="text-dim hover:surface-sunken hover:text-ink-950 dark:hover:text-white rounded-lg p-2.5 transition-colors"
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            {user ? (
              <div ref={menuRef} className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="hover:surface-sunken flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <ChevronDown className="text-dim size-4" />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="surface-raised absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border shadow-lift-lg"
                    >
                      <div className="border-b p-4">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="text-dim truncate text-xs">{user.email}</p>
                        <p className="text-accent-700 dark:text-accent-500 mt-1.5 text-xs font-semibold">
                          {titleCase(user.role)} account
                        </p>
                      </div>
                      <div className="p-1.5">
                        <MenuItem to={DASHBOARD_HOME[user.role]} icon={LayoutDashboard}>
                          Dashboard
                        </MenuItem>
                        <MenuItem to="/account/profile" icon={UserIcon}>
                          Profile & verification
                        </MenuItem>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={onLogout}
                          className="hover:surface-sunken flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="ml-1 hidden items-center gap-2 sm:flex">
                <LinkButton to="/login" variant="ghost" size="sm">
                  Sign in
                </LinkButton>
                <LinkButton to="/register" size="sm">
                  Get started
                </LinkButton>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="hover:surface-sunken rounded-lg p-2.5 lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="surface overflow-hidden border-b lg:hidden"
          >
            <div className="space-y-1 p-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="hover:surface-sunken block rounded-lg px-3 py-2.5 font-medium"
                >
                  {item.label}
                </NavLink>
              ))}
              {!user && (
                <div className="flex gap-2 pt-3">
                  <LinkButton to="/login" variant="secondary" fullWidth>
                    Sign in
                  </LinkButton>
                  <LinkButton to="/register" fullWidth>
                    Get started
                  </LinkButton>
                </div>
              )}
              {user && (
                <Button variant="secondary" fullWidth className="mt-3" onClick={onLogout}>
                  Sign out
                </Button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

function IconLink({
  to,
  label,
  count,
  children,
}: {
  to: string
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={`${label}${count ? ` (${count})` : ''}`}
      className="text-dim hover:surface-sunken hover:text-ink-950 dark:hover:text-white relative rounded-lg p-2.5 transition-colors"
    >
      {children}
      {count > 0 && (
        <span className="bg-accent-600 absolute top-1 right-1 grid size-4 place-items-center rounded-full text-[10px] font-bold text-white tabular-nums">
          {count}
        </span>
      )}
    </Link>
  )
}

function MenuItem({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="hover:surface-sunken flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
    >
      <Icon className="size-4" />
      {children}
    </Link>
  )
}
