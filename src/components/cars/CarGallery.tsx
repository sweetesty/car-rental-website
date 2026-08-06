import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { cx } from '@/lib/format'
import { useLockBodyScroll } from '@/lib/hooks'

/** Large hero image with thumbnail rail and a full-screen lightbox. */
export function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useLockBodyScroll(lightbox)

  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length])

  return (
    <>
      <div className="space-y-3">
        <div className="surface-sunken rounded-card group relative aspect-16/10 overflow-hidden border">
          <AnimatePresence mode="wait">
            <motion.img
              key={images[index]}
              src={images[index]}
              alt={`${alt} — photo ${index + 1} of ${images.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <NavButton side="left" onClick={() => go(-1)}>
                <ChevronLeft className="size-5" />
              </NavButton>
              <NavButton side="right" onClick={() => go(1)}>
                <ChevronRight className="size-5" />
              </NavButton>
            </>
          )}

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View full screen"
            className="text-ink-900 dark:bg-ink-900/85 dark:text-ink-100 absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/85 backdrop-blur transition-colors hover:bg-white"
          >
            <Expand className="size-4" />
          </button>

          <span className="bg-ink-950/70 absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {index + 1} / {images.length}
          </span>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cx(
                  'h-18 w-26 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                  i === index ? 'border-brand-500' : 'border-transparent opacity-65 hover:opacity-100',
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-ink-950/95 fixed inset-0 z-100 grid place-items-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              aria-label="Close gallery"
              className="absolute top-4 right-4 rounded-lg p-2 text-white/80 hover:text-white"
            >
              <X className="size-6" />
            </button>
            <img
              src={images[index]}
              alt={`${alt} — photo ${index + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            {images.length > 1 && (
              <div
                className="absolute inset-x-0 bottom-6 flex justify-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                  className="rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next photo"
                  className="rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavButton({
  side,
  onClick,
  children,
}: {
  side: 'left' | 'right'
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cx(
        'text-ink-900 dark:bg-ink-900/85 dark:text-ink-100 absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      {children}
    </button>
  )
}
