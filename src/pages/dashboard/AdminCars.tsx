import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CarFront, Check, Eye, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, ListSkeleton, Tabs } from '@/components/ui/Misc'
import { ListingBadge, VerificationBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Rating } from '@/components/ui/Rating'
import { useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { formatDate, money, number, titleCase } from '@/lib/format'
import type { Car, ListingStatus } from '@/lib/types'

type Tab = 'pending' | 'approved' | 'rejected' | 'all'

type PriceTier = 'perDay' | 'perWeek' | 'perMonth'
type PriceForm = Record<PriceTier, string>

const PRICE_TIERS: { key: PriceTier; label: string }[] = [
  { key: 'perDay', label: 'Per day' },
  { key: 'perWeek', label: 'Per week' },
  { key: 'perMonth', label: 'Per month' },
]

const EMPTY_PRICES: PriceForm = { perDay: '', perWeek: '', perMonth: '' }

const priceFormFor = (car: Car): PriceForm => ({
  perDay: String(car.pricePerDay),
  perWeek: String(car.pricePerWeek),
  perMonth: String(car.pricePerMonth),
})

export default function AdminCars() {
  const { cars, setCarStatus, deleteCar, loading } = useData()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('pending')
  const [inspecting, setInspecting] = useState<Car | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Car | null>(null)
  // Which decision is running, not just that one is — a shared boolean spun
  // both buttons at once, so approving looked like it was also rejecting.
  const [busy, setBusy] = useState<ListingStatus | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Blank means "use the platform default" — distinct from 0, which is a real
  // zero-commission listing.
  const [commission, setCommission] = useState('')
  // Kept as strings so a half-typed number doesn't get coerced mid-keystroke.
  // `originalPrices` is the baseline the modal opened with, so an untouched
  // form sends nothing and the owner isn't emailed about a non-change.
  const [prices, setPrices] = useState<PriceForm>(EMPTY_PRICES)
  const [originalPrices, setOriginalPrices] = useState<PriceForm>(EMPTY_PRICES)

  const pricesEdited = PRICE_TIERS.some(({ key }) => prices[key] !== originalPrices[key])

  const groups = useMemo(
    () => ({
      pending: cars.filter((c) => c.status === 'pending'),
      approved: cars.filter((c) => c.status === 'approved'),
      rejected: cars.filter((c) => ['rejected', 'suspended'].includes(c.status)),
      all: cars,
    }),
    [cars],
  )

  /**
   * Commission and price edits are only sent when the admin is working inside
   * the inspect modal — the quick Approve button in the row keeps whatever the
   * car already has rather than silently resetting it.
   */
  const decide = async (
    car: Car,
    status: ListingStatus,
    message: string,
    fromModal = false,
  ) => {
    setBusy(status)
    try {
      const rate = fromModal
        ? commission.trim() === ''
          ? null
          : Number(commission)
        : undefined

      if (rate !== undefined && rate !== null && (!Number.isFinite(rate) || rate < 0 || rate > 100)) {
        toast('Commission must be between 0 and 100.', 'error')
        return
      }

      let priceOverride: { perDay: number; perWeek: number; perMonth: number } | undefined
      if (fromModal && pricesEdited) {
        const parsed = PRICE_TIERS.map(({ key, label }) => {
          const amount = Number(prices[key])
          return { key, label, amount }
        })

        const invalid = parsed.find(
          (tier) => prices[tier.key].trim() === '' || !Number.isFinite(tier.amount) || tier.amount < 0,
        )
        if (invalid) {
          toast(`${invalid.label} must be a valid amount.`, 'error')
          return
        }

        priceOverride = {
          perDay: parsed[0].amount,
          perWeek: parsed[1].amount,
          perMonth: parsed[2].amount,
        }
      }

      await setCarStatus(car.id, status, {
        ...(rate !== undefined ? { commissionPercent: rate } : {}),
        ...(priceOverride ? { prices: priceOverride } : {}),
      })
      toast(priceOverride ? `${message} The owner has been emailed about the new rates.` : message)
      setInspecting(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(null)
    }
  }

  const openInspect = (car: Car) => {
    setCommission(car.commissionPercent == null ? '' : String(car.commissionPercent))
    const form = priceFormFor(car)
    setPrices(form)
    setOriginalPrices(form)
    setInspecting(car)
  }

  const list = groups[tab]

  return (
    <>
      <PageHeader
        title="Car approvals"
        subtitle="Review every listing before it goes public, and take down anything that shouldn't be there."
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'pending', label: 'Awaiting review', count: groups.pending.length },
          { id: 'approved', label: 'Live', count: groups.approved.length },
          { id: 'rejected', label: 'Rejected / suspended', count: groups.rejected.length },
          { id: 'all', label: 'All', count: groups.all.length },
        ]}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <ListSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CarFront}
            title={tab === 'pending' ? 'Queue is clear' : 'Nothing here'}
            message={
              tab === 'pending'
                ? 'No listings are waiting for review right now.'
                : 'No listings match this filter.'
            }
          />
        ) : (
          list.map((car) => (
            <Card key={car.id} className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                <img
                  src={car.images[0]}
                  alt=""
                  className="h-24 w-full shrink-0 rounded-lg object-cover sm:w-36"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/cars/${car.id}`}
                        className="hover:text-brand-600 font-bold tracking-tight"
                      >
                        {car.name}
                      </Link>
                      <p className="text-dim mt-1 text-sm">
                        {car.owner?.name} · {car.registrationNumber} · listed{' '}
                        {formatDate(car.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {car.owner && <VerificationBadge status={car.owner.verification} />}
                      <ListingBadge status={car.status} />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Detail label="Per day" value={money(car.pricePerDay)} />
                    <Detail label="City" value={car.city} />
                    <Detail label="Insurance" value={car.insurance.provider} />
                    <Detail label="Photos" value={number(car.images.length)} />
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openInspect(car)}>
                      <Eye className="size-3.5" />
                      Inspect
                    </Button>

                    {car.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => decide(car, 'approved', `${car.name} is now live.`)}
                      >
                        <Check className="size-3.5" />
                        Approve
                      </Button>
                    )}

                    {car.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400"
                        onClick={() => decide(car, 'rejected', `${car.name} was rejected.`)}
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                    )}

                    {car.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          decide(car, 'suspended', `${car.name} has been suspended.`)
                        }
                      >
                        <Ban className="size-3.5" />
                        Suspend
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => setPendingDelete(car)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={!!inspecting}
        onClose={() => setInspecting(null)}
        title={inspecting?.name ?? ''}
        description="Check the details an owner submitted before approving."
        size="lg"
        footer={
          inspecting && (
            <>
              <Button
                variant="danger"
                loading={busy === 'rejected'}
                // Don't leave the other decision clickable while one is in
                // flight — two verdicts on one listing would race.
                disabled={busy === 'approved'}
                onClick={() =>
                  decide(inspecting, 'rejected', `${inspecting.name} was rejected.`, true)
                }
              >
                Reject
              </Button>
              <Button
                loading={busy === 'approved'}
                disabled={busy === 'rejected'}
                onClick={() =>
                  decide(inspecting, 'approved', `${inspecting.name} is now live.`, true)
                }
              >
                Approve listing
              </Button>
            </>
          )
        }
      >
        {inspecting && (
          <div className="space-y-5">
            {/* Commission sits above the photos: it is the decision the admin
                is here to make, and burying it under the gallery invites
                approving without setting it. */}
            <div className="surface-sunken rounded-xl border p-4">
              <label htmlFor="commission" className="text-sm font-bold">
                AUTOGO commission on this listing
              </label>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative w-32">
                  <input
                    id="commission"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="default"
                    className="surface-raised h-10 w-full rounded-lg border pr-7 pl-3 text-sm font-semibold"
                  />
                  <span className="text-dim pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                    %
                  </span>
                </div>
                <p className="text-dim text-xs leading-snug">
                  Leave blank to use the platform default. Applies to new bookings only —
                  existing ones keep the rate they were made at.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {inspecting.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="aspect-4/3 w-full rounded-lg border object-cover"
                />
              ))}
            </div>

            {/* The rates the owner set — editable, because approving a listing
                without seeing its price while also setting the commission taken
                from it is approving blind. Changing one emails the owner. */}
            <div className="surface-sunken rounded-xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-dim text-xs font-bold tracking-wide uppercase">
                  Rates set by the owner
                </p>
                {pricesEdited && (
                  <span className="text-brand-600 dark:text-brand-400 text-xs font-semibold">
                    Owner will be emailed about this change
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {PRICE_TIERS.map(({ key, label }) => (
                  <div key={key}>
                    <label
                      htmlFor={`price-${key}`}
                      className="text-dim block text-xs"
                    >
                      {label}
                    </label>
                    <div className="relative mt-1">
                      <span className="text-dim pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                        ₦
                      </span>
                      <input
                        id={`price-${key}`}
                        type="number"
                        min={0}
                        step={1000}
                        inputMode="numeric"
                        value={prices[key]}
                        onChange={(e) =>
                          setPrices((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="surface-raised h-10 w-full rounded-lg border pr-3 pl-7 text-sm font-semibold tabular-nums"
                      />
                    </div>
                    {originalPrices[key] !== prices[key] && (
                      <p className="text-dim mt-1 text-xs tabular-nums line-through">
                        {money(Number(originalPrices[key]))}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-dim mt-3 border-t pt-3 text-xs">
                Only change these if the price is unrealistic for the market — the owner sets
                their own rates and can change them back. Security deposit{' '}
                {money(inspecting.policy.securityDeposit)} · minimum{' '}
                {inspecting.policy.minRentalDays} day
                {inspecting.policy.minRentalDays > 1 ? 's' : ''} ·{' '}
                {inspecting.policy.mileageLimitPerDay
                  ? `${number(inspecting.policy.mileageLimitPerDay)} km/day`
                  : 'unlimited mileage'}
              </p>
            </div>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Owner" value={inspecting.owner?.name ?? '—'} />
              <Detail label="Registration" value={inspecting.registrationNumber} />
              <Detail label="VIN" value={inspecting.vin ?? 'Not supplied'} />
              <Detail label="Mileage" value={`${number(inspecting.mileage)} km`} />
              <Detail label="Insurance provider" value={inspecting.insurance.provider} />
              <Detail label="Policy number" value={inspecting.insurance.policyNumber} />
              <Detail label="Policy expiry" value={formatDate(inspecting.insurance.expiresAt)} />
              <Detail
                label="GPS tracker"
                value={inspecting.gpsTrackerId ?? 'Not fitted'}
              />
              <Detail label="Pickup" value={inspecting.pickupLocation} />
              <Detail label="Body / fuel" value={`${titleCase(inspecting.bodyType)} · ${titleCase(inspecting.fuelType)}`} />
            </dl>

            <div>
              <p className="text-dim text-xs font-bold tracking-wide uppercase">Description</p>
              <p className="mt-2 text-sm leading-relaxed">{inspecting.description}</p>
            </div>

            <div className="flex items-center gap-3 border-t pt-4">
              <Rating value={inspecting.rating} count={inspecting.reviewCount} size="md" />
              <span className="text-dim text-sm">
                {number(inspecting.tripCount)} completed trips
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this listing?"
        description="This removes the car from AUTOGO permanently."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={async () => {
                if (!pendingDelete) return
                setDeleting(true)
                try {
                  await deleteCar(pendingDelete.id)
                  toast(`${pendingDelete.name} deleted.`)
                  setPendingDelete(null)
                } catch (err) {
                  toast(apiError(err), 'error')
                } finally {
                  setDeleting(false)
                }
              }}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Prefer <span className="font-bold">suspend</span> if the owner may fix the problem —
          suspension is reversible, deletion is not.
        </p>
      </Modal>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-dim text-xs">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}
