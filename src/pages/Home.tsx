import { useMemo } from 'react'
import {
  CarCategory,
  PerksStrip,
  PromoBanner,
  ShowroomHero,
  TrendVehicles,
} from '@/components/home/Showroom'
import { useData } from '@/lib/hooks'
import type { Car } from '@/lib/types'

/**
 * Ranks by popularity, then reorders so no two adjacent cards share a brand or
 * body type. Strict rating order surfaced four near-identical sedans; this
 * shows a saloon, an SUV, an EV and a pickup instead — the fleet reads as
 * varied because it visibly is.
 */
function diversify(cars: Car[]): Car[] {
  const ranked = [...cars].sort(
    (a, b) => b.rating * (b.tripCount + 1) - a.rating * (a.tripCount + 1),
  )

  const out: Car[] = []
  const pool = [...ranked]

  while (pool.length) {
    const previous = out[out.length - 1]
    // Take the best remaining car that differs from the one before it; if every
    // candidate matches, fall back to the top of the pool rather than stall.
    const index = previous
      ? pool.findIndex((c) => c.brand !== previous.brand && c.bodyType !== previous.bodyType)
      : 0
    out.push(...pool.splice(index === -1 ? 0 : index, 1))
  }

  return out
}

/**
 * Showroom-style landing: hero + search, browse by brand, trending cars,
 * the four promises, and one promo. Short on purpose — everything else
 * (how it works, why us, FAQ) has its own page a click away.
 */
export default function Home() {
  const { cars, loading } = useData()

  const live = useMemo(() => cars.filter((c) => c.status === 'approved'), [cars])

  /**
   * Rotates daily. Everyone sees the same fleet on a given day (so a shared
   * link matches what the sender saw), but the order shifts overnight, which
   * gives quieter listings their turn at the front.
   */
  const trending = useMemo(() => {
    const varied = diversify(live)
    if (varied.length === 0) return varied
    const dayIndex = Math.floor(Date.now() / 86_400_000)
    const offset = dayIndex % varied.length
    return [...varied.slice(offset), ...varied.slice(0, offset)]
  }, [live])

  return (
    <>
      <ShowroomHero />
      <CarCategory cars={cars} loading={loading} />
      <TrendVehicles cars={trending} loading={loading} />
      <PerksStrip />
      <PromoBanner cars={cars} />
    </>
  )
}
