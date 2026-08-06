import { useMemo } from 'react'
import {
  CarCategory,
  PerksStrip,
  PromoBanner,
  ShowroomHero,
  TrendVehicles,
} from '@/components/home/Showroom'
import { useData } from '@/lib/hooks'

/**
 * Showroom-style landing: hero + search, browse by brand, trending cars,
 * the four promises, and one promo. Short on purpose — everything else
 * (how it works, why us, FAQ) has its own page a click away.
 */
export default function Home() {
  const { cars } = useData()

  const live = useMemo(() => cars.filter((c) => c.status === 'approved'), [cars])

  const trending = useMemo(
    () => [...live].sort((a, b) => b.rating - a.rating || b.tripCount - a.tripCount),
    [live],
  )

  return (
    <>
      <ShowroomHero />
      <CarCategory />
      <TrendVehicles cars={trending} />
      <PerksStrip />
      <PromoBanner cars={cars} />
    </>
  )
}
