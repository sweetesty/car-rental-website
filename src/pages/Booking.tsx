import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
} from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Misc'
import { Checkbox, Input, Select } from '@/components/ui/Field'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { addDays, cx, formatDate, money, todayISO } from '@/lib/format'
import { isAvailable, quote } from '@/lib/pricing'
import { CITIES } from '@/lib/catalog'
import type { Booking as BookingType, RenterDetails } from '@/lib/types'

const STEPS = ['Dates', 'Your details', 'Review', 'Payment'] as const


export default function Booking() {
  const { carId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getCar, loadCar, createBooking, startPayment, demo } = useData()
  const { user } = useAuth()
  const toast = useToast()

  const car = getCar(carId)

  // Deep links land here before the car list has loaded.
  useEffect(() => {
    if (carId && !car) loadCar(carId)
  }, [carId, car, loadCar])
  const passed = location.state as { startDate?: string; endDate?: string } | null

  const [step, setStep] = useState(0)
  const [startDate, setStartDate] = useState(passed?.startDate ?? addDays(todayISO(), 1))
  const [endDate, setEndDate] = useState(passed?.endDate ?? addDays(todayISO(), 4))
  const [pickupCity, setPickupCity] = useState(car?.city ?? CITIES[0])
  const [agreed, setAgreed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [renter, setRenter] = useState<RenterDetails>({
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    licenseNumber: '',
    licenseExpiry: '',
    governmentId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })

  const priced = useMemo(
    () => (car ? quote(car, startDate, endDate) : null),
    [car, startDate, endDate],
  )
  const available = car ? isAvailable(car, startDate, endDate) : false

  if (!car) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={AlertTriangle}
          title="Car not found"
          message="We couldn't find the listing you were trying to book."
          action={<LinkButton to="/cars">Browse cars</LinkButton>}
        />
      </div>
    )
  }

  const set = (key: keyof RenterDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRenter((r) => ({ ...r, [key]: e.target.value }))

  const validateStep = () => {
    const next: Record<string, string> = {}

    if (step === 0) {
      if (!priced || priced.days <= 0) next.dates = 'Choose a valid date range.'
      else if (!available) next.dates = 'Those dates are already booked on this car.'
      else if (priced.days < car.policy.minRentalDays)
        next.dates = `This car has a ${car.policy.minRentalDays}-day minimum rental.`
    }

    if (step === 1) {
      if (renter.fullName.trim().length < 3) next.fullName = 'Enter your full name.'
      if (!/^\S+@\S+\.\S+$/.test(renter.email)) next.email = 'Enter a valid email address.'
      if (renter.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number.'
      if (renter.licenseNumber.trim().length < 5)
        next.licenseNumber = "Enter your driver's licence number."
      if (!renter.licenseExpiry) next.licenseExpiry = 'Enter the licence expiry date.'
      else if (renter.licenseExpiry <= endDate)
        next.licenseExpiry = 'Your licence must stay valid through the rental.'
      if (renter.emergencyContactName.trim().length < 3)
        next.emergencyContactName = 'Add an emergency contact.'
      if (renter.emergencyContactPhone.replace(/\D/g, '').length < 10)
        next.emergencyContactPhone = 'Enter a valid phone number.'
    }

    if (step === 2 && !agreed) {
      next.agreed = 'Accept the rental policies to continue.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  /**
   * Two API calls: create the booking (server re-checks availability), then ask
   * for a Paystack checkout URL and hand the browser over to it. Paystack
   * redirects back and `/bookings/:id/confirmed` verifies the reference.
   */
  const pay = async () => {
    if (!user || !priced) return
    setProcessing(true)

    let booking: BookingType
    try {
      booking = await createBooking({
        carId: car.id,
        startDate,
        endDate,
        pickupLocation: `${car.pickupLocation} (${pickupCity})`,
        renter,
        subtotal: priced.subtotal,
        serviceFee: priced.serviceFee,
        insuranceFee: priced.insuranceFee,
        total: priced.total,
      })
    } catch (err) {
      setProcessing(false)
      setStep(0)
      setErrors({ dates: apiError(err) })
      toast(apiError(err), 'error')
      return
    }

    // The offline demo dataset has no payment gateway — the booking is already
    // marked paid, so go straight to the confirmation.
    if (demo) {
      setProcessing(false)
      toast('Payment confirmed. Your booking is locked in.')
      navigate(`/bookings/${booking.id}/confirmed`, { replace: true })
      return
    }

    try {
      const { authorization_url } = await startPayment(booking.id)
      window.location.href = authorization_url
    } catch (err) {
      // The booking exists and is held; only the payment hand-off failed.
      setProcessing(false)
      toast(
        `${apiError(err)} Your booking ${booking.reference} is held as unpaid — you can pay from My bookings.`,
        'error',
      )
      navigate(`/bookings/${booking.id}/confirmed`, { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={`/cars/${car.id}`}
        className="text-dim hover:text-brand-600 mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to {car.name}
      </Link>

      <h1 className="text-3xl font-black tracking-tight">Complete your booking</h1>

      <ol className="mt-8 mb-10 flex items-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cx(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                i < step && 'bg-brand-600 text-white dark:bg-brand-500 dark:text-ink-950',
                i === step && 'bg-brand-600 text-white ring-4 ring-brand-200 dark:bg-brand-500 dark:text-ink-950 dark:ring-brand-900',
                i > step && 'surface-sunken text-dim border',
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cx(
                'hidden text-sm font-semibold sm:block',
                i === step ? '' : 'text-dim',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cx(
                  'h-px flex-1 transition-colors',
                  i < step ? 'bg-brand-500' : 'bg-ink-200 dark:bg-ink-800',
                )}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold tracking-tight">Pickup and return</h2>
                  <p className="text-dim mt-1 text-sm">
                    We check the owner's calendar live before letting you continue.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Input
                      type="date"
                      label="Pickup date"
                      required
                      value={startDate}
                      min={todayISO()}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        if (e.target.value >= endDate) setEndDate(addDays(e.target.value, 1))
                      }}
                    />
                    <Input
                      type="date"
                      label="Return date"
                      required
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <Select
                    className="mt-4"
                    label="Pickup city"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    options={CITIES.map((c) => ({ value: c, label: c }))}
                    hint={`Owner's default handover point is ${car.pickupLocation}.`}
                  />

                  {errors.dates && (
                    <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      {errors.dates}
                    </p>
                  )}

                  {available && priced && priced.days > 0 && (
                    <p className="text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 mt-4 flex items-center gap-2 rounded-lg p-3 text-sm">
                      <Check className="size-4 shrink-0" />
                      Available for all {priced.days} days.
                    </p>
                  )}
                </Card>
              )}

              {step === 1 && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold tracking-tight">Driver details</h2>
                  <p className="text-dim mt-1 text-sm">
                    These are shared with the owner once the booking is confirmed.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Full name"
                        required
                        value={renter.fullName}
                        onChange={set('fullName')}
                        error={errors.fullName}
                      />
                      <Input
                        type="email"
                        label="Email"
                        required
                        value={renter.email}
                        onChange={set('email')}
                        error={errors.email}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        type="tel"
                        label="Phone number"
                        required
                        placeholder="+234 800 000 0000"
                        value={renter.phone}
                        onChange={set('phone')}
                        error={errors.phone}
                      />
                      <Input
                        label="Government ID (optional)"
                        placeholder="NIN or international passport"
                        value={renter.governmentId}
                        onChange={set('governmentId')}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Driver's licence number"
                        required
                        value={renter.licenseNumber}
                        onChange={set('licenseNumber')}
                        error={errors.licenseNumber}
                      />
                      <Input
                        type="date"
                        label="Licence expiry"
                        required
                        min={endDate}
                        value={renter.licenseExpiry}
                        onChange={set('licenseExpiry')}
                        error={errors.licenseExpiry}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <p className="mb-4 text-sm font-bold">Emergency contact</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Contact name"
                          required
                          value={renter.emergencyContactName}
                          onChange={set('emergencyContactName')}
                          error={errors.emergencyContactName}
                        />
                        <Input
                          type="tel"
                          label="Contact phone"
                          required
                          value={renter.emergencyContactPhone}
                          onChange={set('emergencyContactPhone')}
                          error={errors.emergencyContactPhone}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {step === 2 && priced && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold tracking-tight">Review your booking</h2>

                  <dl className="mt-6 divide-y text-sm">
                    <Row label="Car" value={`${car.name} · ${car.year}`} />
                    <Row label="Pickup" value={`${formatDate(startDate)} — ${car.pickupLocation}`} />
                    <Row label="Return" value={formatDate(endDate)} />
                    <Row label="Duration" value={`${priced.days} days`} />
                    <Row label="Driver" value={renter.fullName} />
                    <Row label="Contact" value={`${renter.phone} · ${renter.email}`} />
                    <Row label="Licence" value={renter.licenseNumber} />
                    <Row
                      label="Emergency contact"
                      value={`${renter.emergencyContactName} · ${renter.emergencyContactPhone}`}
                    />
                  </dl>

                  <div className="surface-sunken mt-6 rounded-lg border p-4 text-sm">
                    <p className="font-bold">Before you pay</p>
                    <ul className="text-dim mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                      {/* Stated before payment, not discovered after it. The
                          car comes off the market for these dates the moment
                          this is confirmed. */}
                      <li>
                        <span className="font-bold">Bookings are non-refundable.</span> Cancelling
                        does not return the amount paid, so check your dates before you continue.
                      </li>
                      <li>
                        {car.policy.mileageLimitPerDay
                          ? `${car.policy.mileageLimitPerDay} km/day included; extra km at ₦120.`
                          : 'Unlimited mileage.'}
                      </li>
                      <li>Minimum driver age {car.policy.driverAgeMin}.</li>
                    </ul>
                  </div>

                  <div className="mt-5">
                    <Checkbox
                      checked={agreed}
                      onChange={setAgreed}
                      label="I've read and accept the rental policies and cancellation terms."
                    />
                    {errors.agreed && (
                      <p className="mt-1 text-xs text-red-600">{errors.agreed}</p>
                    )}
                  </div>
                </Card>
              )}

              {step === 3 && priced && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold tracking-tight">Payment</h2>
                  <p className="text-dim mt-1 text-sm">
                    Processed by Paystack. Your money is held until the handover is complete.
                  </p>

                  {/*
                    One statement, no options.

                    This was a radio group of card / transfer / wallet, but
                    `pay()` never read the selection — all three went to the
                    same Paystack checkout, and "bank transfer" revealed a
                    hardcoded account nobody monitors. Anything that cannot be
                    chosen should not look choosable, so the methods are named
                    in a sentence instead: true, and no false affordance.
                  */}
                  <div className="surface-sunken mt-6 rounded-xl border p-5">
                    <p className="flex items-center gap-2.5 font-bold">
                      <Lock className="text-brand-600 dark:text-brand-400 size-4.5" />
                      Pay {money(priced.total)} on Paystack
                    </p>
                    <p className="text-dim mt-2 text-sm leading-relaxed">
                      Continuing takes you to Paystack's secure page, where you can pay by card,
                      bank transfer or USSD — including from Opay, PalmPay or Moniepoint. You come
                      straight back here once it's done.
                    </p>
                  </div>

                  <p className="text-dim mt-4 text-sm leading-relaxed">
                    AUTOGO only ever collects payment through Paystack. Never send money to a bank
                    account someone gives you anywhere else, even if it uses our name.
                  </p>

                  <p className="text-dim mt-6 flex items-center justify-center gap-2 text-xs">
                    <Lock className="size-3.5" />
                    256-bit TLS. AUTOGO never stores your card details.
                  </p>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="secondary" onClick={back} disabled={step === 0 || processing}>
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={pay} loading={processing} size="lg">
                Pay {priced ? money(priced.total) : ''}
              </Button>
            )}
          </div>
        </div>

        <aside>
          <Card className="sticky top-24 overflow-hidden">
            <img src={car.images[0]} alt="" className="aspect-16/10 w-full object-cover" />
            <div className="p-5">
              <p className="font-bold tracking-tight">{car.name}</p>
              <p className="text-dim mt-0.5 text-sm">{car.pickupLocation}</p>

              {priced && priced.days > 0 && (
                <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
                  {priced.breakdown.map((line) => (
                    <div key={line.label} className="flex justify-between gap-3">
                      <dt className="text-dim">{line.label}</dt>
                      <dd className="tabular-nums">{money(line.amount)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Service fee (10%)</dt>
                    <dd className="tabular-nums">{money(priced.serviceFee)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Insurance</dt>
                    <dd className="tabular-nums">{money(priced.insuranceFee)}</dd>
                  </div>
                  {priced.savings > 0 && (
                    <div className="text-brand-700 dark:text-brand-300 flex justify-between gap-3 font-semibold">
                      <dt>Long-rental discount</dt>
                      <dd className="tabular-nums">−{money(priced.savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 border-t pt-3 text-base font-black">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{money(priced.total)}</dd>
                  </div>
                </dl>
              )}

            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-dim shrink-0">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}
