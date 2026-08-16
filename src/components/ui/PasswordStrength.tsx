import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { cx } from '@/lib/format'

/** Firebase rejects anything shorter, so this is a hard floor, not advice. */
export const MIN_PASSWORD_LENGTH = 8

interface Rule {
  label: string
  test: (value: string) => boolean
}

/*
 * Length first and weighted heaviest, because it is what actually resists a
 * brute-force attempt — a long lowercase passphrase beats a short one with a
 * symbol bolted on. The character rules are secondary nudges, not gates: only
 * the length rule blocks submission.
 */
const RULES: Rule[] = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (v) => v.length >= MIN_PASSWORD_LENGTH },
  { label: 'A capital letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /\d/.test(v) },
  { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

const LEVELS = [
  { label: 'Too short', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  { label: 'Weak', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { label: 'Good', bar: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
]

export function scorePassword(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH) return 0
  let score = RULES.filter((rule) => rule.test(value)).length
  // A genuinely long passphrase earns the top band without needing symbols.
  if (value.length >= 14) score = Math.max(score, 4)
  return Math.min(score, 4)
}

export function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => scorePassword(value), [value])
  const level = LEVELS[score]

  if (!value) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div
          className="flex h-1.5 flex-1 gap-1"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label="Password strength"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cx(
                'flex-1 rounded-full transition-colors duration-300',
                i < score ? level.bar : 'bg-ink-200 dark:bg-ink-800',
              )}
            />
          ))}
        </div>
        <span className={cx('text-xs font-bold', level.text)}>{level.label}</span>
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map((rule) => {
          const met = rule.test(value)
          return (
            <li
              key={rule.label}
              className={cx(
                'flex items-center gap-1.5 text-xs',
                met ? 'text-emerald-600 dark:text-emerald-400' : 'text-dim',
              )}
            >
              {met ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <X className="size-3.5 shrink-0 opacity-50" />
              )}
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
