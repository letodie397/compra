import { Pencil, Trash2 } from 'lucide-react'
import { categoryLabel, unitPhrase } from '../data/categories'
import type { Product } from '../types'
import { Stepper } from './Stepper'

interface ProductCardProps {
  product: Product
  onAdjust: (delta: number) => void
  onEdit: () => void
  onDelete: () => void
}

export function ProductCard({
  product,
  onAdjust,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const low = product.quantity <= product.minQuantity

  return (
    <article className="px-3 py-2.5">
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-ink">
              {product.name}
            </span>
            {low && (
              <span className="shrink-0 rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold text-warn">
                Baixo
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {categoryLabel(product.category)}
            {product.notes ? ` · ${product.notes}` : ''} · mín.{' '}
            {unitPhrase(product.minQuantity, product.unit)}
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-leaf">
          Editar
        </span>
      </button>

      <div className="mt-2 flex items-center gap-2">
        <Stepper
          value={product.quantity}
          decreaseLabel={`Diminuir ${product.name}`}
          increaseLabel={`Aumentar ${product.name}`}
          onChange={(next) => onAdjust(next - product.quantity)}
        />
        <button
          type="button"
          aria-label={`Editar ${product.name}`}
          onClick={onEdit}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-ink"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          aria-label={`Apagar ${product.name}`}
          onClick={onDelete}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  )
}
