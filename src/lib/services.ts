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

  async updateProfile(patch: {
    name?: string
    phone?: string
    avatarUrl?: string
    verification?: string
    kyc?: Partial<Record<KycDocument, string>>
  }) {
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

/* ── Platform config ── */

export interface PlatformConfig {
  serviceFeeRate: number
  serviceFeePercent: number
  insuranceFeePerDay: number
  cancellationRefundRate: number
  currency: string
}

export const configService = {
  /**
   * Commercial rates, read from the server rather than hardcoded here.
   *
   * The API is the authority on what a booking costs. Keeping a second copy in
   * this bundle is exactly how a quoted price drifts from a charged one after
   * someone adjusts the fee.
   */
  async get() {
    const { data } = await api.get<PlatformConfig>('/config')
    return data
  },
}

/* ── Uploads ── */

export interface UploadedImage {
  url: string
  publicId: string
}

export type KycDocument = 'governmentId' | 'driversLicence' | 'selfie'

export const uploadService = {
  /**
   * Sends the files as multipart/form-data. The Content-Type header is deleted
   * so the browser sets it itself — it has to append the multipart boundary,
   * which our JSON default would otherwise clobber.
   */
  async carImages(files: File[], onProgress?: (percent: number) => void) {
    const form = new FormData()
    for (const file of files) form.append('images', file)

    const { data } = await api.post<{ images: UploadedImage[] }>('/uploads/car-images', form, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    })
    return data.images
  },

  /**
   * Uploads one identity document. The server stores it with authenticated
   * delivery and returns only its public ID — there is no readable URL to hand
   * back, which is the whole point for a government ID.
   */
  async kyc(file: File, kind: KycDocument) {
    const form = new FormData()
    form.append('document', file)
    form.append('kind', kind)
    const { data } = await api.post<{ kind: KycDocument; publicId: string }>('/uploads/kyc', form, {
      headers: { 'Content-Type': undefined },
    })
    return data.publicId
  },

  async avatar(file: File) {
    const form = new FormData()
    form.append('image', file)
    const { data } = await api.post<UploadedImage>('/uploads/avatar', form, {
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async remove(publicId: string) {
    await api.delete('/uploads', { params: { publicId } })
  },
}

/* ── Admin ── */

/**
 * What an admin may change on a listing besides its status.
 *
 * Both are optional and absence is meaningful: omitting `commissionPercent`
 * keeps the current rate (null resets it to the platform default), and omitting
 * `prices` leaves the owner's own rates alone.
 */
export type CarModeration = {
  commissionPercent?: number | null
  prices?: { perDay: number; perWeek: number; perMonth: number }
}

export interface KycReview {
  user: { id: string; name: string; email: string; verification: string }
  submittedAt: string | null
  rejectionReason: string | null
  /** Null for a document the person has not uploaded yet. */
  documents: Record<KycDocument, string | null>
  expiresInSeconds: number
}

export const adminService = {
  async users(): Promise<User[]> {
    const { data } = await api.get<UserDTO[]>('/admin/users')
    return data.map(toUser)
  },

  async setUserStatus(
    id: string,
    patch: { status?: User['status']; verification?: string; rejectionReason?: string },
  ) {
    const { data } = await api.put<UserDTO>(`/admin/users/${id}/status`, {
      ...patch,
      // Keep the legacy boolean in step for any code still reading it.
      ...(patch.verification ? { isVerified: patch.verification === 'verified' } : {}),
    })
    return toUser(data)
  },

  /**
   * Short-lived signed links to a user's identity documents.
   *
   * The URLs expire ten minutes after this call, so they are fetched when the
   * review modal opens rather than cached with the user list — a link copied
   * out of the page stops working shortly after, which is the point.
   */
  async userKyc(id: string) {
    const { data } = await api.get<KycReview>(`/admin/users/${id}/kyc`)
    return data
  },

  /**
   * Approve, reject or suspend a listing — and optionally set the commission
   * AUTOGO takes on it. Pass null to clear it back to the platform default;
   * omit it entirely to leave the existing rate alone.
   */
  async setCarStatus(id: string, status: ListingStatus, overrides: CarModeration = {}) {
    const { commissionPercent, prices } = overrides
    const { data } = await api.put<CarDTO>(`/admin/cars/${id}/status`, {
      status,
      ...(commissionPercent !== undefined ? { commissionPercent } : {}),
      // Only sent when the admin actually edited a rate — the server emails the
      // owner about every change, so a no-op submit must send nothing.
      ...(prices ? { prices } : {}),
    })
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
