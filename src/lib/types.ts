/** Shared domain model. Mirrors the shapes the API returns. */

export type Role = 'admin' | 'owner' | 'customer'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type AccountStatus = 'active' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  avatarUrl?: string
  verification: VerificationStatus
  status: AccountStatus
  createdAt: string
}

export type Transmission = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric'
export type BodyType = 'suv' | 'sedan' | 'hatchback' | 'pickup' | 'van' | 'coupe'

/** Set by the admin approval workflow — only `approved` cars are public. */
export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'

export interface CarFeatureSet {
  airConditioning: boolean
  bluetooth: boolean
  gps: boolean
  reverseCamera: boolean
  cruiseControl: boolean
  usbPorts: boolean
  leatherSeats: boolean
  sunroof: boolean
  childSeat: boolean
  androidAuto: boolean
}

export interface CarSpecs {
  engine: string
  horsepower: number
  driveType: 'fwd' | 'rwd' | 'awd' | '4wd'
  doors: number
}

export interface RentalPolicy {
  mileageLimitPerDay: number | null
  fuelPolicy: 'full-to-full' | 'same-to-same' | 'prepaid'
  minRentalDays: number
  cancellationWindowHours: number
  securityDeposit: number
  driverAgeMin: number
}

export interface InsuranceInfo {
  provider: string
  policyNumber: string
  coverage: string
  expiresAt: string
}

export interface Car {
  id: string
  ownerId: string
  owner?: Pick<User, 'id' | 'name' | 'avatarUrl' | 'verification' | 'createdAt'>

  name: string
  brand: string
  model: string
  year: number
  bodyType: BodyType
  transmission: Transmission
  fuelType: FuelType
  seats: number
  color: string
  registrationNumber: string
  vin?: string
  mileage: number

  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number

  pickupLocation: string
  city: string
  description: string

  features: CarFeatureSet
  specs: CarSpecs
  policy: RentalPolicy
  insurance: InsuranceInfo

  images: string[]
  gpsTrackerId?: string

  status: ListingStatus
  rating: number
  reviewCount: number
  tripCount: number
  /** ISO date strings the car is already booked or blocked out. */
  unavailableDates: string[]
  createdAt: string
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'

export interface RenterDetails {
  fullName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  governmentId?: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export interface Booking {
  id: string
  reference: string
  carId: string
  car?: Pick<Car, 'id' | 'name' | 'brand' | 'model' | 'images' | 'pickupLocation'>
  customerId: string
  ownerId: string

  startDate: string
  endDate: string
  days: number
  pickupLocation: string
  renter: RenterDetails

  /** Money is stored in whole naira; no fractional kobo in the UI. */
  subtotal: number
  serviceFee: number
  insuranceFee: number
  total: number

  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentReference?: string
  createdAt: string
}

export interface Review {
  id: string
  carId: string
  bookingId: string
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>
  rating: number
  comment: string
  photos: string[]
  ownerReply?: { comment: string; createdAt: string }
  createdAt: string
}

export interface Transaction {
  id: string
  bookingId: string
  reference: string
  type: 'payment' | 'refund' | 'payout'
  amount: number
  channel: 'card' | 'bank-transfer' | 'wallet'
  status: 'success' | 'pending' | 'failed'
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  href?: string
  createdAt: string
}

/** Query shape for the car search + filter page. */
export interface CarFilters {
  q: string
  brand: string
  bodyType: string
  transmission: string
  fuelType: string
  city: string
  seats: string
  minPrice: number
  maxPrice: number
  startDate: string
  endDate: string
  sort: 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
}
