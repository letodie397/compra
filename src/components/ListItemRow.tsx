import { Check, Trash2 } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import type { ShoppingItem } from '../types'
import { Stepper } from './Stepper'

interface ListItemRowProps {
  item: ShoppingItem
  onToggle: () => void
  onRemove: () => void
  onChangeQty: (qty: number) => void
}

export function ListItemRow({
  item,
  onToggle,
  onRemove,
  onChangeQty,
}: ListItemRowProps) {
  return (
    <article
      className={`flex items-center gap-2.5 px-3 py-2.5 ${
        item.checked ? 'bg-moss/60' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.checked ? 'Desmarcar' : 'Marcar como comprado'}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
          item.checked
            ? 'border-leaf bg-leaf text-white'
            : 'border-line bg-white text-transparent'
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            item.checked ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {item.name}
        </p>
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
