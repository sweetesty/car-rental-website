import type { BodyType, CarFeatureSet, CarFilters, FuelType, Transmission } from './types'

/** Static option lists shared by the filter panel, upload form and footer links. */

export const CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Enugu',
  'Benin City',
  'Kaduna',
]

export const BRANDS = [
  'Toyota',
  'Honda',
  'Mercedes-Benz',
  'BMW',
  'Lexus',
  'Hyundai',
  'Kia',
  'Ford',
  'Volkswagen',
  'Tesla',
  'Nissan',
  'Peugeot',
]

export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'suv', label: 'SUV' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'van', label: 'Van / Bus' },
  { value: 'coupe', label: 'Coupé' },
]

export const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
]

export const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
]

export const DRIVE_TYPES = [
  { value: 'fwd', label: 'Front-wheel drive' },
  { value: 'rwd', label: 'Rear-wheel drive' },
  { value: 'awd', label: 'All-wheel drive' },
  { value: '4wd', label: '4×4' },
]

export const SEAT_OPTIONS = ['2', '4', '5', '7', '8']

export const FEATURE_LABELS: Record<keyof CarFeatureSet, string> = {
  airConditioning: 'Air conditioning',
  bluetooth: 'Bluetooth',
  gps: 'Built-in GPS',
  reverseCamera: 'Reverse camera',
  cruiseControl: 'Cruise control',
  usbPorts: 'USB ports',
  leatherSeats: 'Leather seats',
  sunroof: 'Sunroof',
  childSeat: 'Child seat',
  androidAuto: 'Android Auto / CarPlay',
}

export const FUEL_POLICY_LABELS = {
  'full-to-full': 'Full to full — return with the tank as you found it',
  'same-to-same': 'Same to same — return at the level you collected',
  prepaid: 'Prepaid — fuel is included in the rental price',
} as const

export const PRICE_CEILING = 200_000

/** Baseline search state — anything differing from this counts as an active filter. */
export const DEFAULT_FILTERS: CarFilters = {
  q: '',
  brand: '',
  bodyType: '',
  transmission: '',
  fuelType: '',
  city: '',
  seats: '',
  minPrice: 0,
  maxPrice: PRICE_CEILING,
  startDate: '',
  endDate: '',
  sort: 'recommended',
}

/** Highest-volume brands, surfaced on the homepage. */
export const POPULAR_BRANDS = [
  'Toyota',
  'Mercedes-Benz',
  'Lexus',
  'Honda',
  'BMW',
  'Hyundai',
  'Ford',
  'Tesla',
]
