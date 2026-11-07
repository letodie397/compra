import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { searchCatalog } from '../data/catalog'
import { CATEGORIES, categoryLabel } from '../data/categories'
import type { CatalogItem, CategoryId, Product, Unit } from '../types'
import { Modal } from './Modal'
import { Stepper } from './Stepper'

export interface PickedItem {
  name: string
  category: CategoryId
  quantity: number
  unit: Unit
  productId?: string
}

interface ItemPickerProps {
  open: boolean
  products: Product[]
  alreadyInList: string[]
  onClose: () => void
  onPick: (item: PickedItem) => void
}

export function ItemPicker({
  open,
  products,
  alreadyInList,
  onClose,
  onPick,
}: ItemPickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [quantity, setQuantity] = useState(1)

  const listed = useMemo(
    () => new Set(alreadyInList.map((n) => n.toLowerCase())),
    [alreadyInList],
  )

  const catalogMatches = useMemo(
    () => searchCatalog(query, category),
    [query, category],
  )

  const stockMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => {
        if (category !== 'all' && p.category !== category) return false
        if (!q) return true
        return p.name.toLowerCase().includes(q)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [products, query, category])

  const exactInCatalog = catalogMatches.some(
    (i) => i.name.toLowerCase() === query.trim().toLowerCase(),
  )
  const canAddTyped = query.trim().length > 1 && !exactInCatalog

  function reset() {
    setQuery('')
    setCategory('all')
    setSelected(null)
    setQuantity(1)
  }

  function close() {
    reset()
    onClose()
  }

  function confirmPick(item: CatalogItem, productId?: string) {
    onPick({
      name: item.name,
      category: item.category,
      quantity: Math.max(1, quantity),
      unit: item.unit,
      productId,
    })
    reset()
    onClose()
  }

  function pickCatalog(item: CatalogItem) {
    const product = products.find(
      (p) => p.name.toLowerCase() === item.name.toLowerCase(),
    )
    if (selected?.name === item.name) {
      confirmPick(item, product?.id)
      return
    }
    setSelected(item)
    setQuantity(1)
  }

  return (
    <Modal open={open} title="Adicionar item" onClose={close}>
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
            placeholder="Digite para buscar"
            autoFocus
            className="h-10 w-full rounded-xl border border-line bg-paper pr-3 pl-9 text-sm outline-none focus:border-ink"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <FilterChip
            active={category === 'all'}
            label="Tudo"
            onClick={() => setCategory('all')}
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              label={c.label}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl bg-sand px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selected.name}</p>
                <p className="text-xs text-muted">
                  {categoryLabel(selected.category)} · {selected.unit}
                </p>
              </div>
              <Stepper
                value={quantity}
                min={1}
                decreaseLabel="Diminuir"
                increaseLabel="Aumentar"
                onChange={setQuantity}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const product = products.find(
                  (p) => p.name.toLowerCase() === selected.name.toLowerCase(),
                )
                confirmPick(selected, product?.id)
              }}
              className="mt-2.5 h-9 w-full rounded-xl bg-ink text-sm font-semibold text-white"
            >
              Colocar na lista
            </button>
          </div>
        )}

        {canAddTyped && (
          <button
            type="button"
            onClick={() =>
              confirmPick({
                name: query.trim(),
                category: category === 'all' ? 'outros' : category,
                unit: 'un',
              })
            }
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-left"
          >
            <Plus size={16} className="text-leaf" />
            <span className="text-sm font-semibold">
              Adicionar “{query.trim()}”
            </span>
          </button>
        )}

        <div className="max-h-[48vh] space-y-3 overflow-y-auto">
          {stockMatches.length > 0 && (
            <section>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                Em casa
              </p>
              <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
                {stockMatches.map((product) => {
                  const inList = listed.has(product.name.toLowerCase())
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={inList}
                      onClick={() =>
                        pickCatalog({
                          name: product.name,
                          category: product.category,
                          unit: product.unit,
                        })
                      }
                      className="flex w-full items-center justify-between gap-2 border-b border-line px-3 py-2.5 text-left last:border-b-0 disabled:opacity-45"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {product.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {categoryLabel(product.category)} · {product.quantity}{' '}
                          {product.unit}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted">
                        {inList ? 'Na lista' : 'Escolher'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
              Catálogo ({catalogMatches.length})
            </p>
            {catalogMatches.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                Nada encontrado. Digite e adicione um item novo.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line">
                {catalogMatches.map((item) => {
                  const inList = listed.has(item.name.toLowerCase())
                  const active = selected?.name === item.name
                  return (
                    <button
                      key={`${item.category}-${item.name}`}
                      type="button"
                      disabled={inList}
                      onClick={() => pickCatalog(item)}
                      className={`flex w-full items-center justify-between gap-2 border-b border-line px-3 py-2.5 text-left last:border-b-0 disabled:opacity-45 ${
                        active ? 'bg-moss/70' : ''
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {categoryLabel(item.category)} · {item.unit}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted">
                        {inList ? 'Na lista' : active ? 'Selecionado' : 'Escolher'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </Modal>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
        active ? 'bg-ink text-white' : 'bg-card text-ink-soft ring-1 ring-line'
      }`}
    >
      {label}
    </button>
  )
}
