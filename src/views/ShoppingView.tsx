import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ListItemRow } from '../components/ListItemRow'
import { Modal } from '../components/Modal'
import { SaveStatus } from '../components/SaveStatus'
import { Stepper } from '../components/Stepper'
import { CATEGORIES, UNITS, unitName } from '../data/categories'
import { useAppStore } from '../store/useAppStore'
import type { CategoryId, Unit } from '../types'

type Ask = 'delete-list' | 'apply' | 'clear' | null

const fieldClass =
  'mt-1 h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink'

export function ShoppingView() {
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const products = useAppStore((s) => s.products) ?? []
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
  const [productId, setProductId] = useState('')
  const [ask, setAsk] = useState<Ask>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId],
  )

  const checkedCount = activeList?.items?.filter((i) => i.checked).length ?? 0
  const pendingCount = (activeList?.items?.length ?? 0) - checkedCount
  const lowCount = products.filter((p) => p.quantity <= p.minQuantity).length

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

  function makeListFromHome() {
    if (lowCount === 0) {
      setNotice('Nada acabando em casa.')
      return
    }
    setNotice(null)
    generateListFromLowStock('O que está acabando')
  }

  const askCopy =
    ask === 'delete-list'
      ? {
          title: 'Apagar esta lista?',
          message: 'O estoque de casa não muda.',
          confirm: 'Apagar',
        }
      : ask === 'apply'
        ? {
            title: 'Atualizar a casa?',
            message: 'Os itens marcados entram na quantidade de casa.',
            confirm: 'Atualizar',
          }
        : ask === 'clear'
          ? {
              title: 'Limpar comprados?',
              message: 'Os itens marcados saem desta lista.',
              confirm: 'Limpar',
            }
          : null

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Compra
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
        </div>
        <div className="pt-1">
          <SaveStatus />
        </div>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setNotice(null)
            createList('Lista nova')
          }}
          className="h-9 flex-1 rounded-full bg-ink text-sm font-semibold text-white"
        >
          Nova lista
        </button>
        <button
          type="button"
          onClick={makeListFromHome}
          className="h-9 flex-1 rounded-full bg-card text-sm font-semibold text-ink ring-1 ring-line"
        >
          Do estoque
        </button>
      </div>

      {notice && (
        <p className="rounded-xl bg-sand px-3 py-2 text-sm text-ink-soft">{notice}</p>
      )}

      {lists.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {lists.map((list) => {
            const active = activeList?.id === list.id
            const pending = list.items?.filter((i) => !i.checked).length ?? 0
            return (
              <button
                key={list.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveList(list.id)}
                className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
                  active ? 'bg-ink text-white' : 'bg-card text-ink-soft ring-1 ring-line'
                }`}
              >
                {list.name}
                <span className={active ? 'text-white/70' : 'text-muted'}>
                  {' '}
                  {pending}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!activeList ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center">
          <p className="text-sm font-semibold">Nenhuma lista</p>
          <p className="mt-1 text-xs text-muted">
            Crie uma lista vazia ou a partir do estoque.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <input
            value={activeList.name}
            aria-label="Nome desta lista"
            onChange={(e) => renameList(activeList.id, e.target.value)}
            className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'} ·{' '}
              {checkedCount} {checkedCount === 1 ? 'comprado' : 'comprados'}
            </p>
            <button
              type="button"
              onClick={openAddItem}
              className="h-8 rounded-full bg-leaf px-3 text-xs font-semibold text-white"
            >
              Adicionar
            </button>
          </div>

          {(activeList.items?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center">
              <p className="text-sm font-semibold">Lista vazia</p>
              <p className="mt-1 text-xs text-muted">Adicione o primeiro item.</p>
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(20,24,22,0.04)] ring-1 ring-black/5">
              {activeList.items.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleListItem(activeList.id, item.id)}
                  onRemove={() => removeListItem(activeList.id, item.id)}
                  onChangeQty={(qty) =>
                    updateListItem(activeList.id, item.id, { quantity: qty })
                  }
                />
              ))}
            </div>
          )}

          {checkedCount > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAsk('apply')}
                className="h-9 rounded-xl bg-leaf text-xs font-semibold text-white"
              >
                Pôr em casa
              </button>
              <button
                type="button"
                onClick={() => setAsk('clear')}
                className="h-9 rounded-xl bg-sand text-xs font-semibold text-ink"
              >
                Limpar marcados
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAsk('delete-list')}
            className="text-xs font-medium text-muted"
          >
            Apagar lista
          </button>
        </section>
      )}

      <Modal
        open={itemModal}
        title="Novo item"
        onClose={() => setItemModal(false)}
      >
        <form
          className="space-y-3.5"
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
          <label className="block">
            <span className="text-xs font-medium text-muted">Do estoque</span>
            <select
              value={productId}
              onChange={(e) => handlePickProduct(e.target.value)}
              className={fieldClass}
            >
              <option value="">Item avulso</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Sabão em pó"
              className={fieldClass}
            />
          </label>

          <fieldset>
            <legend className="text-xs font-medium text-muted">Categoria</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const selected = category === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(c.id)}
                    className={`h-8 rounded-full px-3 text-xs font-semibold ${
                      selected ? 'bg-ink text-white' : 'bg-sand text-ink-soft'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div>
            <p className="text-xs font-medium text-muted">Quantidade</p>
            <div className="mt-1.5">
              <Stepper
                value={quantity}
                min={1}
                decreaseLabel="Diminuir quantidade"
                increaseLabel="Aumentar quantidade"
                onChange={setQuantity}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-muted">Unidade</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {UNITS.map((u) => {
                const selected = unit === u
                return (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setUnit(u)}
                    className={`h-8 rounded-full px-3 text-xs font-semibold ${
                      selected ? 'bg-ink text-white' : 'bg-sand text-ink-soft'
                    }`}
                  >
                    {unitName(u)}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            className="h-10 w-full rounded-xl bg-ink text-sm font-semibold text-white"
          >
            Adicionar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={askCopy !== null}
        title={askCopy?.title ?? ''}
        message={askCopy?.message}
        confirmLabel={askCopy?.confirm ?? 'Confirmar'}
        onClose={() => setAsk(null)}
        onConfirm={() => {
          if (!activeList) {
            setAsk(null)
            return
          }
          if (ask === 'delete-list') deleteList(activeList.id)
          if (ask === 'apply') applyPurchasesToStock(activeList.id)
          if (ask === 'clear') clearCheckedItems(activeList.id)
          setAsk(null)
        }}
      />
    </div>
  )
}
