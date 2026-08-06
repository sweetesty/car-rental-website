import { useId, useState } from 'react'
import { cx } from '@/lib/format'

export interface Bar {
  label: string
  value: number
}

interface Props {
  data: Bar[]
  /** Formats values for the axis, tooltip and the direct label on the peak bar. */
  format: (value: number) => string
  /** Names the single series, so no legend box is needed. */
  seriesLabel: string
  height?: number
}

const PAD = { top: 16, right: 8, bottom: 26, left: 52 }

/**
 * Single-series column chart. One hue by magnitude, recessive gridlines, the peak
 * bar direct-labelled, and a hover tooltip for the rest.
 */
export function BarChart({ data, format, seriesLabel, height = 200 }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const clipId = useId()

  const width = 640
  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom

  const max = Math.max(...data.map((d) => d.value), 1)
  // Round the top of the scale up so gridlines land on readable numbers.
  const scaleMax = niceCeil(max)
  const ticks = [0, scaleMax / 2, scaleMax]

  const slot = plotW / data.length
  const barW = Math.min(slot - 8, 46)
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)

  const y = (value: number) => PAD.top + plotH - (value / scaleMax) * plotH

  return (
    <figure className="relative m-0">
      <figcaption className="sr-only">{seriesLabel}</figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${seriesLabel}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join('. ')}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* Clips the rounded bar top so the base stays square on the baseline. */}
          <clipPath id={clipId}>
            <rect x="0" y="0" width={width} height={PAD.top + plotH} />
          </clipPath>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-ink-200 dark:stroke-ink-800"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-ink-500 dark:fill-ink-400 text-[11px] tabular-nums"
            >
              {format(tick)}
            </text>
          </g>
        ))}

        <g clipPath={`url(#${clipId})`}>
          {data.map((d, i) => {
            const x = PAD.left + i * slot + (slot - barW) / 2
            const barH = Math.max(2, (d.value / scaleMax) * plotH)
            return (
              <rect
                key={d.label}
                x={x}
                y={PAD.top + plotH - barH}
                width={barW}
                height={barH + 6}
                rx="4"
                className={cx(
                  'transition-opacity',
                  hover !== null && hover !== i ? 'opacity-45' : 'opacity-100',
                  'fill-brand-600 dark:fill-brand-400',
                )}
              />
            )
          })}
        </g>

        {/* Full-height hit targets — easier to hover than the bars themselves. */}
        {data.map((d, i) => (
          <rect
            key={`hit-${d.label}`}
            x={PAD.left + i * slot}
            y={PAD.top}
            width={slot}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {data.map((d, i) => (
          <text
            key={`label-${d.label}`}
            x={PAD.left + i * slot + slot / 2}
            y={height - 8}
            textAnchor="middle"
            className="fill-ink-500 dark:fill-ink-400 text-[11px]"
          >
            {d.label}
          </text>
        ))}

        {/* Only the peak carries a permanent value label. */}
        <text
          x={PAD.left + peak * slot + slot / 2}
          y={y(data[peak].value) - 6}
          textAnchor="middle"
          className="fill-ink-950 dark:fill-ink-50 text-[11px] font-bold tabular-nums"
        >
          {format(data[peak].value)}
        </text>
      </svg>

      {hover !== null && hover !== peak && (
        <div
          role="status"
          className="surface-raised pointer-events-none absolute -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-xs shadow-lift-lg"
          style={{
            left: `${((PAD.left + hover * slot + slot / 2) / width) * 100}%`,
            bottom: `${((height - y(data[hover].value) + 8) / height) * 100}%`,
          }}
        >
          <span className="text-dim">{data[hover].label}</span>{' '}
          <span className="font-bold tabular-nums">{format(data[hover].value)}</span>
        </div>
      )}
    </figure>
  )
}

/** Rounds up to 1, 2 or 5 × a power of ten so tick labels stay clean. */
function niceCeil(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}
