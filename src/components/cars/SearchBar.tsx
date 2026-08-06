import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addDays, todayISO } from '@/lib/format'
import { CITIES } from '@/lib/catalog'

/** Hero search: where, when, and go. Feeds the /cars query string. */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState(addDays(todayISO(), 1))
  const [endDate, setEndDate] = useState(addDays(todayISO(), 4))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    navigate(`/cars?${params}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface-raised grid gap-2 rounded-2xl border p-2.5 shadow-lift-lg sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]"
    >
      <Cell icon={MapPin} label="Pick-up city">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Pick-up city"
          className="w-full cursor-pointer bg-transparent text-sm font-semibold outline-none"
        >
          <option value="">Anywhere in Nigeria</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Cell>

      <Cell icon={CalendarDays} label="Pick-up date">
        <input
          type="date"
          value={startDate}
          min={todayISO()}
          onChange={(e) => {
            setStartDate(e.target.value)
            if (e.target.value > endDate) setEndDate(addDays(e.target.value, 3))
          }}
          aria-label="Pick-up date"
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
      </Cell>

      <Cell icon={CalendarDays} label="Return date">
        <input
          type="date"
          value={endDate}
          min={startDate || todayISO()}
          onChange={(e) => setEndDate(e.target.value)}
          aria-label="Return date"
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
      </Cell>

      <Button
        type="submit"
        size={compact ? 'md' : 'lg'}
        className="sm:col-span-2 lg:col-span-1 lg:px-9"
      >
        <Search className="size-4.5" />
        Search
      </Button>
    </form>
  )
}

function Cell({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="hover:surface-sunken flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors">
      <Icon className="size-4.5 shrink-0" strokeWidth={1.7} />
      <div className="min-w-0 flex-1">
        <p className="text-dim text-[0.625rem] font-bold tracking-[0.14em] uppercase">{label}</p>
        {children}
      </div>
    </div>
  )
}
