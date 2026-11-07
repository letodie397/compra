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
  'mt-1 h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink'

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
      className="space-y-3.5"
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

      <fieldset>
        <legend className="text-xs font-medium text-muted">Categoria</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              selected={category === c.id}
              onClick={() => setCategory(c.id)}
              label={c.label}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-muted">Quantidade</p>
          <div className="mt-1.5">
            <Stepper
              value={quantity}
              decreaseLabel="Diminuir quantidade"
              increaseLabel="Aumentar quantidade"
              onChange={setQuantity}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Avisar em</p>
          <div className="mt-1.5">
            <Stepper
              value={minQuantity}
              decreaseLabel="Diminuir o aviso"
              increaseLabel="Aumentar o aviso"
              onChange={setMinQuantity}
            />
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-muted">Unidade</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {UNITS.map((u) => (
            <Chip
              key={u}
              selected={unit === u}
              onClick={() => setUnit(u)}
              label={unitName(u)}
            />
          ))}
        </div>
      </fieldset>

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
        className="h-10 w-full rounded-xl bg-ink text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  )
}

function Chip({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-xs font-semibold ${
        selected ? 'bg-ink text-white' : 'bg-sand text-ink-soft'
      }`}
    >
      {label}
    </button>
  )
}
