import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, Car, ListingStatus, Review, Transaction, User } from '@/lib/types'
import {
  adminService,
  bookingService,
  carService,
  paymentService,
  reviewService,
} from '@/lib/services'
import { transactionsFromBookings, withBookedDates } from '@/lib/adapters'
import { apiError } from '@/lib/api'
// Imported directly rather than via the `useAuth` hook barrel — that barrel also
// imports this file, and the cycle makes module init order matter.
import { AuthContext } from './AuthContext'
import * as seed from '@/lib/mockData'
import { daysBetween, eachDate } from '@/lib/format'

interface AnalyticsSummary {
  totalUsers: number
  totalCars: number
  totalBookings: number
  revenue: number
  commission?: number
}

interface DataValue {
  cars: Car[]
  bookings: Booking[]
  users: User[]
  transactions: Transaction[]
  analytics: AnalyticsSummary | null

  loading: boolean
  /** True when the API couldn't be reached and the seed dataset is standing in. */
  demo: boolean
  error: string | null
  refresh: () => Promise<void>

  getCar: (id: string) => Car | undefined
  loadCar: (id: string) => Promise<Car | undefined>

  reviewsFor: (carId: string) => Review[]
  loadReviews: (carId: string) => Promise<void>

  createCar: (car: Car) => Promise<Car>
  saveCar: (id: string, car: Car) => Promise<Car>
  setCarStatus: (id: string, status: ListingStatus) => Promise<void>
  setCarAvailability: (id: string, unavailableDates: string[]) => Promise<void>
  deleteCar: (id: string) => Promise<void>

  createBooking: (input: Parameters<typeof bookingService.create>[0]) => Promise<Booking>
  setBookingStatus: (
    id: string,
    status: Booking['status'],
    paymentStatus?: string,
  ) => Promise<void>
  startPayment: (bookingId: string) => Promise<{ authorization_url: string; reference: string }>

  addReview: (input: { carId: string; rating: number; comment: string }) => Promise<void>
  replyToReview: (reviewId: string, comment: string) => Promise<void>

  setUserStatus: (id: string, status: User['status']) => Promise<void>
  setUserVerification: (id: string, verification: User['verification']) => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const DataContext = createContext<DataValue>(null as unknown as DataValue)

/**
 * The seed-data fallback is a dev/preview convenience. On a deployed site a
 * slow or crashed API must NOT quietly serve fake, bookable cars to real
 * visitors — production shows a reconnecting state and retries instead.
 * Set VITE_DEMO_FALLBACK=1 to keep the fallback in a hosted preview build.
 */
const ALLOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO_FALLBACK === '1'

/** Merges by id, letting the later (richer) record win. */
function mergeById<T extends { id: string }>(...lists: T[][]): T[] {
  const map = new Map<string, T>()
  for (const list of lists) {
    for (const item of list) map.set(item.id, { ...map.get(item.id), ...item })
  }
  return [...map.values()]
}

const groupReviews = (list: Review[]) =>
  list.reduce<Record<string, Review[]>>((acc, review) => {
    ;(acc[review.carId] ??= []).push(review)
    return acc
  }, {})

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useContext(AuthContext)

