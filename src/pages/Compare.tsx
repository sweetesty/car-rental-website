import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, GitCompare, X } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { Rating } from '@/components/ui/Rating'
import { useData, useFavorites } from '@/lib/hooks'
import { money, number, titleCase } from '@/lib/format'
import { FEATURE_LABELS, FUEL_POLICY_LABELS } from '@/lib/catalog'
import type { Car, CarFeatureSet } from '@/lib/types'

/** Rows are ordered by what actually decides a rental: money, then practicality. */
const ROWS: { label: string; get: (car: Car) => string }[] = [
  { label: 'Price / day', get: (c) => money(c.pricePerDay) },
  { label: 'Price / week', get: (c) => money(c.pricePerWeek) },
  { label: 'Price / month', get: (c) => money(c.pricePerMonth) },
  { label: 'Security deposit', get: (c) => money(c.policy.securityDeposit) },
  { label: 'Body type', get: (c) => titleCase(c.bodyType) },
  { label: 'Year', get: (c) => `${c.year}` },
  { label: 'Seats', get: (c) => `${c.seats}` },
  { label: 'Transmission', get: (c) => titleCase(c.transmission) },
  { label: 'Fuel type', get: (c) => titleCase(c.fuelType) },
  { label: 'Engine', get: (c) => c.specs.engine },
  { label: 'Horsepower', get: (c) => `${c.specs.horsepower} hp` },
  { label: 'Drive type', get: (c) => c.specs.driveType.toUpperCase() },
  { label: 'Mileage', get: (c) => `${number(c.mileage)} km` },
  {
    label: 'Mileage limit',
    get: (c) =>
      c.policy.mileageLimitPerDay ? `${number(c.policy.mileageLimitPerDay)} km/day` : 'Unlimited',
  },
  { label: 'Fuel policy', get: (c) => FUEL_POLICY_LABELS[c.policy.fuelPolicy].split(' — ')[0] },
  { label: 'Min. rental', get: (c) => `${c.policy.minRentalDays} day(s)` },
  { label: 'Free cancellation', get: (c) => `${c.policy.cancellationWindowHours} hrs before` },
  { label: 'Pickup', get: (c) => c.pickupLocation },
  { label: 'GPS tracker', get: (c) => (c.gpsTrackerId ? 'Fitted' : 'Not fitted') },
  { label: 'Insurance', get: (c) => c.insurance.provider },
]

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as (keyof CarFeatureSet)[]

export default function Compare() {
  const { cars } = useData()
  const { compare, toggleCompare, clearCompare } = useFavorites()

  const selected = useMemo(
    () => compare.map((id) => cars.find((c) => c.id === id)).filter((c) => c !== undefined),
    [compare, cars],
  )

  if (selected.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={GitCompare}
          title="Nothing to compare yet"
          message="Add up to three cars from the listings and see their specs, prices and policies side by side."
          action={<LinkButton to="/cars">Browse cars</LinkButton>}
        />
      </div>
    )
  }

  const cheapest = Math.min(...selected.map((c) => c.pricePerDay))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Compare cars</h1>
          <p className="text-dim mt-2">
            {selected.length} car{selected.length === 1 ? '' : 's'} side by side.
          </p>
        </div>
        <Button variant="secondary" onClick={clearCompare}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Specification comparison</caption>
          <thead>
            <tr>
              <th scope="col" className="surface sticky left-0 z-1 w-44 border-b p-3 text-left" />
              {selected.map((car) => (
                <th key={car.id} scope="col" className="border-b p-3 align-top">
                  <div className="relative w-52">
                    <button
                      type="button"
                      onClick={() => toggleCompare(car.id)}
                      aria-label={`Remove ${car.name} from comparison`}
                      className="surface-raised absolute -top-1 -right-1 z-1 grid size-7 place-items-center rounded-full border shadow-lift"
                    >
                      <X className="size-3.5" />
                    </button>
                    <img
                      src={car.images[0]}
                      alt=""
                      className="aspect-16/10 w-full rounded-lg object-cover"
                    />
                    <Link
                      to={`/cars/${car.id}`}
                      className="hover:text-brand-600 mt-3 block text-left font-bold tracking-tight"
                    >
                      {car.name}
                    </Link>
                    <div className="mt-1.5 text-left">
                      <Rating value={car.rating} count={car.reviewCount} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="even:surface-sunken">
                <th
                  scope="row"
                  className="surface even:surface-sunken sticky left-0 z-1 p-3 text-left font-medium text-dim"
                >
                  {row.label}
                </th>
                {selected.map((car) => {
                  const best = row.label === 'Price / day' && car.pricePerDay === cheapest
                  return (
                    <td
                      key={car.id}
                      className={
                        best
                          ? 'text-brand-700 dark:text-brand-300 p-3 font-black'
                          : 'p-3 font-semibold'
                      }
                    >
                      {row.get(car)}
                      {best && <span className="ml-2 text-xs font-bold">Best price</span>}
                    </td>
                  )
                })}
              </tr>
            ))}

            <tr>
              <th
                scope="row"
                colSpan={selected.length + 1}
                className="surface-sunken p-3 text-left text-xs font-bold tracking-wide uppercase"
              >
                Features
              </th>
            </tr>

            {FEATURE_KEYS.map((key) => (
              <tr key={key} className="even:surface-sunken">
                <th
                  scope="row"
                  className="surface even:surface-sunken text-dim sticky left-0 z-1 p-3 text-left font-medium"
                >
                  {FEATURE_LABELS[key]}
                </th>
                {selected.map((car) => (
                  <td key={car.id} className="p-3">
                    {car.features[key] ? (
                      <Check className="text-brand-600 dark:text-brand-400 size-4.5" />
                    ) : (
                      <X className="text-ink-300 dark:text-ink-700 size-4.5" />
                    )}
                    <span className="sr-only">
                      {car.features[key] ? 'Included' : 'Not included'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}

            <tr>
              <td className="surface sticky left-0 z-1 p-3" />
              {selected.map((car) => (
                <td key={car.id} className="p-3">
                  <LinkButton to={`/cars/${car.id}`} size="sm" fullWidth>
                    View & book
                  </LinkButton>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
