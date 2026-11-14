interface StepperProps {
  value: number
  min?: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
  /** Maior, para idosos enxergarem a quantidade na lista. */
  size?: 'md' | 'lg'
}

export function Stepper({
  value,
  min = 0,
  onChange,
  decreaseLabel,
  increaseLabel,
  size = 'md',
}: StepperProps) {
  const large = size === 'lg'

  return (
    <div
      className={`inline-flex items-center rounded-full bg-sand ${
        large ? 'gap-0.5 p-1' : 'p-0.5'
      }`}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`grid place-items-center rounded-full leading-none text-ink-soft disabled:opacity-30 ${
          large ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-base'
        }`}
      >
        −
      </button>
      <span
        className={`text-center font-bold tabular-nums text-ink ${
          large ? 'min-w-9 text-xl' : 'min-w-6 text-sm font-semibold'
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => onChange(value + 1)}
        className={`grid place-items-center rounded-full bg-white leading-none text-ink shadow-sm ${
          large ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-base'
        }`}
      >
        +
      </button>
    </div>
  )
}
