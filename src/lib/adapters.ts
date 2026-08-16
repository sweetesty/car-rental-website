import type {
  Booking,
  BookingStatus,
  Car,
  CarFeatureSet,
  PaymentStatus,
  Review,
  Transaction,
  User,
  VerificationStatus,
} from './types'
import { FEATURE_LABELS } from './catalog'
import { daysBetween, eachDate, toISODate } from './format'

/**
 * Translation layer between the Mongo/Express DTOs and the richer domain model
 * the UI works in. The API is the source of truth; anything it doesn't store
 * gets a documented default here rather than being faked further up the tree.
 */

/* ── Server DTOs ─────────────────────────────────────────────────── */

export interface UserDTO {
  _id: string
  name: string
  email: string
  role: 'admin' | 'owner' | 'customer'
  phone?: string
  avatarUrl?: string
  isVerified?: boolean
  verification?: VerificationStatus
  status?: 'active' | 'suspended'
  createdAt?: string
}

export interface AuthDTO extends UserDTO {
  token: string
}

export interface CarDTO {
  _id: string
  owner: string | UserDTO
  name: string
  brand: string
  model: string
  year: number
  transmission: string
  fuelType: string
  seatingCapacity: number
  color: string
  registrationNumber: string
  vin?: string
  mileage?: number
  prices: { perDay: number; perWeek?: number; perMonth?: number }
  pickupLocation: string
  description: string
  features?: string[]
  insuranceInfo?: string
  images?: string[]
  gpsTrackerId?: string
  status: Car['status']
  rating?: number
  numReviews?: number
  createdAt?: string

  // Added to the schema so the upload form round-trips without losing data.
  bodyType?: Car['bodyType']
  city?: string
  specs?: Partial<Car['specs']>
  policy?: Partial<Car['policy']>
  insurance?: Partial<Car['insurance']>
  unavailableDates?: string[]
  tripCount?: number
  commissionPercent?: number | null
}

export interface BookingDTO {
  _id: string
  car: string | CarDTO
  customer: string | UserDTO
  pickupDate: string
  returnDate: string
  pickupLocation: string
  totalCost: number
  status: BookingStatus
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  paymentMethod?: string
  transactionReference?: string
  createdAt?: string

  reference?: string
  renter?: Booking['renter']
  subtotal?: number
  serviceFee?: number
  insuranceFee?: number
}

export interface ReviewDTO {
  _id: string
  car: string | CarDTO
  customer: string | UserDTO
  rating: number
  comment: string
  ownerReply?: string
  photos?: string[]
  createdAt?: string
}

export interface AnalyticsDTO {
  totalUsers: number
  totalCars: number
  totalBookings: number
  revenue: number
}

/* ── Helpers ─────────────────────────────────────────────────────── */

const isPopulated = <T extends { _id: string }>(value: string | T): value is T =>
  typeof value === 'object' && value !== null

const idOf = (value: string | { _id: string }) => (isPopulated(value) ? value._id : value)

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as (keyof CarFeatureSet)[]

/** The API stores features as a label array; the UI wants a keyed record. */
function featuresFromList(list: string[] = []): CarFeatureSet {
  const present = new Set(list.map((f) => f.toLowerCase().trim()))
  const out = {} as CarFeatureSet
  for (const key of FEATURE_KEYS) {
    out[key] = present.has(key.toLowerCase()) || present.has(FEATURE_LABELS[key].toLowerCase())
  }
  return out
}

/** Sends feature *keys* so the round-trip is lossless regardless of label edits. */
export const featuresToList = (features: CarFeatureSet) =>
  FEATURE_KEYS.filter((key) => features[key])

/** The server's boolean flag can't express "pending", so prefer the enum. */
function verificationOf(dto: UserDTO): VerificationStatus {
  if (dto.verification) return dto.verification
  return dto.isVerified ? 'verified' : 'unverified'
}

/* ── Server → domain ─────────────────────────────────────────────── */

