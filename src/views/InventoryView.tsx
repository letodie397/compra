import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ItemPicker } from '../components/ItemPicker'
import { Modal } from '../components/Modal'
import { ProductCard } from '../components/ProductCard'
import { ProductForm } from '../components/ProductForm'
import { SaveStatus } from '../components/SaveStatus'
import { Stepper } from '../components/Stepper'
import { CATEGORIES, categoryLabel } from '../data/categories'
import { textEquals, textIncludes } from '../lib/text'
import { useAppStore } from '../store/useAppStore'
import type { CategoryId, Product } from '../types'

export function InventoryView() {
  const products = useAppStore((s) => s.products) ?? []
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const addProduct = useAppStore((s) => s.addProduct)
  const updateProduct = useAppStore((s) => s.updateProduct)
  const deleteProduct = useAppStore((s) => s.deleteProduct)
  const adjustQuantity = useAppStore((s) => s.adjustQuantity)
  const generateListFromLowStock = useAppStore((s) => s.generateListFromLowStock)
  const createList = useAppStore((s) => s.createList)
  const addListItem = useAppStore((s) => s.addListItem)
  const updateListItem = useAppStore((s) => s.updateListItem)
  const setView = useAppStore((s) => s.setView)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [toList, setToList] = useState<Product | null>(null)
  const [listQty, setListQty] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const lowStock = products.filter((p) => p.quantity <= p.minQuantity)
  const activeList =
    lists.find((l) => l.id === activeListId) ?? lists[0] ?? null

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (category !== 'all' && p.category !== category) return false
        if (showLowOnly && p.quantity > p.minQuantity) return false
        return textIncludes(p.name, query)
      })
      .sort((a, b) => {
        const aLow = a.quantity <= a.minQuantity ? 0 : 1
        const bLow = b.quantity <= b.minQuantity ? 0 : 1
        if (aLow !== bLow) return aLow - bLow
        return a.name.localeCompare(b.name, 'pt-BR')
      })
  }, [products, category, showLowOnly, query])

  function makeShoppingList() {
    if (lowStock.length === 0) {
      setNotice('Nada acabando agora.')
      return
    }
    setNotice(null)
    generateListFromLowStock('O que está acabando')
    setView('lista')
  }

  function openSendToList(product: Product) {
    const suggested = Math.max(1, product.minQuantity - product.quantity)
    setListQty(suggested)
    setToList(product)
  }

  function confirmSendToList() {
    if (!toList) return
    const qty = Math.max(1, listQty)
    let listId = activeList?.id
    if (!listId) {
      listId = createList('Lista de compras')
    }

    const list = useAppStore.getState().lists.find((l) => l.id === listId)
    const existing = list?.items?.find(
      (i) =>
        (toList.id && i.productId === toList.id) ||
        textEquals(i.name, toList.name),
    )

    if (existing) {
      updateListItem(listId, existing.id, {
        quantity: existing.quantity + qty,
      })
    } else {
      addListItem(listId, {
        productId: toList.id,
        name: toList.name,
        category: toList.category,
        quantity: qty,
        unit: toList.unit,
      })
    }

    setNotice(
      `${toList.name} · ${qty} ${qty === 1 ? 'unidade' : 'unidades'} na lista`,
    )
    setToList(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Compra
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Casa</h1>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <SaveStatus />
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Adicionar produto"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="h-10 w-full rounded-xl bg-ink text-sm font-semibold text-white"
      >
        Adicionar produto em casa
      </button>

      {lowStock.length > 0 && (
        <button
          type="button"
          onClick={makeShoppingList}
          className="flex w-full items-center justify-between rounded-2xl bg-ink px-3.5 py-2.5 text-left text-white"
        >
          <span>
            <span className="block text-sm font-semibold">
              {lowStock.length === 1
                ? '1 item acabando'
                : `${lowStock.length} itens acabando`}
            </span>
            <span className="text-xs text-white/65">Gerar lista de compras</span>
          </span>
          <span className="text-xs font-semibold text-white/80">Criar</span>
        </button>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-moss px-3 py-2">
          <p className="text-sm text-ink-soft">{notice}</p>
          <button
            type="button"
            onClick={() => setView('lista')}
            className="shrink-0 text-xs font-semibold text-leaf"
          >
            Ver lista
          </button>
        </div>
      )}

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar"
          aria-label="Buscar pelo nome"
          className="h-10 w-full rounded-xl border border-line bg-card pr-3 pl-9 text-sm outline-none focus:border-ink"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        <FilterButton
          active={category === 'all' && !showLowOnly}
          label="Tudo"
          onClick={() => {
            setCategory('all')
            setShowLowOnly(false)
          }}
        />
        <FilterButton
          active={showLowOnly}
          label={`Baixo ${lowStock.length}`}
          warn
          onClick={() => {
            setShowLowOnly(true)
            setCategory('all')
          }}
        />
        {CATEGORIES.map((c) => (
          <FilterButton
            key={c.id}
            active={category === c.id && !showLowOnly}
            label={c.label}
            onClick={() => {
              setCategory(c.id)
              setShowLowOnly(false)
            }}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center">
          <p className="text-sm font-semibold">
            {products.length === 0 ? 'Nenhum produto' : 'Nada nesse filtro'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {products.length === 0
              ? 'Toque em Adicionar produto em casa.'
              : 'Toque em Tudo para ver a casa inteira.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(20,24,22,0.04)] ring-1 ring-black/5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdjust={(delta) => adjustQuantity(product.id, delta)}
              onEdit={() => setEditing(product)}
              onDelete={() => setPendingDelete(product)}
              onAddToList={() => openSendToList(product)}
            />
          ))}
        </div>
      )}

      <ItemPicker
        open={pickerOpen}
        title="Colocar em casa"
        products={products}
        alreadyInList={[]}
        onClose={() => setPickerOpen(false)}
        onPick={(item) => {
          const existing = products.find((p) => textEquals(p.name, item.name))
          if (existing) {
            adjustQuantity(existing.id, item.quantity)
            return
          }
          addProduct({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            minQuantity: 1,
            unit: item.unit,
          })
        }}
      />

      <Modal
        open={editing !== null}
        title="Editar produto"
        onClose={() => setEditing(null)}
        fixedHeight
      >
        {editing && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <ProductForm
              key={editing.id}
              initial={editing}
              submitLabel="Salvar"
              onSubmit={(data) => {
                updateProduct(editing.id, data)
                setEditing(null)
              }}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={toList !== null}
        title="Mandar pra lista"
        onClose={() => setToList(null)}
      >
        {toList && (
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold">{toList.name}</p>
              <p className="text-sm text-muted">
                {categoryLabel(toList.category)} · em casa:{' '}
                {toList.quantity}{' '}
                {toList.quantity === 1 ? 'unidade' : 'unidades'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-sand px-3 py-3">
              <span className="text-sm font-medium">Quantidade na lista</span>
              <Stepper
                value={listQty}
                min={1}
                decreaseLabel="Diminuir"
                increaseLabel="Aumentar"
                onChange={setListQty}
              />
            </div>
            <button
              type="button"
              onClick={confirmSendToList}
              className="h-11 w-full rounded-xl bg-ink text-sm font-semibold text-white"
            >
              Colocar na lista
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Apagar produto?"
        message={
          pendingDelete ? `${pendingDelete.name} sai do estoque de casa.` : null
        }
        confirmLabel="Apagar"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteProduct(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function FilterButton({
  label,
  active,
  onClick,
  warn,
}: {
  label: string
  active: boolean
  onClick: () => void
  warn?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
        active
          ? warn
            ? 'bg-warn text-white'
            : 'bg-ink text-white'
          : 'bg-card text-ink-soft ring-1 ring-line'
      }`}
    >
      {label}
    </button>
  )
}
