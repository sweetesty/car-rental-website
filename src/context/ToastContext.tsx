import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastValue {
  toast: (message: string, tone?: ToastTone) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastValue>({ toast: () => {} })

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'text-brand-600 dark:text-brand-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-ink-500 dark:text-ink-400',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, tone, message }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="surface-raised pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lift-lg"
              >
                <Icon className={`mt-0.5 size-4.5 shrink-0 ${TONE_CLASS[t.tone]}`} />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-dim hover:text-ink-950 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
