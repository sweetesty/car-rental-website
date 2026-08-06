import type { Car } from './types'
import { daysBetween } from './format'

export const SERVICE_FEE_RATE = 0.1
export const INSURANCE_FEE_PER_DAY = 3500

export interface Quote {
  days: number
  /** Which rate tier the customer landed in, for the price breakdown line. */
  breakdown: { label: string; amount: number }[]
  subtotal: number
  serviceFee: number
  insuranceFee: number
  total: number
  savings: number
}

/**
 * Prices a rental by greedily applying the largest tier that fits — months,
 * then weeks, then days — so a 40-day booking pays the monthly rate, not 40×
 * the daily rate. `savings` is what the customer avoided vs. straight daily.
 */
export function quote(car: Car, startDate: string, endDate: string): Quote {
  const days = daysBetween(startDate, endDate)
  if (days <= 0) {
    return {
      days: 0,
      breakdown: [],
      subtotal: 0,
      serviceFee: 0,
      insuranceFee: 0,
      total: 0,
      savings: 0,
    }
  }

  const breakdown: Quote['breakdown'] = []
  let remaining = days
  let subtotal = 0

  const months = Math.floor(remaining / 30)
  if (months > 0 && car.pricePerMonth > 0) {
    const amount = months * car.pricePerMonth
    breakdown.push({ label: `${months} × monthly rate (30 days)`, amount })
    subtotal += amount
    remaining -= months * 30
  }

  const weeks = Math.floor(remaining / 7)
  if (weeks > 0 && car.pricePerWeek > 0) {
    const amount = weeks * car.pricePerWeek
    breakdown.push({ label: `${weeks} × weekly rate (7 days)`, amount })
    subtotal += amount
    remaining -= weeks * 7
  }

  if (remaining > 0) {
    const amount = remaining * car.pricePerDay
    breakdown.push({ label: `${remaining} × daily rate`, amount })
    subtotal += amount
  }

  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  const insuranceFee = days * INSURANCE_FEE_PER_DAY

  return {
    days,
    breakdown,
    subtotal,
    serviceFee,
    insuranceFee,
    total: subtotal + serviceFee + insuranceFee,
    savings: Math.max(0, days * car.pricePerDay - subtotal),
  }
}

/** True when none of the requested days collide with the car's blocked dates. */
export function isAvailable(car: Car, startDate: string, endDate: string) {
  if (!startDate || !endDate) return true
  const blocked = new Set(car.unavailableDates)
  const end = new Date(endDate)
  for (const d = new Date(startDate); d <= end; d.setDate(d.getDate() + 1)) {
    if (blocked.has(d.toISOString().slice(0, 10))) return false
  }
  return true
}
