import { useState } from 'react'
import { CATEGORIES, UNITS, unitName } from '../data/categories'
import type { CategoryId, Product, Unit } from '../types'
import { Stepper } from './Stepper'

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

const fieldClass =
  'mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink'

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
      <label className="block">
        <span className="text-xs font-medium text-muted">Nome</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Detergente"
          className={fieldClass}
          required
        />
      </label>

      <div>
        <p className="text-xs font-medium text-muted">Quantidade em casa</p>
        <div className="mt-2">
          <Stepper
            value={quantity}
            decreaseLabel="Diminuir quantidade"
            increaseLabel="Aumentar quantidade"
            onChange={setQuantity}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted">Avisar quando chegar a</p>
        <div className="mt-2">
          <Stepper
            value={minQuantity}
            decreaseLabel="Diminuir o aviso"
            increaseLabel="Aumentar o aviso"
            onChange={setMinQuantity}
          />
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-muted">Categoria</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId)}
          className={fieldClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted">Unidade</span>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className={fieldClass}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {unitName(u)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted">Anotação</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Marca ou tamanho"
          className={fieldClass}
        />
      </label>

      <button
        type="submit"
        className="h-11 w-full rounded-xl bg-ink text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  )
}
