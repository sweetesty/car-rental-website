/**
 * WhatsApp deep links (`wa.me`).
 *
 * These need no API keys and no backend — they hand off to whatever WhatsApp
 * client the user already has. Server-side *notifications* are separate and
 * live in the API's whatsappService.
 */

/** AUTOGO support line. Overridable per deployment. */
export const SUPPORT_NUMBER = import.meta.env.VITE_WHATSAPP_SUPPORT ?? '2348000000000'

/**
 * Normalises a phone number to the digits-only E.164 form wa.me expects.
 *
 * Nigerian numbers are written locally as `0803 123 4567` — that leading zero
 * is a trunk prefix, not part of the international number, so it must be
 * swapped for the 234 country code rather than kept or simply stripped.
 * Returns null when the input can't be a real number, so callers can hide the
 * button instead of linking somewhere broken.
 */
export function toWaNumber(raw: string | undefined | null, defaultCountry = '234') {
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')
  if (!digits) return null

  // 00 is the international access prefix — the digits after it are already E.164.
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (digits.startsWith(defaultCountry)) {
    // Already international. Guard the ambiguous "2340..." case, where a local
    // number got the country code bolted on without dropping the trunk zero.
    const rest = digits.slice(defaultCountry.length)
    return rest.startsWith('0') ? defaultCountry + rest.slice(1) : digits
  }

  // Local trunk form: 0803… → 234803…
  if (digits.startsWith('0')) return defaultCountry + digits.slice(1)

  // Bare subscriber number, no trunk zero.
  if (digits.length <= 10) return defaultCountry + digits

  // Some other country's number, already international.
  return digits
}

/** Builds a wa.me URL, or null when the number is unusable. */
export function waLink(phone: string | undefined | null, message?: string) {
  const number = toWaNumber(phone)
  if (!number) return null
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${query}`
}

export const supportLink = (message?: string) =>
  `https://wa.me/${SUPPORT_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`

/* ── Prefilled message templates ────────────────────────────────── */

/**
 * Openers are written as the sender so the recipient gets context immediately —
 * an empty WhatsApp thread from a stranger about a car is useless to an owner.
 */
export const messages = {
  enquiry: (carName: string, dates?: { start: string; end: string }) =>
    dates
      ? `Hi, I found your ${carName} on AUTOGO. Is it available from ${dates.start} to ${dates.end}?`
      : `Hi, I found your ${carName} on AUTOGO. Is it available for hire?`,

  aboutBooking: (reference: string, carName: string) =>
    `Hi, I'm messaging about AUTOGO booking ${reference} for the ${carName}.`,

  toRenter: (reference: string, carName: string, ownerName: string) =>
    `Hi, this is ${ownerName} from AUTOGO — about your booking ${reference} for the ${carName}.`,

  support: (context?: string) =>
    context
      ? `Hi AUTOGO support, I need help with ${context}.`
      : 'Hi AUTOGO support, I need help with something.',
}
