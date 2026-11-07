import { motion } from 'framer-motion'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { categoryAccent, categoryLabel } from '../data/categories'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  index: number
  onAdjust: (delta: number) => void
  onEdit: () => void
  onDelete: () => void
}

export function ProductCard({
  product,
  index,
  onAdjust,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const low = product.quantity <= product.minQuantity
  const accent = categoryAccent(product.category)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      className={`relative overflow-hidden rounded-3xl border bg-white/85 p-4 shadow-sm ${
        low ? 'border-warn/40' : 'border-line/70'
      }`}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: accent }}
            >
              {categoryLabel(product.category)}
            </span>
            {low && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warn">
                Reabastecer
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold leading-tight text-ink">
            {product.name}
          </h3>
          {product.notes && (
            <p className="mt-0.5 truncate text-xs text-muted">{product.notes}</p>
          )}
          <p className="mt-2 text-sm text-ink-soft">
            Estoque{' '}
            <strong className={low ? 'text-warn' : 'text-leaf'}>
              {product.quantity} {product.unit}
            </strong>
            <span className="text-muted">
              {' '}
              · mín. {product.minQuantity} {product.unit}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-full bg-sand p-1">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => onAdjust(-1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition hover:text-leaf"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 text-center text-sm font-bold">
              {product.quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => onAdjust(1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition hover:text-leaf"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Editar"
              onClick={onEdit}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-sand hover:text-leaf"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="Excluir"
              onClick={onDelete}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-warn-soft hover:text-warn"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
