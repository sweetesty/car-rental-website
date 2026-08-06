import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/format'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

/**
 * Buttons are squared-off (10px) rather than pill-shaped — closer to dashboard
 * switchgear than to a generic web control. Every variant shares one motion
 * signature: lift 1px on hover, sit back down on press.
 */
const BASE = [
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
  'rounded-[0.625rem] font-semibold tracking-[-0.01em]',
  'transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out',
  'hover:-translate-y-px active:translate-y-0 active:scale-[0.99]',
  'disabled:pointer-events-none disabled:opacity-45',
].join(' ')

const VARIANTS: Record<Variant, string> = {
  // Ink, not brand colour — the confident default on both themes.
  primary: [
    'bg-ink-950 text-white shadow-key hover:bg-ink-800 hover:shadow-key-hover',
    'dark:bg-white dark:text-ink-950 dark:shadow-key-light dark:hover:bg-ink-100',
  ].join(' '),

  // The signal colour. Reserved for the single most important action on a screen.
  accent: 'bg-accent-600 text-white shadow-key hover:bg-accent-500 hover:shadow-key-accent',

  secondary: [
    'border border-ink-300 bg-white text-ink-900 shadow-hairline hover:border-ink-400 hover:bg-ink-50',
    'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:hover:border-ink-600 dark:hover:bg-ink-800',
  ].join(' '),

  ghost: 'text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',

  danger: 'bg-red-600 text-white shadow-key hover:bg-red-700 hover:shadow-key-danger',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[3.25rem] px-7 text-[0.9375rem]',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  className?: string
  children?: ReactNode
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

interface LinkButtonProps extends CommonProps {
  to: string
  state?: unknown
  onClick?: () => void
}

/** Same visual language as Button, but renders a router link. */
export function LinkButton({
  to,
  state,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      className={cx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  )
}

/**
 * Trailing arrow that slides on hover. Drop inside a Button/LinkButton to give
 * a call to action some forward motion.
 */
export function ArrowTip({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cx(
        'size-4 transition-transform duration-200 ease-out group-hover/btn:translate-x-1',
        className,
      )}
    >
      <path
        d="M2.5 8h11m0 0L9.5 4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
