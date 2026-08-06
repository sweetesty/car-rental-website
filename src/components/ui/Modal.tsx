import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useLockBodyScroll } from '@/lib/hooks'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-90 grid place-items-center overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`surface-raised relative z-1 w-full ${WIDTH[size]} rounded-2xl border shadow-lift-lg`}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                {description && <p className="text-dim mt-1 text-sm">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-dim hover:surface-sunken -m-1 rounded-lg p-1.5"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="surface-sunken flex justify-end gap-2 rounded-b-2xl border-t p-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