export function toUser(dto: UserDTO): User {
  return {
    id: dto._id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    avatarUrl: dto.avatarUrl,
    verification: verificationOf(dto),
    status: dto.status ?? 'active',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

export function toCar(dto: CarDTO): Car {
  const perDay = dto.prices?.perDay ?? 0
  const owner = isPopulated(dto.owner) ? toUser(dto.owner) : undefined

  return {
    id: dto._id,
    ownerId: idOf(dto.owner),
    owner: owner && {
      id: owner.id,
      name: owner.name,
      avatarUrl: owner.avatarUrl,
      verification: owner.verification,
      createdAt: owner.createdAt,
      phone: owner.phone,
    },

    name: dto.name,
    brand: dto.brand,
    model: dto.model,
    year: dto.year,
    bodyType: dto.bodyType ?? 'sedan',
    transmission: (dto.transmission?.toLowerCase() as Car['transmission']) ?? 'automatic',
    fuelType: (dto.fuelType?.toLowerCase() as Car['fuelType']) ?? 'petrol',
    seats: dto.seatingCapacity,
    color: dto.color,
    registrationNumber: dto.registrationNumber,
    vin: dto.vin,
    mileage: dto.mileage ?? 0,

    // Fall back to the standard multiples when an owner left a tier blank.
    pricePerDay: perDay,
    pricePerWeek: dto.prices?.perWeek || perDay * 7,
    pricePerMonth: dto.prices?.perMonth || perDay * 30,

    pickupLocation: dto.pickupLocation,
    city: dto.city ?? dto.pickupLocation?.split(',').pop()?.trim() ?? '',
    description: dto.description,

    features: featuresFromList(dto.features),
    specs: {
      engine: dto.specs?.engine ?? '—',
      horsepower: dto.specs?.horsepower ?? 0,
      driveType: dto.specs?.driveType ?? 'fwd',
      doors: dto.specs?.doors ?? 4,
    },
    policy: {
      mileageLimitPerDay: dto.policy?.mileageLimitPerDay ?? null,
      fuelPolicy: dto.policy?.fuelPolicy ?? 'full-to-full',
      minRentalDays: dto.policy?.minRentalDays ?? 1,
      cancellationWindowHours: dto.policy?.cancellationWindowHours ?? 48,
      securityDeposit: dto.policy?.securityDeposit ?? 0,
      driverAgeMin: dto.policy?.driverAgeMin ?? 23,
    },
    insurance: {
      provider: dto.insurance?.provider ?? dto.insuranceInfo ?? 'Not supplied',
      policyNumber: dto.insurance?.policyNumber ?? '—',
      coverage: dto.insurance?.coverage ?? dto.insuranceInfo ?? 'See owner for details',
      expiresAt: dto.insurance?.expiresAt ?? '',
    },

    images: dto.images?.length ? dto.images : [PLACEHOLDER_IMAGE],
    gpsTrackerId: dto.gpsTrackerId,

    status: dto.status,
    rating: dto.rating ?? 0,
    reviewCount: dto.numReviews ?? 0,
    tripCount: dto.tripCount ?? 0,
    commissionPercent: dto.commissionPercent ?? null,
    unavailableDates: dto.unavailableDates ?? [],
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=70'

const EMPTY_RENTER: Booking['renter'] = {
  fullName: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
}

/** The API's payment enum uses `pending` where the UI says `unpaid`. */
const PAYMENT_MAP: Record<BookingDTO['paymentStatus'], PaymentStatus> = {
  pending: 'unpaid',
  paid: 'paid',
  refunded: 'refunded',
  failed: 'failed',
}

export function toBooking(dto: BookingDTO): Booking {
  const car = isPopulated(dto.car) ? toCar(dto.car) : undefined
  const customer = isPopulated(dto.customer) ? toUser(dto.customer) : undefined
  const startDate = toISODate(new Date(dto.pickupDate))
  const endDate = toISODate(new Date(dto.returnDate))
  const total = dto.totalCost ?? 0

  return {
    id: dto._id,
    reference: dto.reference ?? dto.transactionReference ?? `AG-${dto._id.slice(-6).toUpperCase()}`,
    carId: idOf(dto.car),
    car: car && {
      id: car.id,
      name: car.name,
      brand: car.brand,
      model: car.model,
      images: car.images,
      pickupLocation: car.pickupLocation,
    },
    customerId: idOf(dto.customer),
    ownerId: car?.ownerId ?? '',

    startDate,
    endDate,
    days: daysBetween(startDate, endDate),
    pickupLocation: dto.pickupLocation,
    renter: dto.renter ?? {
      ...EMPTY_RENTER,
      fullName: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
    },

    // Older bookings only stored a total — treat the whole thing as the subtotal.
    subtotal: dto.subtotal ?? total,
    serviceFee: dto.serviceFee ?? 0,
    insuranceFee: dto.insuranceFee ?? 0,
    total,

    status: dto.status,
    paymentStatus: PAYMENT_MAP[dto.paymentStatus] ?? 'unpaid',
    paymentReference: dto.transactionReference,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

export function toReview(dto: ReviewDTO): Review {
  const author = isPopulated(dto.customer) ? toUser(dto.customer) : undefined
  return {
    id: dto._id,
    carId: idOf(dto.car),
    bookingId: '',
    author: {
      id: author?.id ?? idOf(dto.customer),
      name: author?.name ?? 'AUTOGO renter',
      avatarUrl: author?.avatarUrl,
    },
    rating: dto.rating,
    comment: dto.comment,
    photos: dto.photos ?? [],
    ownerReply: dto.ownerReply
      ? { comment: dto.ownerReply, createdAt: dto.createdAt ?? '' }
      : undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

/**
 * There is no Transaction collection server-side — the money ledger is derived
 * from booking payment state, which is the same source the API bills from.
 */
export function transactionsFromBookings(bookings: Booking[]): Transaction[] {
  const out: Transaction[] = []
  for (const booking of bookings) {
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
      out.push({
        id: `${booking.id}-payment`,
        bookingId: booking.id,
        reference: booking.paymentReference ?? booking.reference,
        type: 'payment',
        amount: booking.total,
        channel: 'card',
        status: 'success',
        createdAt: booking.createdAt,
      })
    }
    if (booking.paymentStatus === 'refunded') {
      out.push({
        id: `${booking.id}-refund`,
        bookingId: booking.id,
        reference: `RFD_${booking.reference}`,
        type: 'refund',
        amount: booking.total,
        channel: 'card',
        status: 'success',
        createdAt: booking.createdAt,
      })
    }
    if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
      out.push({
        id: `${booking.id}-payout`,
        bookingId: booking.id,
        reference: `PYT_${booking.reference}`,
        type: 'payout',
        amount: booking.subtotal,
        channel: 'bank-transfer',
        status: 'success',
        createdAt: booking.createdAt,
      })
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Availability lives on the car document, but confirmed bookings also block
 * dates. Merging here keeps the calendar honest even for bookings made by
 * someone else in another session.
 */
export function withBookedDates(cars: Car[], bookings: Booking[]): Car[] {
  const blocked = new Map<string, Set<string>>()
  for (const booking of bookings) {
    if (['cancelled', 'rejected'].includes(booking.status)) continue
    const set = blocked.get(booking.carId) ?? new Set<string>()
    for (const date of eachDate(booking.startDate, booking.endDate)) set.add(date)
    blocked.set(booking.carId, set)
  }
  return cars.map((car) => {
    const extra = blocked.get(car.id)
    if (!extra) return car
    return { ...car, unavailableDates: [...new Set([...car.unavailableDates, ...extra])] }
  })
}

/* ── Domain → server ─────────────────────────────────────────────── */

/** Payload for POST/PUT /api/cars. */
export function toCarPayload(car: Car) {
  return {
    name: car.name,
    brand: car.brand,
    model: car.model,
    year: car.year,
    transmission: car.transmission,
    fuelType: car.fuelType,
    seatingCapacity: car.seats,
    color: car.color,
    registrationNumber: car.registrationNumber,
    vin: car.vin,
    mileage: car.mileage,
    prices: {
      perDay: car.pricePerDay,
      perWeek: car.pricePerWeek,
      perMonth: car.pricePerMonth,
    },
    pickupLocation: car.pickupLocation,
    description: car.description,
    features: featuresToList(car.features),
    insuranceInfo: `${car.insurance.provider} — ${car.insurance.coverage}`,
    images: car.images,
    gpsTrackerId: car.gpsTrackerId,

    bodyType: car.bodyType,
    city: car.city,
    specs: car.specs,
    policy: car.policy,
    insurance: car.insurance,
  }
}

/** Payload for POST /api/bookings. */
export function toBookingPayload(input: {
  carId: string
  startDate: string
  endDate: string
  pickupLocation: string
  renter: Booking['renter']
  subtotal: number
  serviceFee: number
  insuranceFee: number
  total: number
}) {
  return {
    car: input.carId,
    pickupDate: input.startDate,
    returnDate: input.endDate,
    pickupLocation: input.pickupLocation,
    totalCost: input.total,
    subtotal: input.subtotal,
    serviceFee: input.serviceFee,
    insuranceFee: input.insuranceFee,
    renter: input.renter,
  }
}
