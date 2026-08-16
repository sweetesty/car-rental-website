import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CarFront, Search, SlidersHorizontal, WifiOff, X } from 'lucide-react'
import type { CarFilters as Filters } from '@/lib/types'
import { CarCard, CarCardSkeleton } from '@/components/cars/CarCard'
import { CarFilters } from '@/components/cars/CarFilters'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { useData, useDebounced, useLockBodyScroll } from '@/lib/hooks'
import { DEFAULT_FILTERS, PRICE_CEILING } from '@/lib/catalog'
import { isAvailable } from '@/lib/pricing'
import { number } from '@/lib/format'

const SORTS: { value: Filters['sort']; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest listings' },
]

/** Reads filters out of the URL so searches stay shareable and bookmarkable. */
function fromParams(params: URLSearchParams): Filters {
  return {
    ...DEFAULT_FILTERS,
    q: params.get('q') ?? '',
    brand: params.get('brand') ?? '',
    bodyType: params.get('bodyType') ?? '',
    transmission: params.get('transmission') ?? '',
    fuelType: params.get('fuelType') ?? '',
    city: params.get('city') ?? '',
    seats: params.get('seats') ?? '',
    maxPrice: Number(params.get('maxPrice')) || PRICE_CEILING,
    startDate: params.get('startDate') ?? '',
    endDate: params.get('endDate') ?? '',
    sort: (params.get('sort') as Filters['sort']) ?? 'recommended',
  }
}

export default function Cars() {
  const { cars, loading, refresh } = useData()
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(() => fromParams(params))
  const [search, setSearch] = useState(filters.q)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settling, setSettling] = useState(false)

  const debouncedSearch = useDebounced(search, 250)
  useLockBodyScroll(drawerOpen)

  // Filters own the URL; every change rewrites the query string.
  useEffect(() => {
    const next = new URLSearchParams()
    const merged = { ...filters, q: debouncedSearch }
    for (const [key, val] of Object.entries(merged)) {
      const fallback = DEFAULT_FILTERS[key as keyof Filters]
      if (val !== '' && val !== fallback && val !== 0) next.set(key, String(val))
    }
    setParams(next, { replace: true })
  }, [filters, debouncedSearch, setParams])

  // A brief skeleton pass makes filter changes feel deliberate rather than jumpy.
  useEffect(() => {
    setSettling(true)
    const id = setTimeout(() => setSettling(false), 220)
    return () => clearTimeout(id)
  }, [filters, debouncedSearch])

  const patch = useCallback((p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p })), [])

  const reset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearch('')
  }, [])

  const results = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const list = cars.filter((car) => {
      if (car.status !== 'approved') return false
      if (q) {
        const haystack = `${car.name} ${car.brand} ${car.model} ${car.city} ${car.pickupLocation}`
        if (!haystack.toLowerCase().includes(q)) return false
      }
      if (filters.brand && car.brand !== filters.brand) return false
      if (filters.bodyType && car.bodyType !== filters.bodyType) return false
      if (filters.transmission && car.transmission !== filters.transmission) return false
      if (filters.fuelType && car.fuelType !== filters.fuelType) return false
      if (filters.city && car.city !== filters.city) return false
      if (filters.seats && car.seats < Number(filters.seats)) return false
      /*
       * The slider's top position is labelled "₦200,000+", so it has to mean
       * no upper limit. Compared literally it meant "≤ ₦200,000", which hid
       * every car above that at every possible setting — the Porsche and the
       * AMG GT R could not be reached from this page at all.
       */
      if (filters.maxPrice < PRICE_CEILING && car.pricePerDay > filters.maxPrice) return false
      if (filters.startDate && filters.endDate) {
        if (!isAvailable(car, filters.startDate, filters.endDate)) return false
      }
      return true
    })

    switch (filters.sort) {
      case 'price-asc':
        return list.sort((a, b) => a.pricePerDay - b.pricePerDay)
      case 'price-desc':
        return list.sort((a, b) => b.pricePerDay - a.pricePerDay)
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating)
      case 'newest':
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      default:
        return list.sort((a, b) => b.rating * b.tripCount - a.rating * a.tripCount)
    }
  }, [cars, debouncedSearch, filters])

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, val]) => key !== 'sort' && val !== DEFAULT_FILTERS[key as keyof Filters],
      ).length,
    [filters],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Browse cars</h1>
        <p className="text-dim mt-2">
          {number(results.length)} car{results.length === 1 ? '' : 's'} match your search across
          Nigeria.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-dim pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand or location…"
            aria-label="Search cars"
            className="surface-raised h-12 w-full rounded-lg border pr-4 pl-11 text-sm"
          />
        </div>

        <select
          value={filters.sort}
          onChange={(e) => patch({ sort: e.target.value as Filters['sort'] })}
          aria-label="Sort results"
          className="surface-raised h-12 cursor-pointer rounded-lg border px-3.5 text-sm font-medium"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <Button variant="secondary" className="h-12 lg:hidden" onClick={() => setDrawerOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <div className="surface-raised sticky top-24 rounded-card border p-5">
            <CarFilters value={filters} onChange={patch} onReset={reset} />
          </div>
        </aside>

        <section aria-live="polite">
          {settling ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : cars.length === 0 ? (
            /*
             * No fleet at all is not a filter problem, and saying "no cars
             * match those filters" sends someone off widening a price range
             * that was never the cause. It happens on a cold start, when the
             * API is still waking and we have nothing yet.
             */
            <EmptyState
              icon={WifiOff}
              title="Can't load the cars right now"
              message="We're having trouble reaching AUTOGO. Check your connection — we'll keep trying."
              action={
                <Button onClick={() => void refresh()} loading={loading}>
                  Try again
                </Button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={CarFront}
              title="No cars match those filters"
              message="Try widening your price range, clearing the date window, or searching a different city."
              action={
                <Button variant="secondary" onClick={reset}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-90 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="bg-ink-950/60 absolute inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="surface absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col"
            >
              <div className="flex items-center justify-between border-b p-4">
                <p className="font-bold">Filters</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="hover:surface-sunken rounded-lg p-1.5"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <CarFilters value={filters} onChange={patch} onReset={reset} />
              </div>
              <div className="border-t p-4">
                <Button fullWidth onClick={() => setDrawerOpen(false)}>
                  Show {number(results.length)} cars
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
