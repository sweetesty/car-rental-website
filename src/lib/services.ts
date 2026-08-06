import { api } from './api'
import {
  toBooking,
  toBookingPayload,
  toCar,
  toCarPayload,
  toReview,
  toUser,
  type AnalyticsDTO,
  type AuthDTO,
  type BookingDTO,
  type CarDTO,
  type ReviewDTO,
  type UserDTO,
} from './adapters'
import type { Booking, Car, ListingStatus, Review, User } from './types'

/** One function per API endpoint. Everything above this line speaks domain types. */

/* ── Auth ── */

export const authService = {
  /**
   * Exchanges the current Firebase session for the AUTOGO user record.
   *
   * The server's `POST /auth/sync` verifies the ID token and either returns the
   * existing Mongo user or creates one — so this is the call for both sign-in
   * and sign-up. `role` and `phone` are only read when creating.
   */
  async sync(input: { role?: 'customer' | 'owner'; phone?: string } = {}) {
    const { data } = await api.post<AuthDTO>('/auth/sync', input)
    return toUser(data)
  },

  async me() {
    const { data } = await api.get<UserDTO>('/auth/me')
    return toUser(data)
  },

  async updateProfile(patch: { name?: string; phone?: string; verification?: string }) {
    const { data } = await api.put<UserDTO>('/auth/me', patch)
    return toUser(data)
  },
}

/* ── Cars ── */

export interface CarQuery {
  brand?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  transmission?: string
  seats?: number
  fuelType?: string
}

export const carService = {
  /** Public listings — the API only ever returns `approved` cars here. */
  async list(query: CarQuery = {}) {
    const { data } = await api.get<CarDTO[]>('/cars', { params: query })
    return data.map(toCar)
  },

  async get(id: string) {
    const { data } = await api.get<CarDTO>(`/cars/${id}`)
    return toCar(data)
  },

  async mine() {
    const { data } = await api.get<CarDTO[]>('/cars/mycars')
    return data.map(toCar)
  },

  async create(car: Car) {
    const { data } = await api.post<CarDTO>('/cars', toCarPayload(car))
    return toCar(data)
  },

  async update(id: string, car: Car) {
    const { data } = await api.put<CarDTO>(`/cars/${id}`, toCarPayload(car))
    return toCar(data)
  },

  /** Partial update — used for availability toggles and owner-side pausing. */
  async patch(id: string, patch: Record<string, unknown>) {
    const { data } = await api.put<CarDTO>(`/cars/${id}`, patch)
    return toCar(data)
  },

  async remove(id: string) {
    await api.delete(`/cars/${id}`)
  },
}

/* ── Bookings ── */

export const bookingService = {
  async create(input: Parameters<typeof toBookingPayload>[0]) {
    const { data } = await api.post<BookingDTO>('/bookings', toBookingPayload(input))
    return toBooking(data)
  },

  async mine() {
    const { data } = await api.get<BookingDTO[]>('/bookings/mybookings')
    return data.map(toBooking)
  },

  async forOwner() {
    const { data } = await api.get<BookingDTO[]>('/bookings/owner')
    return data.map(toBooking)
  },

  async get(id: string) {
    const { data } = await api.get<BookingDTO>(`/bookings/${id}`)
    return toBooking(data)
  },

  async setStatus(id: string, status: Booking['status'], paymentStatus?: string) {
    const { data } = await api.put<BookingDTO>(`/bookings/${id}/status`, {
      status,
      paymentStatus,
    })
    return toBooking(data)
  },
}

/* ── Payments ── */

export const paymentService = {
  /** Returns the Paystack checkout URL to redirect the customer to. */
  async initialize(bookingId: string) {
    const { data } = await api.post<{ authorization_url: string; reference: string }>(
      '/payments/initialize',
      { bookingId },
    )
    return data
  },

  async verify(reference: string) {
    const { data } = await api.post<{ message: string; booking: BookingDTO }>('/payments/verify', {
      reference,
    })
    return toBooking(data.booking)
  },
}

/* ── Reviews ── */

export const reviewService = {
  async forCar(carId: string): Promise<Review[]> {
    const { data } = await api.get<ReviewDTO[]>(`/reviews/${carId}`)
    return data.map(toReview)
  },

  async create(input: { carId: string; rating: number; comment: string }) {
    await api.post('/reviews', input)
  },

  async reply(reviewId: string, ownerReply: string) {
    const { data } = await api.put<ReviewDTO>(`/reviews/${reviewId}/reply`, { ownerReply })
    return toReview(data)
  },
}

/* ── Admin ── */

export const adminService = {
  async users(): Promise<User[]> {
    const { data } = await api.get<UserDTO[]>('/admin/users')
    return data.map(toUser)
  },

  async setUserStatus(id: string, patch: { status?: User['status']; verification?: string }) {
    const { data } = await api.put<UserDTO>(`/admin/users/${id}/status`, {
      ...patch,
      // Keep the legacy boolean in step for any code still reading it.
      ...(patch.verification ? { isVerified: patch.verification === 'verified' } : {}),
    })
    return toUser(data)
  },

  async setCarStatus(id: string, status: ListingStatus) {
    const { data } = await api.put<CarDTO>(`/admin/cars/${id}/status`, { status })
    return toCar(data)
  },

  async cars(): Promise<Car[]> {
    const { data } = await api.get<CarDTO[]>('/admin/cars')
    return data.map(toCar)
  },

  async bookings(): Promise<Booking[]> {
    const { data } = await api.get<BookingDTO[]>('/admin/bookings')
    return data.map(toBooking)
  },

  async analytics() {
    const { data } = await api.get<AnalyticsDTO>('/admin/analytics')
    return data
  },
}
