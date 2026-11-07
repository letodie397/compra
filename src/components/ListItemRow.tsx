import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import type { ShoppingItem } from '../types'

interface ListItemRowProps {
  item: ShoppingItem
  index: number
  onToggle: () => void
  onRemove: () => void
  onChangeQty: (qty: number) => void
}

export function ListItemRow({
  item,
  index,
  onToggle,
  onRemove,
  onChangeQty,
}: ListItemRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
        item.checked
          ? 'border-line/50 bg-sand/70 opacity-70'
          : 'border-line/80 bg-white/90'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.checked ? 'Desmarcar' : 'Marcar como comprado'}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
          item.checked
            ? 'border-leaf bg-leaf text-white'
            : 'border-line bg-mist text-transparent hover:border-leaf'
        }`}
      >
        <Check size={16} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold ${
            item.checked ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {item.name}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {categoryLabel(item.category)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChangeQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-12 rounded-xl border border-line bg-mist px-2 py-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-leaf/30"
        />
        <span className="w-7 text-xs text-muted">{item.unit}</span>
      </div>

      <button
        type="button"
        aria-label="Remover item"
        onClick={onRemove}
        className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-warn-soft hover:text-warn"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}
