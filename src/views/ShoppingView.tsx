import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCheck,
  ListPlus,
  PackagePlus,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { ListItemRow } from '../components/ListItemRow'
import { Modal } from '../components/Modal'
import { CATEGORIES, UNITS } from '../data/categories'
import { useAppStore } from '../store/useAppStore'
import type { CategoryId, Unit } from '../types'

export function ShoppingView() {
  const lists = useAppStore((s) => s.lists)
  const activeListId = useAppStore((s) => s.activeListId)
  const products = useAppStore((s) => s.products)
  const createList = useAppStore((s) => s.createList)
  const setActiveList = useAppStore((s) => s.setActiveList)
  const renameList = useAppStore((s) => s.renameList)
  const deleteList = useAppStore((s) => s.deleteList)
  const addListItem = useAppStore((s) => s.addListItem)
  const updateListItem = useAppStore((s) => s.updateListItem)
  const toggleListItem = useAppStore((s) => s.toggleListItem)
  const removeListItem = useAppStore((s) => s.removeListItem)
  const clearCheckedItems = useAppStore((s) => s.clearCheckedItems)
  const applyPurchasesToStock = useAppStore((s) => s.applyPurchasesToStock)
  const generateListFromLowStock = useAppStore((s) => s.generateListFromLowStock)

  const [itemModal, setItemModal] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryId>('limpeza')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState<Unit>('un')
  const [productId, setProductId] = useState<string>('')

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId],
  )

  const checkedCount = activeList?.items.filter((i) => i.checked).length ?? 0
  const pendingCount =
    (activeList?.items.length ?? 0) - checkedCount

  function openAddItem() {
    setName('')
    setCategory('limpeza')
    setQuantity(1)
    setUnit('un')
    setProductId('')
    setItemModal(true)
  }

  function handlePickProduct(id: string) {
    setProductId(id)
    const product = products.find((p) => p.id === id)
    if (!product) return
    setName(product.name)
    setCategory(product.category)
    setUnit(product.unit)
    setQuantity(Math.max(1, product.minQuantity - product.quantity))
  }

  return (
    <div className="space-y-5">
      <header className="animate-float-in space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
            No mercado
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
            Lista
          </h1>
          <p className="mt-1 text-sm text-muted">
            Monte, edite e marque o que já entrou no carrinho.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => createList()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-leaf px-3 py-3 text-sm font-bold text-white shadow-lg shadow-leaf/25 transition hover:bg-leaf-bright"
          >
            <ListPlus size={18} />
            Nova lista
          </button>
          <button
            type="button"
            onClick={() => generateListFromLowStock()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-3 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
          >
            <PackagePlus size={18} />
            Do estoque
          </button>
        </div>
      </header>

      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {lists.map((list) => {
            const active = activeList?.id === list.id
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => setActiveList(list.id)}
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-left transition ${
                  active
                    ? 'bg-ink text-white'
                    : 'bg-white/80 text-ink-soft ring-1 ring-line'
                }`}
              >
                <span className="block text-sm font-bold">{list.name}</span>
                <span
                  className={`text-[11px] ${active ? 'text-white/65' : 'text-muted'}`}
                >
                  {list.items.length} itens
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!activeList ? (
        <div className="rounded-3xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            Nenhuma lista ainda
          </p>
          <p className="mt-2 text-sm text-muted">
            Crie uma lista vazia ou gere a partir do estoque baixo.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={activeList.name}
              onChange={(e) => renameList(activeList.id, e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-transparent bg-transparent px-1 font-display text-2xl font-bold text-ink outline-none focus:border-line focus:bg-white/70 focus:px-3 focus:py-1"
            />
            <button
              type="button"
              aria-label="Excluir lista"
              onClick={() => {
                if (confirm('Excluir esta lista?')) {
                  deleteList(activeList.id)
                }
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-warn-soft hover:text-warn"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-line">
            <p className="text-sm text-ink-soft">
              <strong className="text-ink">{pendingCount}</strong> pendentes ·{' '}
              <strong className="text-leaf">{checkedCount}</strong> feitos
            </p>
            <button
              type="button"
              onClick={openAddItem}
              className="inline-flex items-center gap-1.5 rounded-full bg-moss px-3 py-1.5 text-xs font-bold text-leaf transition hover:bg-leaf hover:text-white"
            >
              <Plus size={14} />
              Item
            </button>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {activeList.items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-3xl border border-dashed border-line bg-white/40 px-6 py-10 text-center text-sm text-muted"
                >
                  Lista vazia. Adicione itens ou gere do estoque.
                </motion.div>
              ) : (
                activeList.items.map((item, index) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onToggle={() => toggleListItem(activeList.id, item.id)}
                    onRemove={() => removeListItem(activeList.id, item.id)}
                    onChangeQty={(qty) =>
                      updateListItem(activeList.id, item.id, {
                        quantity: qty,
                      })
                    }
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {checkedCount > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => applyPurchasesToStock(activeList.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-leaf px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-leaf/20"
              >
                <PackagePlus size={18} />
                Atualizar estoque
              </button>
              <button
                type="button"
                onClick={() => clearCheckedItems(activeList.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-sand px-4 py-3.5 text-sm font-bold text-ink-soft"
              >
                <CheckCheck size={18} />
                Limpar marcados
              </button>
            </div>
          )}
        </section>
      )}

      <Modal
        open={itemModal}
        title="Adicionar à lista"
        onClose={() => setItemModal(false)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!activeList || !name.trim()) return
            addListItem(activeList.id, {
              productId: productId || undefined,
              name: name.trim(),
              category,
              quantity: Math.max(1, quantity),
              unit,
            })
            setItemModal(false)
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Do estoque (opcional)
            </span>
            <select
              value={productId}
              onChange={(e) => handlePickProduct(e.target.value)}
              className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
            >
              <option value="">Item avulso...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} {p.unit})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Nome
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  category === c.id
                    ? 'bg-leaf text-white'
                    : 'bg-sand text-ink-soft'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Quantidade
              </span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Unidade
              </span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-leaf py-3.5 text-sm font-bold text-white"
          >
            Adicionar item
          </button>
        </form>
      </Modal>
    </div>
  )
}
