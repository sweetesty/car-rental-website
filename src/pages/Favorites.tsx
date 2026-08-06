import { useMemo } from 'react'
import { Heart } from 'lucide-react'
import { CarCard } from '@/components/cars/CarCard'
import { EmptyState } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'
import { useData, useFavorites } from '@/lib/hooks'

export default function Favorites() {
  const { cars } = useData()
  const { favorites } = useFavorites()

  const saved = useMemo(
    () => favorites.map((id) => cars.find((c) => c.id === id)).filter((c) => c !== undefined),
    [favorites, cars],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Saved cars</h1>
      <p className="text-dim mt-2">
        {saved.length === 0
          ? 'Cars you save are kept here, on this device.'
          : `${saved.length} car${saved.length === 1 ? '' : 's'} saved for later.`}
      </p>

      <div className="mt-8">
        {saved.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            message="Tap the heart on any listing to keep it here while you make up your mind."
            action={<LinkButton to="/cars">Browse cars</LinkButton>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