  const [publicCars, setPublicCars] = useState<Car[]>([])
  const [scopedCars, setScopedCars] = useState<Car[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [demoTransactions, setDemoTransactions] = useState<Transaction[]>([])

  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guards against a stale in-flight load overwriting a newer one.
  const loadId = useRef(0)

  /** Loads the bundled seed dataset so the whole UI stays explorable offline. */
  const loadDemo = useCallback(() => {
    setDemo(true)
    setPublicCars(seed.cars)
    setScopedCars([])
    setBookings(seed.bookings)
    setUsers(seed.allUsers)
    setReviews(groupReviews(seed.reviews))
    setDemoTransactions(seed.transactions)
    setAnalytics(null)
  }, [])

  const load = useCallback(async () => {
    const id = ++loadId.current
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled([
        carService.list(),
        user?.role === 'owner' ? carService.mine() : Promise.resolve([]),
        user?.role === 'admin' ? adminService.cars() : Promise.resolve([]),
        user?.role === 'owner'
          ? bookingService.forOwner()
          : user
            ? bookingService.mine()
            : Promise.resolve([]),
        user?.role === 'admin' ? adminService.bookings() : Promise.resolve([]),
        user?.role === 'admin' ? adminService.users() : Promise.resolve([]),
        user?.role === 'admin' ? adminService.analytics() : Promise.resolve(null),
      ])

      if (id !== loadId.current) return

      const [pub, mine, allCars, ownBookings, allBookings, allUsers, stats] = results

      // The public listing is the canary. If it fails, dev builds fall back to
      // the seed dataset; production keeps the store empty, surfaces a
      // reconnecting banner, and retries — real visitors must never browse
      // fake, bookable cars because the API had a cold start.
      if (pub.status === 'rejected') {
        setError(apiError(pub.reason))
        if (ALLOW_DEMO) {
          loadDemo()
          return
        }
        setDemo(false)
        setPublicCars([])
      } else {
        setDemo(false)
        setDemoTransactions([])
        setPublicCars(pub.value)
      }

      setScopedCars(
        mergeById(
          mine.status === 'fulfilled' ? mine.value : [],
          allCars.status === 'fulfilled' ? allCars.value : [],
        ),
      )

      setBookings(
        mergeById(
          ownBookings.status === 'fulfilled' ? ownBookings.value : [],
          allBookings.status === 'fulfilled' ? allBookings.value : [],
        ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      )

      setUsers(allUsers.status === 'fulfilled' ? allUsers.value : [])
      setAnalytics(stats.status === 'fulfilled' ? stats.value : null)
    } finally {
      if (id === loadId.current) setLoading(false)
    }
  }, [user, loadDemo])

  // Wait for the session to settle so we don't fire the anonymous load and then
  // immediately repeat it as the signed-in one.
  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, load])

  // Production self-heal: while the API is unreachable (Render cold start,
  // deploy in flight), retry every 15s until it answers.
  useEffect(() => {
    if (demo || !error || loading) return
    const id = setTimeout(load, 15_000)
    return () => clearTimeout(id)
  }, [demo, error, loading, load])

  const cars = useMemo(
    () => withBookedDates(mergeById(publicCars, scopedCars), bookings),
    [publicCars, scopedCars, bookings],
  )

  const transactions = useMemo(
    () => (demo ? demoTransactions : transactionsFromBookings(bookings)),
    [demo, demoTransactions, bookings],
  )

  /* ── Local state writers, shared by the API and demo paths ── */

  const upsertCar = useCallback((car: Car) => {
    setScopedCars((prev) => mergeById(prev, [car]))
    setPublicCars((prev) => (prev.some((c) => c.id === car.id) ? mergeById(prev, [car]) : prev))
  }, [])

  const dropCar = useCallback((id: string) => {
    setScopedCars((prev) => prev.filter((c) => c.id !== id))
    setPublicCars((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const upsertBooking = useCallback((booking: Booking) => {
    setBookings((prev) =>
      mergeById(prev, [booking]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }, [])

  const patchCarLocal = useCallback((id: string, patch: Partial<Car>) => {
    setScopedCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    setPublicCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  /* ── Reads ── */

  const getCar = useCallback((id: string) => cars.find((c) => c.id === id), [cars])

  const loadCar = useCallback(
    async (id: string) => {
      if (demo) return cars.find((c) => c.id === id)
      try {
        const car = await carService.get(id)
        upsertCar(car)
        return car
      } catch {
        return undefined
      }
    },
    [demo, cars, upsertCar],
  )

  const reviewsFor = useCallback((carId: string) => reviews[carId] ?? [], [reviews])

  const loadReviews = useCallback(
    async (carId: string) => {
      if (demo) return
      try {
        const list = await reviewService.forCar(carId)
        setReviews((prev) => ({ ...prev, [carId]: list }))
      } catch {
        // A car with no reviews is not an error worth surfacing.
      }
    },
    [demo],
  )

  /* ── Cars ── */

  const createCar = useCallback(
    async (car: Car) => {
      if (demo) {
        const created = { ...car, id: car.id || `car-${Date.now()}`, status: 'pending' as const }
        upsertCar(created)
        return created
      }
      const created = await carService.create(car)
      upsertCar(created)
      return created
    },
    [demo, upsertCar],
  )

  const saveCar = useCallback(
    async (id: string, car: Car) => {
      if (demo) {
        const updated = { ...car, id, status: 'pending' as const }
        upsertCar(updated)
        return updated
      }
      const updated = await carService.update(id, car)
      upsertCar(updated)
      return updated
    },
    [demo, upsertCar],
  )

  const setCarStatus = useCallback(
    async (id: string, status: ListingStatus) => {
      if (demo) {
        patchCarLocal(id, { status })
        return
      }
      // Admins go through the moderation endpoint; owners through their own car.
      const updated =
        user?.role === 'admin'
          ? await adminService.setCarStatus(id, status)
          : await carService.patch(id, { status })
      upsertCar(updated)
    },
    [demo, patchCarLocal, upsertCar, user?.role],
  )

  const setCarAvailability = useCallback(
    async (id: string, unavailableDates: string[]) => {
      if (demo) {
        patchCarLocal(id, { unavailableDates })
        return
      }
      const updated = await carService.patch(id, { unavailableDates })
      upsertCar(updated)
    },
    [demo, patchCarLocal, upsertCar],
  )

  const deleteCar = useCallback(
    async (id: string) => {
      if (!demo) await carService.remove(id)
      dropCar(id)
    },
    [demo, dropCar],
  )

  /* ── Bookings ── */

  const createBooking = useCallback(
    async (input: Parameters<typeof bookingService.create>[0]) => {
      if (demo) {
        const car = cars.find((c) => c.id === input.carId)
        const booking: Booking = {
          id: `bk-${Date.now()}`,
          reference: `AG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          carId: input.carId,
          car: car && {
            id: car.id,
            name: car.name,
            brand: car.brand,
            model: car.model,
            images: car.images,
            pickupLocation: car.pickupLocation,
          },
          customerId: user?.id ?? 'demo-user',
          ownerId: car?.ownerId ?? '',
          startDate: input.startDate,
          endDate: input.endDate,
          days: daysBetween(input.startDate, input.endDate),
          pickupLocation: input.pickupLocation,
          renter: input.renter,
          subtotal: input.subtotal,
          serviceFee: input.serviceFee,
          insuranceFee: input.insuranceFee,
          total: input.total,
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentReference: `PSK_${Math.random().toString(36).slice(2, 10)}`,
          createdAt: new Date().toISOString(),
        }
        upsertBooking(booking)
        patchCarLocal(input.carId, {
          unavailableDates: [
            ...(car?.unavailableDates ?? []),
            ...eachDate(input.startDate, input.endDate),
          ],
        })
        setDemoTransactions((prev) => [
          {
            id: `tx-${Date.now()}`,
            bookingId: booking.id,
            reference: booking.paymentReference!,
            type: 'payment',
            amount: booking.total,
            channel: 'card',
            status: 'success',
            createdAt: booking.createdAt,
          },
          ...prev,
        ])
        return booking
      }

      const booking = await bookingService.create(input)
      upsertBooking(booking)
      return booking
    },
    [demo, cars, user?.id, upsertBooking, patchCarLocal],
  )

  const setBookingStatus = useCallback(
    async (id: string, status: Booking['status'], paymentStatus?: string) => {
      if (demo) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status,
                  paymentStatus: (paymentStatus as Booking['paymentStatus']) ?? b.paymentStatus,
                }
              : b,
          ),
        )
        if (paymentStatus === 'refunded') {
          const booking = bookings.find((b) => b.id === id)
          if (booking) {
            setDemoTransactions((prev) => [
              {
                id: `tx-${Date.now()}`,
                bookingId: id,
                reference: `RFD_${booking.reference}`,
                type: 'refund',
                amount: booking.total,
                channel: 'card',
                status: 'success',
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ])
          }
        }
        return
      }
      const updated = await bookingService.setStatus(id, status, paymentStatus)
      upsertBooking(updated)
    },
    [demo, bookings, upsertBooking],
  )

  const startPayment = useCallback(
    async (bookingId: string) => {
      if (demo) {
        throw new Error('Payments need the AUTOGO API — this is the offline demo dataset.')
      }
      return paymentService.initialize(bookingId)
    },
    [demo],
  )

  /* ── Reviews ── */

  const addReview = useCallback(
    async (input: { carId: string; rating: number; comment: string }) => {
      if (demo) {
        const review: Review = {
          id: `rv-${Date.now()}`,
          carId: input.carId,
          bookingId: '',
          author: {
            id: user?.id ?? 'demo-user',
            name: user?.name ?? 'You',
            avatarUrl: user?.avatarUrl,
          },
          rating: input.rating,
          comment: input.comment,
          photos: [],
          createdAt: new Date().toISOString(),
        }
        setReviews((prev) => ({ ...prev, [input.carId]: [review, ...(prev[input.carId] ?? [])] }))
        const car = cars.find((c) => c.id === input.carId)
        if (car) {
          const count = car.reviewCount + 1
          patchCarLocal(input.carId, {
            reviewCount: count,
            rating: Math.round(((car.rating * car.reviewCount + input.rating) / count) * 10) / 10,
          })
        }
        return
      }
      await reviewService.create(input)
      await Promise.all([loadReviews(input.carId), loadCar(input.carId)])
    },
    [demo, user, cars, patchCarLocal, loadReviews, loadCar],
  )

  const replyToReview = useCallback(
    async (reviewId: string, comment: string) => {
      const reply = { comment, createdAt: new Date().toISOString() }
      if (!demo) await reviewService.reply(reviewId, comment)
      setReviews((prev) => {
        const next = { ...prev }
        for (const [carId, list] of Object.entries(next)) {
          next[carId] = list.map((r) => (r.id === reviewId ? { ...r, ownerReply: reply } : r))
        }
        return next
      })
    },
    [demo],
  )

  /* ── Users ── */

  const setUserStatus = useCallback(
    async (id: string, status: User['status']) => {
      if (!demo) await adminService.setUserStatus(id, { status })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
    },
    [demo],
  )

  const setUserVerification = useCallback(
    async (id: string, verification: User['verification']) => {
      if (!demo) await adminService.setUserStatus(id, { verification })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verification } : u)))
    },
    [demo],
  )

  const value = useMemo(
    () => ({
      cars,
      bookings,
      users,
      transactions,
      analytics,
      loading,
      demo,
      error,
      refresh: load,
      getCar,
      loadCar,
      reviewsFor,
      loadReviews,
      createCar,
      saveCar,
      setCarStatus,
      setCarAvailability,
      deleteCar,
      createBooking,
      setBookingStatus,
      startPayment,
      addReview,
      replyToReview,
      setUserStatus,
      setUserVerification,
    }),
    [
      cars,
      bookings,
      users,
      transactions,
      analytics,
      loading,
      demo,
      error,
      load,
      getCar,
      loadCar,
      reviewsFor,
      loadReviews,
      createCar,
      saveCar,
      setCarStatus,
      setCarAvailability,
      deleteCar,
      createBooking,
      setBookingStatus,
      startPayment,
      addReview,
      replyToReview,
      setUserStatus,
      setUserVerification,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
