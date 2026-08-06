import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Card, EmptyState, ListSkeleton } from '@/components/ui/Misc'
import { Rating } from '@/components/ui/Rating'
import { LinkButton } from '@/components/ui/Button'
import { useAuth, useData } from '@/lib/hooks'
import { formatDate } from '@/lib/format'

export default function MyReviews() {
  const { user } = useAuth()
  const { bookings, reviewsFor, loadReviews, getCar, loading } = useData()

  /** The API has no "my reviews" endpoint, so look at the cars they've rented. */
  const rentedCarIds = useMemo(
    () => [...new Set(bookings.filter((b) => b.customerId === user?.id).map((b) => b.carId))],
    [bookings, user?.id],
  )

  useEffect(() => {
    for (const carId of rentedCarIds) loadReviews(carId)
  }, [rentedCarIds, loadReviews])

  const mine = useMemo(
    () =>
      rentedCarIds
        .flatMap((carId) => reviewsFor(carId))
        .filter((r) => r.author.id === user?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rentedCarIds, reviewsFor, user?.id],
  )

  return (
    <>
      <PageHeader
        title="My reviews"
        subtitle="Reviews you've left after completed trips, and any replies from owners."
      />

      {loading ? (
        <ListSkeleton rows={2} />
      ) : mine.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          message="Once a trip is complete you can rate the car and tell other renters how it went."
          action={<LinkButton to="/account">Back to bookings</LinkButton>}
        />
      ) : (
        <ul className="space-y-4">
          {mine.map((review) => {
            const car = getCar(review.carId)
            return (
              <li key={review.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/cars/${review.carId}`}
                        className="hover:text-brand-600 font-bold tracking-tight"
                      >
                        {car?.name ?? 'Listing removed'}
                      </Link>
                      <p className="text-dim mt-1 text-xs">{formatDate(review.createdAt)}</p>
                    </div>
                    <Rating value={review.rating} />
                  </div>

                  <p className="mt-3 leading-relaxed text-pretty">{review.comment}</p>

                  {review.ownerReply && (
                    <div className="surface-sunken border-brand-500 mt-4 rounded-lg border-l-2 p-3.5">
                      <p className="text-xs font-bold tracking-wide uppercase">
                        Reply from {car?.owner?.name ?? 'the owner'}
                      </p>
                      <p className="text-dim mt-1.5 text-sm leading-relaxed">
                        {review.ownerReply.comment}
                      </p>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
