interface StepperProps {
  value: number
  min?: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
}

export function Stepper({
  value,
  min = 0,
  onChange,
  decreaseLabel,
  increaseLabel,
}: StepperProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-sand p-0.5">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-full text-base leading-none text-ink-soft disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => onChange(value + 1)}
        className="grid h-8 w-8 place-items-center rounded-full bg-white text-base leading-none text-ink shadow-sm"
      >
        +
      </button>
    </div>
  )
}
