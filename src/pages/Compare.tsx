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

      {/* overscroll-x-contain stops a horizontal swipe here from turning into
          a browser back-navigation once the table hits its end. */}
      <div className="overflow-x-auto overscroll-x-contain">
        {/*
          No fixed min-width on the table. A hardcoded one is wrong for every
          car count except the one it was picked for — too small and the columns
          get crushed, too large and a single car floats in dead space. The
          per-cell minimums below let the browser derive it from the actual
          count instead.

          Those minimums shrink on phones (7rem labels, 9rem per car rather than
          11 and 13) so two cars are genuinely side by side on a 390px screen —
          the point of the page. At desktop widths they go back to comfortable.
        */}
        <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
          <caption className="sr-only">Specification comparison</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="surface sticky left-0 z-1 w-28 min-w-28 border-b p-2 sm:w-44 sm:min-w-44 sm:p-3 text-left"
              />
              {selected.map((car) => (
                <th key={car.id} scope="col" className="min-w-36 border-b p-2 align-top sm:min-w-52 sm:p-3">
                  {/*
                    The width lives on the cell, not here. As a plain w-52 div
                    it did not contribute to the column's minimum width, so the
                    table layout was free to crush the column to a sliver — the
                    first car ended up a few pixels wide on a phone.
                  */}
                  <div className="relative w-full">
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
                  className="surface even:surface-sunken sticky left-0 z-1 w-28 min-w-28 p-2 sm:w-44 sm:min-w-44 sm:p-3 text-left font-medium text-dim"
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
                          ? 'text-brand-700 dark:text-brand-300 p-2 font-black sm:p-3'
                          : 'p-2 font-semibold sm:p-3'
                      }
                    >
                      {row.get(car)}
                      {/* Drops to its own line on a phone — beside a price in a
                          9rem column it would force the whole table wider. */}
                      {best && (
                        <span className="block text-[0.65rem] font-bold sm:ml-2 sm:inline sm:text-xs">
                          Best price
                        </span>
                      )}
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
                  className="surface even:surface-sunken text-dim sticky left-0 z-1 w-28 min-w-28 p-2 sm:w-44 sm:min-w-44 sm:p-3 text-left font-medium"
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
              <td className="surface sticky left-0 z-1 w-28 min-w-28 p-2 sm:w-44 sm:min-w-44 sm:p-3" />
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
