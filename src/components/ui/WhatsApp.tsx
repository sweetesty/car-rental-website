import { cx } from '@/lib/format'

/** WhatsApp glyph — drawn inline; lucide dropped third-party logos in v1. */
export function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.35Z" />
      <path d="M12.05 2C6.55 2 2.08 6.46 2.08 11.95c0 1.76.46 3.47 1.34 4.98L2 22l5.2-1.36a9.96 9.96 0 0 0 4.84 1.23h.01c5.5 0 9.97-4.46 9.97-9.95A9.9 9.9 0 0 0 19.1 4.9 9.93 9.93 0 0 0 12.05 2Zm0 18.19h-.01a8.28 8.28 0 0 1-4.21-1.15l-.3-.18-3.09.8.83-3-.2-.31a8.26 8.26 0 0 1-1.27-4.4 8.3 8.3 0 0 1 8.26-8.27c2.2 0 4.28.86 5.84 2.42a8.22 8.22 0 0 1 2.42 5.86c0 4.56-3.71 8.23-8.27 8.23Z" />
    </svg>
  )
}

interface WhatsAppButtonProps {
  href: string | null
  children: React.ReactNode
  size?: 'sm' | 'md'
  variant?: 'solid' | 'outline'
  fullWidth?: boolean
  className?: string
}

/**
 * WhatsApp's own green, kept regardless of theme — the brand colour is what
 * makes the button instantly recognisable. Renders nothing when there's no
 * usable number, rather than a dead link.
 */
export function WhatsAppButton({
  href,
  children,
  size = 'md',
  variant = 'solid',
  fullWidth = false,
  className,
}: WhatsAppButtonProps) {
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[0.625rem] font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px active:translate-y-0',
        size === 'sm' ? 'h-9 px-3.5 text-[0.8125rem]' : 'h-11 px-5 text-sm',
        variant === 'solid'
          ? 'bg-[#25D366] text-white shadow-key hover:bg-[#1fb757] hover:shadow-[0_8px_20px_-6px_rgba(37,211,102,0.55)]'
          : 'border border-[#25D366]/50 text-[#128C4B] hover:bg-[#25D366]/10 dark:text-[#4ade80]',
        fullWidth && 'w-full',
        className,
      )}
    >
      <WhatsAppMark className={size === 'sm' ? 'size-4' : 'size-4.5'} />
      {children}
    </a>
  )
}
