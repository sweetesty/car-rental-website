import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cx } from '@/lib/format'

const CONTROL =
  'w-full rounded-lg border surface-raised px-3.5 text-sm text-ink-950 transition-colors placeholder:text-ink-400 focus:border-brand-500 disabled:opacity-60 dark:text-ink-50 dark:placeholder:text-ink-500'

const INVALID = 'border-red-500 focus:border-red-500'

interface WrapProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (id: string) => ReactNode
}

function Wrap({ label, hint, error, required, className, children }: WrapProps) {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-dim text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  className?: string
}

export function Input({ label, hint, error, icon, className, ...rest }: InputProps) {
  return (
    <Wrap label={label} hint={hint} error={error} required={rest.required} className={className}>
      {(id) => (
        <div className="relative">
          {icon && (
            <span className="text-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              {icon}
            </span>
          )}
          <input
            id={id}
            {...rest}
            aria-invalid={error ? true : undefined}
            className={cx(CONTROL, 'h-11', icon && 'pl-10', error && INVALID)}
          />
        </div>
      )}
    </Wrap>
  )
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  label?: string
  hint?: string
  error?: string
  className?: string
  options: { value: string; label: string }[]
}

export function Select({ label, hint, error, className, options, ...rest }: SelectProps) {
  return (
    <Wrap label={label} hint={hint} error={error} required={rest.required} className={className}>
      {(id) => (
        <select
          id={id}
          {...rest}
          aria-invalid={error ? true : undefined}
          className={cx(CONTROL, 'h-11 cursor-pointer pr-8', error && INVALID)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Wrap>
  )
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

export function Textarea({ label, hint, error, className, ...rest }: TextareaProps) {
  return (
    <Wrap label={label} hint={hint} error={error} required={rest.required} className={className}>
      {(id) => (
        <textarea
          id={id}
          rows={4}
          {...rest}
          aria-invalid={error ? true : undefined}
          className={cx(CONTROL, 'resize-y py-2.5 leading-relaxed', error && INVALID)}
        />
      )}
    </Wrap>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-center gap-2.5 text-sm select-none',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-brand-600 dark:accent-brand-400"
      />
      <span>{label}</span>
    </label>
  )
}
