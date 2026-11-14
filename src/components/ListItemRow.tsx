import { Check, Trash2 } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import type { ShoppingItem } from '../types'
import { Stepper } from './Stepper'

interface ListItemRowProps {
  item: ShoppingItem
  mode: 'edit' | 'shop'
  onToggle: () => void
  onRemove: () => void
  onChangeQty: (qty: number) => void
}

export function ListItemRow({
  item,
  mode,
  onToggle,
  onRemove,
  onChangeQty,
}: ListItemRowProps) {
  if (mode === 'shop') {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-3.5 text-left ${
          item.checked ? 'bg-moss/60' : ''
        }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
            item.checked
              ? 'border-leaf bg-leaf text-white'
              : 'border-line bg-white text-transparent'
          }`}
        >
          <Check size={18} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-base font-semibold ${
              item.checked ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {item.name}
          </span>
          <span className="block text-xs text-muted">
            {categoryLabel(item.category)}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-2xl px-3 py-1.5 text-center ${
            item.checked ? 'bg-leaf/15 text-leaf' : 'bg-ink text-white'
          }`}
        >
          <span className="block text-xl font-bold leading-none tabular-nums">
            {item.quantity}
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {item.unit}
          </span>
        </span>
      </button>
    )
  }

  return (
    <article className="flex items-center gap-2.5 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-ink">{item.name}</p>
        <p className="truncate text-xs text-muted">
          {categoryLabel(item.category)} · {item.unit}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Stepper
          value={item.quantity}
          min={1}
          size="lg"
          decreaseLabel={`Diminuir ${item.name}`}
          increaseLabel={`Aumentar ${item.name}`}
          onChange={onChangeQty}
        />
        <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
          {item.unit}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Tirar ${item.name}`}
        onClick={onRemove}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-warn-soft hover:text-warn"
      >
        <Trash2 size={16} />
      </button>
    </article>
  )
}
