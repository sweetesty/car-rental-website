import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Info, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Misc'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field'
import { useAuth, useData, useToast } from '@/lib/hooks'
import { apiError } from '@/lib/api'
import { uploadService, type UploadedImage } from '@/lib/services'
import { addDays, cx, todayISO } from '@/lib/format'
import {
  BODY_TYPES,
  BRANDS,
  CITIES,
  DRIVE_TYPES,
  FEATURE_LABELS,
  FUEL_TYPES,
  TRANSMISSIONS,
} from '@/lib/catalog'
import type { Car, CarFeatureSet } from '@/lib/types'

const EMPTY_FEATURES: CarFeatureSet = {
  airConditioning: true,
  bluetooth: true,
  gps: false,
  reverseCamera: false,
  cruiseControl: false,
  usbPorts: true,
  leatherSeats: false,
  sunroof: false,
  childSeat: false,
  androidAuto: false,
}

/** Matches the server's multer limits in uploadRoutes.js. */
const MAX_IMAGES = 8
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** Shared by "List a car" and "Edit car" — the `id` param decides which. */
export default function CarForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCar, createCar, saveCar, loadCar } = useData()
  const { user } = useAuth()
  const toast = useToast()

  const existing = id ? getCar(id) : undefined
  const isEdit = !!existing

  const [form, setForm] = useState(() => seed(existing))
  const [features, setFeatures] = useState<CarFeatureSet>(existing?.features ?? EMPTY_FEATURES)
  const [images, setImages] = useState<string[]>(existing?.images ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  // Cloudinary ids for images uploaded in this session, so removing one can
  // delete it remotely instead of orphaning it in the media library.
  const [uploadedIds, setUploadedIds] = useState<Record<string, string>>({})

  // On a deep link into /owner/cars/:id/edit the listing isn't in the store yet,
  // so fetch it and re-seed the form once it lands.
  const seededFor = useRef<string | null>(existing?.id ?? null)

  useEffect(() => {
    if (!id || seededFor.current === id) return
    if (!existing) {
      loadCar(id)
      return
    }
    seededFor.current = id
    setForm(seed(existing))
    setFeatures(existing.features)
    setImages(existing.images)
  }, [id, existing, loadCar])

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: 26 }, (_, i) => String(now - i))
  }, [])

  const validate = () => {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 3) next.name = 'Give the listing a clear name.'
    if (!form.brand) next.brand = 'Select a brand.'
    if (form.model.trim().length < 1) next.model = 'Enter the model.'
    if (!form.registrationNumber.trim()) next.registrationNumber = 'Registration number is required.'
    if (Number(form.pricePerDay) <= 0) next.pricePerDay = 'Set a daily price.'
    if (Number(form.pricePerWeek) <= 0) next.pricePerWeek = 'Set a weekly price.'
    if (Number(form.pricePerMonth) <= 0) next.pricePerMonth = 'Set a monthly price.'
    if (Number(form.pricePerWeek) > Number(form.pricePerDay) * 7)
      next.pricePerWeek = 'Weekly should be cheaper than 7 × daily.'
    if (Number(form.pricePerMonth) > Number(form.pricePerDay) * 30)
      next.pricePerMonth = 'Monthly should be cheaper than 30 × daily.'
    if (!form.pickupLocation.trim()) next.pickupLocation = 'Where should renters collect the car?'
    if (form.description.trim().length < 40)
      next.description = 'Write at least 40 characters — it materially improves bookings.'
    if (!form.insuranceProvider.trim()) next.insuranceProvider = 'Insurance provider is required.'
    if (!form.insurancePolicy.trim()) next.insurancePolicy = 'Policy number is required.'
    if (images.length < 2) next.images = 'Add at least two photos.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate() || !user) {
      toast('Fix the highlighted fields before submitting.', 'error')
      return
    }
    setSaving(true)

    const payload: Car = {
      id: existing?.id ?? `car-${Date.now()}`,
      ownerId: user.id,
      owner: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        verification: user.verification,
        createdAt: user.createdAt,
      },
      name: form.name.trim(),
      brand: form.brand,
      model: form.model.trim(),
      year: Number(form.year),
      bodyType: form.bodyType as Car['bodyType'],
      transmission: form.transmission as Car['transmission'],
      fuelType: form.fuelType as Car['fuelType'],
      seats: Number(form.seats),
      color: form.color.trim(),
      registrationNumber: form.registrationNumber.trim().toUpperCase(),
      vin: form.vin.trim() || undefined,
      mileage: Number(form.mileage),
      pricePerDay: Number(form.pricePerDay),
      pricePerWeek: Number(form.pricePerWeek),
      pricePerMonth: Number(form.pricePerMonth),
      pickupLocation: form.pickupLocation.trim(),
      city: form.city,
      description: form.description.trim(),
      features,
      specs: {
        engine: form.engine.trim(),
        horsepower: Number(form.horsepower),
        driveType: form.driveType as Car['specs']['driveType'],
        doors: Number(form.doors),
      },
      policy: {
        mileageLimitPerDay: form.mileageLimit ? Number(form.mileageLimit) : null,
        fuelPolicy: form.fuelPolicy as Car['policy']['fuelPolicy'],
        minRentalDays: Number(form.minRentalDays),
        cancellationWindowHours: Number(form.cancellationWindow),
        securityDeposit: Number(form.securityDeposit),
        driverAgeMin: Number(form.driverAgeMin),
      },
      insurance: {
        provider: form.insuranceProvider.trim(),
        policyNumber: form.insurancePolicy.trim(),
        coverage: form.insuranceCoverage.trim(),
        expiresAt: form.insuranceExpiry,
      },
      images,
      gpsTrackerId: form.gpsTrackerId.trim() || undefined,
      // Any edit re-enters the approval queue — admins re-check changed details.
      status: 'pending',
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      tripCount: existing?.tripCount ?? 0,
      unavailableDates: existing?.unavailableDates ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    try {
      if (isEdit) await saveCar(payload.id, payload)
      else await createCar(payload)

      toast(
        isEdit
          ? 'Listing updated and resubmitted for approval.'
          : 'Listing submitted. Our team reviews new cars within 24 hours.',
      )
      navigate('/owner/cars')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  /** Validates client-side first, so obvious rejects never hit the network. */
  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length || uploading) return

    const files = Array.from(list)
    const room = MAX_IMAGES - images.length

    if (room <= 0) {
      toast(`You can have up to ${MAX_IMAGES} photos. Remove one first.`, 'error')
      return
    }

    const tooBig = files.find((f) => f.size > MAX_FILE_BYTES)
    if (tooBig) {
      toast(`"${tooBig.name}" is over 5MB. Compress it or pick another.`, 'error')
      return
    }

    const batch = files.slice(0, room)
    if (batch.length < files.length) {
      toast(`Only ${room} more photo${room === 1 ? '' : 's'} will fit — uploading those.`, 'info')
    }

    setUploading(true)
    setProgress(0)
    try {
      const uploaded: UploadedImage[] = await uploadService.carImages(batch, setProgress)
      setImages((prev) => [...prev, ...uploaded.map((u) => u.url)])
      setUploadedIds((prev) => ({
        ...prev,
        ...Object.fromEntries(uploaded.map((u) => [u.url, u.publicId])),
      }))
      setErrors((prev) => ({ ...prev, images: '' }))
      toast(`${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} uploaded.`)
    } catch (error) {
      toast(apiError(error, 'Upload failed.'), 'error')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const removeImage = (src: string) => {
    setImages((prev) => prev.filter((s) => s !== src))
    const publicId = uploadedIds[src]
    if (publicId) {
      // Fire and forget: the listing edit matters more than a stray file, and
      // Cloudinary's free tier has room to spare if this ever fails.
      void uploadService.remove(publicId).catch(() => {})
      setUploadedIds((prev) => {
        const next = { ...prev }
        delete next[src]
        return next
      })
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit listing' : 'List your car'}
        subtitle={
          isEdit
            ? 'Changes go back through approval before they appear publicly.'
            : 'Tell renters everything they need to decide. It takes about ten minutes.'
        }
      />

      <div className="space-y-6">
        <Section title="The basics" hint="What renters see first in search results.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Listing name"
              placeholder="Toyota Camry SE"
              required
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              className="sm:col-span-2"
            />
            <Select
              label="Brand"
              required
              value={form.brand}
              onChange={set('brand')}
              error={errors.brand}
              options={[{ value: '', label: 'Select a brand' }, ...BRANDS.map((b) => ({ value: b, label: b }))]}
            />
            <Input
              label="Model"
              placeholder="Camry"
              required
              value={form.model}
              onChange={set('model')}
              error={errors.model}
            />
            <Select
              label="Year"
              value={form.year}
              onChange={set('year')}
              options={yearOptions.map((y) => ({ value: y, label: y }))}
            />
            <Select
              label="Body type"
              value={form.bodyType}
              onChange={set('bodyType')}
              options={BODY_TYPES}
            />
            <Select
              label="Transmission"
              value={form.transmission}
              onChange={set('transmission')}
              options={TRANSMISSIONS}
            />
            <Select
              label="Fuel type"
              value={form.fuelType}
              onChange={set('fuelType')}
              options={FUEL_TYPES}
            />
            <Input
              type="number"
              label="Seating capacity"
              min={2}
              max={18}
              value={form.seats}
              onChange={set('seats')}
            />
            <Input label="Colour" placeholder="Pearl White" value={form.color} onChange={set('color')} />
          </div>
        </Section>

        <Section title="Registration & condition" hint="Kept private until a booking is confirmed.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Registration number"
              placeholder="LAG-472-KJA"
              required
              value={form.registrationNumber}
              onChange={set('registrationNumber')}
              error={errors.registrationNumber}
            />
            <Input
              label="VIN (optional)"
              placeholder="4T1BF1FK5CU512345"
              value={form.vin}
              onChange={set('vin')}
            />
            <Input
              type="number"
              label="Mileage (km)"
              min={0}
              value={form.mileage}
              onChange={set('mileage')}
            />
            <Input
              label="GPS tracker ID (optional)"
              placeholder="TRK-88213"
              hint="Enables live tracking on the trip screen."
              value={form.gpsTrackerId}
              onChange={set('gpsTrackerId')}
            />
          </div>
        </Section>

        <Section title="Pricing" hint="Weekly and monthly rates apply automatically to longer trips.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="number"
              label="Price per day (₦)"
              min={0}
              step={1000}
              required
              value={form.pricePerDay}
              onChange={set('pricePerDay')}
              error={errors.pricePerDay}
            />
            <Input
              type="number"
              label="Price per week (₦)"
              min={0}
              step={1000}
              required
              value={form.pricePerWeek}
              onChange={set('pricePerWeek')}
              error={errors.pricePerWeek}
            />
            <Input
              type="number"
              label="Price per month (₦)"
              min={0}
              step={1000}
              required
              value={form.pricePerMonth}
              onChange={set('pricePerMonth')}
              error={errors.pricePerMonth}
            />
          </div>
          <p className="text-dim mt-3 flex items-start gap-2 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            AUTOGO deducts a flat 10% service fee. You keep the rest, paid out the day after each
            completed trip.
          </p>
        </Section>

        <Section title="Location" hint="Where renters collect and return the car.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="City" value={form.city} onChange={set('city')} options={CITIES.map((c) => ({ value: c, label: c }))} />
            <Input
              label="Pickup location"
              placeholder="Lekki Phase 1, Lagos"
              required
              value={form.pickupLocation}
              onChange={set('pickupLocation')}
              error={errors.pickupLocation}
            />
          </div>
        </Section>

        <Section
          title="Photos"
          hint="Six or more photos gets roughly 3× the booking requests. The first is the cover."
        >
          {errors.images && <p className="mb-3 text-xs text-red-600">{errors.images}</p>}

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              uploadFiles(e.dataTransfer.files)
            }}
            className={cx(
              'rounded-xl transition-colors',
              dragging && 'ring-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-2'
            )}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={src} className="group relative">
                  <img
                    src={src}
                    alt={`Car photo ${i + 1}`}
                    className="aspect-4/3 w-full rounded-lg border object-cover"
                  />
                  {i === 0 && (
                    <span className="bg-brand-600 dark:bg-brand-500 dark:text-ink-950 absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  )}
                  {/* Promoting to cover is a reorder, not a re-upload. */}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) => [src, ...prev.filter((s) => s !== src)])
                      }
                      className="surface-raised absolute bottom-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-bold opacity-0 shadow-lift transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(src)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="surface-raised absolute top-2 right-2 grid size-7 place-items-center rounded-full border shadow-lift"
                  >
                    <Trash2 className="size-3.5 text-red-600" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-dim hover:border-brand-400 hover:text-brand-600 flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-6 animate-spin" />
                    <span className="text-xs font-semibold tabular-nums">{progress}%</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-6" />
                    <span className="text-xs font-semibold">Add photos</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => {
              uploadFiles(e.target.files)
              // Reset so picking the same file twice still fires onChange.
              e.target.value = ''
            }}
          />

          <p className="text-dim mt-3 text-xs">
            Drag and drop, or click to browse. JPEG, PNG, WebP or AVIF — up to 5MB each,
            {' '}
            {MAX_IMAGES} photos total.
          </p>
        </Section>

        <Section title="Description" hint="Be specific — what is this car good for?">
          <Textarea
            label="About this car"
            rows={5}
            required
            placeholder="Clean, well-serviced Camry with full leather interior. Ideal for airport runs and weekend trips…"
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            hint={`${form.description.trim().length} characters`}
          />
        </Section>

        <Section title="Specifications">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Engine" placeholder="2.5L 4-cylinder" value={form.engine} onChange={set('engine')} />
            <Input
              type="number"
              label="Horsepower"
              min={0}
              value={form.horsepower}
              onChange={set('horsepower')}
            />
            <Select
              label="Drive type"
              value={form.driveType}
              onChange={set('driveType')}
              options={DRIVE_TYPES}
            />
            <Input type="number" label="Doors" min={2} max={6} value={form.doors} onChange={set('doors')} />
          </div>
        </Section>

        <Section title="Features">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(FEATURE_LABELS) as (keyof CarFeatureSet)[]).map((key) => (
              <Checkbox
                key={key}
                checked={features[key]}
                onChange={(on) => setFeatures((f) => ({ ...f, [key]: on }))}
                label={FEATURE_LABELS[key]}
              />
            ))}
          </div>
        </Section>

        <Section title="Rental policies" hint="Set the rules renters agree to at checkout.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              label="Mileage limit per day (km)"
              min={0}
              hint="Leave at 0 for unlimited mileage."
              value={form.mileageLimit}
              onChange={set('mileageLimit')}
            />
            <Select
              label="Fuel policy"
              value={form.fuelPolicy}
              onChange={set('fuelPolicy')}
              options={[
                { value: 'full-to-full', label: 'Full to full' },
                { value: 'same-to-same', label: 'Same to same' },
                { value: 'prepaid', label: 'Prepaid (fuel included)' },
              ]}
            />
            <Input
              type="number"
              label="Minimum rental (days)"
              min={1}
              value={form.minRentalDays}
              onChange={set('minRentalDays')}
            />
            <Input
              type="number"
              label="Free cancellation window (hours)"
              min={0}
              value={form.cancellationWindow}
              onChange={set('cancellationWindow')}
            />
            <Input
              type="number"
              label="Minimum driver age"
              min={18}
              max={40}
              value={form.driverAgeMin}
              onChange={set('driverAgeMin')}
            />
          </div>
        </Section>

        <Section title="Insurance" hint="Every listed car must carry valid comprehensive cover.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Insurance provider"
              placeholder="AIICO Insurance"
              required
              value={form.insuranceProvider}
              onChange={set('insuranceProvider')}
              error={errors.insuranceProvider}
            />
            <Input
              label="Policy number"
              required
              value={form.insurancePolicy}
              onChange={set('insurancePolicy')}
              error={errors.insurancePolicy}
            />
            <Input
              type="date"
              label="Policy expiry"
              min={todayISO()}
              value={form.insuranceExpiry}
              onChange={set('insuranceExpiry')}
            />
            <Input
              label="Coverage summary"
              value={form.insuranceCoverage}
              onChange={set('insuranceCoverage')}
            />
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/owner/cars')}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} size="lg">
            {isEdit ? 'Save and resubmit' : 'Submit for approval'}
          </Button>
        </div>
      </div>
    </>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <Card as="section" className="p-6">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {hint && <p className="text-dim mt-1 text-sm text-pretty">{hint}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

function seed(car?: Car) {
  return {
    name: car?.name ?? '',
    brand: car?.brand ?? '',
    model: car?.model ?? '',
    year: String(car?.year ?? new Date().getFullYear()),
    bodyType: car?.bodyType ?? 'sedan',
    transmission: car?.transmission ?? 'automatic',
    fuelType: car?.fuelType ?? 'petrol',
    seats: String(car?.seats ?? 5),
    color: car?.color ?? '',
    registrationNumber: car?.registrationNumber ?? '',
    vin: car?.vin ?? '',
    mileage: String(car?.mileage ?? 0),
    pricePerDay: String(car?.pricePerDay ?? ''),
    pricePerWeek: String(car?.pricePerWeek ?? ''),
    pricePerMonth: String(car?.pricePerMonth ?? ''),
    city: car?.city ?? CITIES[0],
    pickupLocation: car?.pickupLocation ?? '',
    description: car?.description ?? '',
    engine: car?.specs.engine ?? '',
    horsepower: String(car?.specs.horsepower ?? 0),
    driveType: car?.specs.driveType ?? 'fwd',
    doors: String(car?.specs.doors ?? 4),
    mileageLimit: String(car?.policy.mileageLimitPerDay ?? 250),
    fuelPolicy: car?.policy.fuelPolicy ?? 'full-to-full',
    minRentalDays: String(car?.policy.minRentalDays ?? 1),
    cancellationWindow: String(car?.policy.cancellationWindowHours ?? 48),
    securityDeposit: String(car?.policy.securityDeposit ?? 100000),
    driverAgeMin: String(car?.policy.driverAgeMin ?? 23),
    gpsTrackerId: car?.gpsTrackerId ?? '',
    insuranceProvider: car?.insurance.provider ?? '',
    insurancePolicy: car?.insurance.policyNumber ?? '',
    insuranceCoverage:
      car?.insurance.coverage ??
      'Comprehensive — third party, fire, theft and collision damage waiver',
    insuranceExpiry: car?.insurance.expiresAt ?? addDays(todayISO(), 365),
  }
}
