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
    <article className="flex items-center gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-ink">{product.name}</h3>
          {low && (
            <span className="shrink-0 rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold text-warn">
              Baixo
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {categoryLabel(product.category)}
          {product.notes ? ` · ${product.notes}` : ''} · mín.{' '}
          {unitPhrase(product.minQuantity, product.unit)}
        </p>
      </div>
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
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        aria-label={`Apagar ${product.name}`}
        onClick={onDelete}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-warn-soft hover:text-warn"
      >
        <Trash2 size={14} />
      </button>
    </article>
  )
}
