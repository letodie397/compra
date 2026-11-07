import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ItemPicker } from '../components/ItemPicker'
import { ListItemRow } from '../components/ListItemRow'
import { SaveStatus } from '../components/SaveStatus'
import { useAppStore } from '../store/useAppStore'

type Ask = 'delete-list' | null

export function ListEditView() {
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const products = useAppStore((s) => s.products) ?? []
  const createList = useAppStore((s) => s.createList)
  const setActiveList = useAppStore((s) => s.setActiveList)
  const renameList = useAppStore((s) => s.renameList)
  const deleteList = useAppStore((s) => s.deleteList)
  const addListItem = useAppStore((s) => s.addListItem)
  const updateListItem = useAppStore((s) => s.updateListItem)
  const removeListItem = useAppStore((s) => s.removeListItem)
  const generateListFromLowStock = useAppStore((s) => s.generateListFromLowStock)
  const setView = useAppStore((s) => s.setView)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [ask, setAsk] = useState<Ask>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId],
  )

  const items = activeList?.items ?? []
  const pendingCount = items.filter((i) => !i.checked).length
  const lowCount = products.filter((p) => p.quantity <= p.minQuantity).length

  function makeListFromHome() {
    if (lowCount === 0) {
      setNotice('Nada acabando em casa.')
      return
    }
    setNotice(null)
    generateListFromLowStock('O que está acabando')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Compra
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Lista</h1>
          <p className="mt-0.5 text-xs text-muted">Monte o que vai comprar</p>
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
                  active
                    ? 'bg-ink text-white'
                    : 'bg-card text-ink-soft ring-1 ring-line'
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
            Crie uma lista ou gere a partir do estoque.
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
              {items.length} {items.length === 1 ? 'item' : 'itens'} ·{' '}
              {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-8 rounded-full bg-leaf px-3 text-xs font-semibold text-white"
            >
              Adicionar
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center">
              <p className="text-sm font-semibold">Lista vazia</p>
              <p className="mt-1 text-xs text-muted">
                Busque no catálogo e adicione os itens.
              </p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-4 h-9 rounded-full bg-ink px-4 text-sm font-semibold text-white"
              >
                Abrir catálogo
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(20,24,22,0.04)] ring-1 ring-black/5">
              {items.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  mode="edit"
                  onToggle={() => undefined}
                  onRemove={() => removeListItem(activeList.id, item.id)}
                  onChangeQty={(qty) =>
                    updateListItem(activeList.id, item.id, { quantity: qty })
                  }
                />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setView('comprar')}
              className="h-10 w-full rounded-xl bg-market text-sm font-semibold text-white"
            >
              Ir para o mercado
            </button>
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

      <ItemPicker
        open={pickerOpen}
        products={products}
        alreadyInList={items.map((i) => i.name)}
        onClose={() => setPickerOpen(false)}
        onPick={(item) => {
          if (!activeList) return
          addListItem(activeList.id, item)
        }}
      />

      <ConfirmDialog
        open={ask === 'delete-list'}
        title="Apagar esta lista?"
        message="O estoque de casa não muda."
        confirmLabel="Apagar"
        onClose={() => setAsk(null)}
        onConfirm={() => {
          if (activeList) deleteList(activeList.id)
          setAsk(null)
        }}
      />
    </div>
  )
}
