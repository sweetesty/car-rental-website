const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

export const money = (amount: number) => NGN.format(amount)

/** Compact form for stat tiles: ₦1.2M, ₦840k. */
export function moneyCompact(amount: number) {
  if (Math.abs(amount) >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `₦${Math.round(amount / 1_000)}k`
  return `₦${amount}`
}

export const number = (n: number) => new Intl.NumberFormat('en-NG').format(n)

const DATE = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATE_SHORT = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })

export const formatDate = (iso: string) => DATE.format(new Date(iso))
export const formatDateShort = (iso: string) => DATE_SHORT.format(new Date(iso))

export function formatRange(startIso: string, endIso: string) {
  return `${formatDateShort(startIso)} → ${formatDate(endIso)}`
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

/** Inclusive day count — a Mon→Wed booking is 3 rental days. */
export function daysBetween(startIso: string, endIso: string) {
  if (!startIso || !endIso) return 0
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (Number.isNaN(ms) || ms < 0) return 0
  return Math.floor(ms / 86_400_000) + 1
}

export const toISODate = (d: Date) => d.toISOString().slice(0, 10)

export const todayISO = () => toISODate(new Date())

export function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Every ISO date from start to end, inclusive. */
export function eachDate(startIso: string, endIso: string) {
  const out: string[] = []
  if (!startIso || !endIso) return out
  const end = new Date(endIso)
  for (const d = new Date(startIso); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toISODate(d))
  }
  return out
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Joins truthy class names; non-string falsy values (0, null) are dropped. */
export const cx = (...classes: unknown[]) =>
  classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ')
