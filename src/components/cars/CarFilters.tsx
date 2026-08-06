import { RotateCcw } from 'lucide-react'
import type { CarFilters as Filters } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Field'
import { money, todayISO } from '@/lib/format'
import {
  BODY_TYPES,
  BRANDS,
  CITIES,
  FUEL_TYPES,
  PRICE_CEILING,
  SEAT_OPTIONS,
  TRANSMISSIONS,
} from '@/lib/catalog'

interface Props {
  value: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

export function CarFilters({ value, onChange, onReset }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold tracking-tight">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      <Group label="Availability">
        <div className="grid grid-cols-2 gap-2">
          <DateInput
            label="From"
            value={value.startDate}
            min={todayISO()}
            onChange={(v) => onChange({ startDate: v })}
          />
          <DateInput
            label="To"
            value={value.endDate}
            min={value.startDate || todayISO()}
            onChange={(v) => onChange({ endDate: v })}
          />
        </div>
      </Group>

      <Group label={`Price per day — up to ${money(value.maxPrice)}`}>
        <input
          type="range"
          min={0}
          max={PRICE_CEILING}
          step={5_000}
          value={value.maxPrice}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          aria-label="Maximum price per day"
          className="accent-brand-600 dark:accent-brand-400 w-full cursor-pointer"
        />
        <div className="text-dim flex justify-between text-xs tabular-nums">
          <span>₦0</span>
          <span>{money(PRICE_CEILING)}+</span>
        </div>
      </Group>

      <Group label="City">
        <Radios
          name="city"
          value={value.city}
          onChange={(v) => onChange({ city: v })}
          options={[{ value: '', label: 'Anywhere' }, ...CITIES.map((c) => ({ value: c, label: c }))]}
        />
      </Group>

      <Group label="Brand">
        <select
          value={value.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          aria-label="Brand"
          className="surface-raised h-10 w-full cursor-pointer rounded-lg border px-3 text-sm"
        >
          <option value="">All brands</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Group>

      <Group label="Body type">
        <div className="flex flex-wrap gap-2">
          {BODY_TYPES.map((t) => (
            <Chip
              key={t.value}
              active={value.bodyType === t.value}
              onClick={() => onChange({ bodyType: value.bodyType === t.value ? '' : t.value })}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Transmission">
        {TRANSMISSIONS.map((t) => (
          <Checkbox
            key={t.value}
            checked={value.transmission === t.value}
            onChange={(on) => onChange({ transmission: on ? t.value : '' })}
            label={t.label}
          />
        ))}
      </Group>

      <Group label="Fuel type">
        {FUEL_TYPES.map((f) => (
          <Checkbox
            key={f.value}
            checked={value.fuelType === f.value}
            onChange={(on) => onChange({ fuelType: on ? f.value : '' })}
            label={f.label}
          />
        ))}
      </Group>

      <Group label="Seats">
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((s) => (
            <Chip
              key={s}
              active={value.seats === s}
              onClick={() => onChange({ seats: value.seats === s ? '' : s })}
            >
              {s}+
            </Chip>
          ))}
        </div>
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5 border-t pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <legend className="sr-only">{label}</legend>
      <p className="text-sm font-semibold">{label}</p>
      {children}
    </fieldset>
  )
}

function DateInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: string
  min: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-dim text-xs">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="surface-raised mt-1 h-10 w-full rounded-lg border px-2.5 text-sm"
      />
    </label>
  )
}

function Radios({
  name,
  value,
  onChange,
  options,
}: {
  name: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="radio"
            name={name}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-brand-600 dark:accent-brand-400 size-4 cursor-pointer"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'bg-brand-600 dark:bg-brand-500 dark:text-ink-950 rounded-full px-3 py-1.5 text-xs font-semibold text-white'
          : 'surface-raised hover:border-brand-400 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors'
      }
    >
      {children}
    </button>
  )
}
