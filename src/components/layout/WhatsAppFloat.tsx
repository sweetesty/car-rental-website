import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { WhatsAppMark } from '@/components/ui/WhatsApp'
import { messages, supportLink } from '@/lib/whatsapp'
import { useData } from '@/lib/hooks'

/**
 * Floating WhatsApp launcher, pinned bottom-right on every public page.
 *
 * It always chats to the AUTOGO customer-care number — but the opener is
 * context-aware: on a car's page the message names that exact car, so an
 * enquiry arrives at support already knowing what it's about.
 */
export function WhatsAppFloat() {
  const { pathname } = useLocation()
  const { getCar } = useData()
  const [open, setOpen] = useState(false)

  // A first-visit nudge: the teaser bubble shows once, then stays dismissed.
  const [teased, setTeased] = useState(() => sessionStorage.getItem('autogo:wa-teased') === '1')

  useEffect(() => {
    if (teased) return
    const id = setTimeout(() => setOpen(true), 6000)
    return () => clearTimeout(id)
  }, [teased])

  const dismiss = () => {
    setOpen(false)
    setTeased(true)
    sessionStorage.setItem('autogo:wa-teased', '1')
  }

  // Which car (if any) is the visitor looking at right now?
  const carMatch = matchPath('/cars/:id', pathname)
  const car = carMatch?.params.id ? getCar(carMatch.params.id) : undefined

  const href = supportLink(car ? messages.enquiry(car.name) : messages.support())

  const label = car ? `Ask about the ${car.name}` : 'Questions? Chat with us'

  return (
    <div className="fixed right-4 bottom-4 z-80 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="surface-raised relative max-w-64 rounded-2xl rounded-br-md border p-4 shadow-lift-lg"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss chat prompt"
              className="surface-sunken text-dim absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border"
            >
              <X className="size-3.5" />
            </button>
            <p className="text-sm font-bold tracking-tight">{label}</p>
            <p className="text-dim mt-1 text-xs leading-relaxed">
              Customer care replies on WhatsApp in a few minutes, 7am–11pm.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        onClick={dismiss}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.45)]"
      >
        <WhatsAppMark className="size-7" />
      </motion.a>
    </div>
  )
}
