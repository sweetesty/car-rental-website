import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Fuel, GitCompare, Heart, MapPin, Settings2, Users } from 'lucide-react'
import type { Car } from '@/lib/types'
import { cx, money, titleCase } from '@/lib/format'
import { Rating } from '@/components/ui/Rating'
import { Badge } from '@/components/ui/Badge'
import { useFavorites, useToast } from '@/lib/hooks'
import { MAX_COMPARE } from '@/context/FavoritesContext'

export function CarCard({ car, index = 0 }: { car: Car; index?: number }) {
  const { isFavorite, toggleFavorite, isComparing, toggleCompare, compare } = useFavorites()
  const toast = useToast()
  const saved = isFavorite(car.id)
  const comparing = isComparing(car.id)

  const onCompare = () => {
    if (!comparing && compare.length >= MAX_COMPARE) {
      toast(`Compare holds ${MAX_COMPARE} cars — the oldest was swapped out.`, 'info')
    }
    toggleCompare(car.id)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.04 }}
      className="surface-raised group relative flex flex-col overflow-hidden rounded-2xl border shadow-hairline transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-1 hover:border-ink-300 hover:shadow-lift-lg dark:hover:border-ink-600"
    >
      <div className="surface-sunken relative aspect-16/10 overflow-hidden">
        <img
          src={car.images[0]}
          alt={car.name}
          loading={index < 3 ? 'eager' : 'lazy'}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Capped short of the action buttons so badges wrap instead of sliding under them. */}
        <div className="absolute top-3 left-3 flex max-w-[calc(100%-3.75rem)] flex-wrap gap-1.5">
          {car.rating >= 4.8 && <Badge tone="accent">Top rated</Badge>}
          {car.gpsTrackerId && <Badge tone="brand">GPS tracked</Badge>}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <IconToggle
            active={saved}
            onClick={() => toggleFavorite(car.id)}
            label={saved ? `Remove ${car.name} from saved` : `Save ${car.name}`}
          >
            <Heart className={cx('size-4', saved && 'fill-current')} />
          </IconToggle>
          <IconToggle
            active={comparing}
            onClick={onCompare}
            label={comparing ? `Remove ${car.name} from compare` : `Compare ${car.name}`}
          >
            <GitCompare className="size-4" />
          </IconToggle>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold tracking-tight">
              <Link to={`/cars/${car.id}`} className="after:absolute after:inset-0">
                {car.name}
              </Link>
            </h3>
            <p className="text-dim mt-0.5 text-sm">
              {car.year} · {titleCase(car.bodyType)}
            </p>
          </div>
          <Rating value={car.rating} count={car.reviewCount} />
        </div>

        <p className="text-dim mt-3 flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{car.pickupLocation}</span>
        </p>

        <ul className="text-dim mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <Spec icon={Users}>{car.seats} seats</Spec>
          <Spec icon={Settings2}>{titleCase(car.transmission)}</Spec>
          <Spec icon={Fuel}>{titleCase(car.fuelType)}</Spec>
        </ul>

        <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
          <p>
            <span className="text-xl font-black tracking-[-0.03em]">{money(car.pricePerDay)}</span>
            <span className="text-dim text-sm font-medium"> / day</span>
          </p>
          <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
            Details
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-3.5 transition-transform duration-200 group-hover:translate-x-1">
              <path
                d="M2.5 8h11m0 0L9.5 4m4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </motion.article>
  )
}

function Spec({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="size-3.5" />
      {children}
    </li>
  )
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cx(
        // z-1 keeps these above the card-wide link overlay.
        'relative z-1 grid size-8 place-items-center rounded-full backdrop-blur transition-colors',
        active
          ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-ink-950'
          : 'bg-white/85 text-ink-800 hover:bg-white dark:bg-ink-900/85 dark:text-ink-100',
      )}
    >
      {children}
    </button>
  )
}

export function CarCardSkeleton() {
  return (
    <div className="surface-raised rounded-card overflow-hidden border">
      <div className="skeleton aspect-16/10" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-9 w-full rounded" />
      </div>
    </div>
  )
}
