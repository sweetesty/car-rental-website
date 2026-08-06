import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, EmptyState, ListSkeleton } from '@/components/ui/Misc'
import { ListingBadge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Modal } from '@/components/ui/Modal'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { money, number } from '@/lib/format'
import type { Car } from '@/lib/types'

export default function OwnerCars() {
  const { user } = useAuth()
  const { cars, setCarStatus, deleteCar, loading } = useData()
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Car | null>(null)
  const [busy, setBusy] = useState(false)

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === user?.id), [cars, user?.id])

  const togglePause = async (car: Car) => {
    const next = car.status === 'approved' ? 'suspended' : 'approved'
    try {
      await setCarStatus(car.id, next)
      toast(
        next === 'suspended'
          ? `${car.name} is paused and hidden from search.`
          : `${car.name} is live again.`,
        next === 'suspended' ? 'info' : 'success',
      )
    } catch (err) {
      toast(apiError(err), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await deleteCar(pendingDelete.id)
      toast(`${pendingDelete.name} has been removed.`)
      setPendingDelete(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My cars"
        subtitle="Add, edit and pause your listings."
        action={
          <LinkButton to="/owner/cars/new">
            <Plus className="size-4" />
            List a car
          </LinkButton>
        }
      />

      {loading ? (
        <ListSkeleton />
      ) : myCars.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title="No listings yet"
          message="Add your first car — it takes about ten minutes, and listing is free."
          action={<LinkButton to="/owner/cars/new">List a car</LinkButton>}
        />
      ) : (
        <div className="space-y-4">
          {myCars.map((car) => (
            <Card key={car.id} className="overflow-hidden">
              <div className="flex flex-col gap-5 p-5 sm:flex-row">
                <img
                  src={car.images[0]}
                  alt=""
                  className="h-28 w-full shrink-0 rounded-lg object-cover sm:w-44"
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
                        {car.year} · {car.registrationNumber} · {car.pickupLocation}
                      </p>
                    </div>
                    <ListingBadge status={car.status} />
                  </div>

                  {car.status === 'rejected' && (
                    <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                      Rejected by our review team. Update the photos and insurance details, then
                      resubmit.
                    </p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Stat label="Per day" value={money(car.pricePerDay)} />
                    <Stat label="Per week" value={money(car.pricePerWeek)} />
                    <Stat label="Trips" value={number(car.tripCount)} />
                    <div>
                      <dt className="text-dim text-xs">Rating</dt>
                      <dd className="mt-0.5">
                        <Rating value={car.rating} count={car.reviewCount} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <LinkButton to={`/owner/cars/${car.id}/edit`} variant="secondary" size="sm">
                      <Pencil className="size-3.5" />
                      Edit
                    </LinkButton>

                    {['approved', 'suspended'].includes(car.status) && (
                      <Button variant="secondary" size="sm" onClick={() => togglePause(car)}>
                        {car.status === 'approved' ? (
                          <>
                            <EyeOff className="size-3.5" />
                            Pause listing
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            Resume listing
                          </>
                        )}
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
          ))}
        </div>
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this listing?"
        description="This can't be undone. Existing bookings on this car are not affected."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep listing
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={busy}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm">
          <span className="font-bold">{pendingDelete?.name}</span> will be removed from AUTOGO and
          will stop appearing in search results immediately.
        </p>
      </Modal>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-dim text-xs">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}
