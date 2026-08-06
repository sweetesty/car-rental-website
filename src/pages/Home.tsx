import { useMemo } from 'react'
import { Hero } from '@/components/home/Hero'
import {
  BrandStrip,
  FeaturedCars,
  HowItWorks,
  MobileApp,
  OwnerCta,
  Testimonials,
  WhyChooseUs,
} from '@/components/home/HomeSections'
import { useData } from '@/lib/hooks'

export default function Home() {
  const { cars } = useData()

  const live = useMemo(() => cars.filter((c) => c.status === 'approved'), [cars])

  const featured = useMemo(
    () => [...live].sort((a, b) => b.rating - a.rating || b.tripCount - a.tripCount).slice(0, 4),
    [live],
  )

  return (
    <>
      <Hero carCount={live.length} />
      <BrandStrip />
      <FeaturedCars cars={featured} />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <OwnerCta />
      <MobileApp />
    </>
  )
}
