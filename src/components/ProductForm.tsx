import { useState } from 'react'
import { CATEGORIES, UNITS } from '../data/categories'
import type { CategoryId, Product, Unit } from '../types'

interface ProductFormProps {
  initial?: Partial<Product>
  submitLabel?: string
  onSubmit: (data: {
    name: string
    category: CategoryId
    quantity: number
    minQuantity: number
    unit: Unit
    notes?: string
  }) => void
}

export function ProductForm({
  initial,
  submitLabel = 'Salvar',
  onSubmit,
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<CategoryId>(
    initial?.category ?? 'limpeza',
  )
  const [quantity, setQuantity] = useState(initial?.quantity ?? 0)
  const [minQuantity, setMinQuantity] = useState(initial?.minQuantity ?? 1)
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'un')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSubmit({
          name: name.trim(),
          category,
          quantity: Math.max(0, Number(quantity) || 0),
          minQuantity: Math.max(0, Number(minQuantity) || 0),
          unit,
          notes: notes.trim() || undefined,
        })
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Nome
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Detergente"
          className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none ring-leaf/30 transition focus:ring-2"
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Categoria
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === c.id
                  ? 'bg-leaf text-white'
                  : 'bg-sand text-ink-soft hover:bg-moss'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Qtd
          </span>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-2xl border border-line bg-mist px-3 py-3 text-sm outline-none ring-leaf/30 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Mínimo
          </span>
          <input
            type="number"
            min={0}
            value={minQuantity}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
            className="w-full rounded-2xl border border-line bg-mist px-3 py-3 text-sm outline-none ring-leaf/30 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Unidade
          </span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="w-full rounded-2xl border border-line bg-mist px-3 py-3 text-sm outline-none ring-leaf/30 focus:ring-2"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Observação
        </span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Marca, aroma, tamanho..."
          className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none ring-leaf/30 focus:ring-2"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-leaf py-3.5 text-sm font-bold text-white shadow-lg shadow-leaf/25 transition hover:bg-leaf-bright"
      >
        {submitLabel}
      </button>
    </form>
  )
}
