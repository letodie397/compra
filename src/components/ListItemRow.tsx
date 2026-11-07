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
        className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
          item.checked ? 'bg-moss/60' : ''
        }`}
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
            item.checked
              ? 'border-leaf bg-leaf text-white'
              : 'border-line bg-white text-transparent'
          }`}
        >
          <Check size={16} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-semibold ${
              item.checked ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {item.name}
          </span>
          <span className="block text-xs text-muted">
            {item.quantity} {item.unit} · {categoryLabel(item.category)}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
            item.checked
              ? 'bg-leaf text-white'
              : 'bg-warn-soft text-warn'
          }`}
        >
          {item.checked ? 'Peguei' : 'Falta'}
        </span>
      </button>
    )
  }

  return (
    <article className="flex items-center gap-2.5 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
        <p className="truncate text-xs text-muted">
          {categoryLabel(item.category)} · {item.unit}
        </p>
      </div>
      <Stepper
        value={item.quantity}
        min={1}
        decreaseLabel={`Diminuir ${item.name}`}
        increaseLabel={`Aumentar ${item.name}`}
        onChange={onChangeQty}
      />
      <button
        type="button"
        aria-label={`Tirar ${item.name}`}
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-warn-soft hover:text-warn"
      >
        <Trash2 size={14} />
      </button>
    </article>
  )
}
