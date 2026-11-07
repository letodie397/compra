import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ListItemRow } from '../components/ListItemRow'
import { SaveStatus } from '../components/SaveStatus'
import { useAppStore } from '../store/useAppStore'

type Ask = 'apply' | 'clear' | null

export function ShopView() {
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const setActiveList = useAppStore((s) => s.setActiveList)
  const toggleListItem = useAppStore((s) => s.toggleListItem)
  const clearCheckedItems = useAppStore((s) => s.clearCheckedItems)
  const applyPurchasesToStock = useAppStore((s) => s.applyPurchasesToStock)
  const setView = useAppStore((s) => s.setView)

  const [ask, setAsk] = useState<Ask>(null)

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId],
  )

  const items = activeList?.items ?? []
  const pending = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)
  const progress =
    items.length === 0 ? 0 : Math.round((checked.length / items.length) * 100)

  const askCopy =
    ask === 'apply'
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
          <h1 className="text-2xl font-semibold tracking-tight">Mercado</h1>
          <p className="mt-0.5 text-xs text-muted">
            Marque o que já colocou no carrinho
          </p>
        </div>
        <div className="pt-1">
          <SaveStatus />
        </div>
      </header>

      {lists.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {lists.map((list) => {
            const active = activeList?.id === list.id
            const left = list.items?.filter((i) => !i.checked).length ?? 0
            return (
              <button
                key={list.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveList(list.id)}
                className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
                  active
                    ? 'bg-market text-white'
                    : 'bg-card text-ink-soft ring-1 ring-line'
                }`}
              >
                {list.name}
                <span className={active ? 'text-white/75' : 'text-muted'}>
                  {' '}
                  {left}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!activeList || items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center">
          <p className="text-sm font-semibold">
            {!activeList ? 'Nenhuma lista' : 'Lista vazia'}
          </p>
          <p className="mt-1 text-xs text-muted">
            Monte a lista primeiro e depois volte aqui.
          </p>
          <button
            type="button"
            onClick={() => setView('lista')}
            className="mt-4 h-9 rounded-full bg-ink px-4 text-sm font-semibold text-white"
          >
            Montar lista
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="rounded-2xl bg-card px-3.5 py-3 ring-1 ring-line">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{activeList.name}</p>
                <p className="text-xs text-muted">
                  {checked.length} de {items.length} · {pending.length} faltando
                </p>
              </div>
              <span className="text-lg font-semibold text-ink">{progress}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-leaf transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {pending.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                Ainda falta
              </p>
              <div className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(20,24,22,0.04)] ring-1 ring-black/5">
                {pending.map((item) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    mode="shop"
                    onToggle={() => toggleListItem(activeList.id, item.id)}
                    onRemove={() => undefined}
                    onChangeQty={() => undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {checked.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                Já peguei
              </p>
              <div className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(20,24,22,0.04)] ring-1 ring-black/5">
                {checked.map((item) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    mode="shop"
                    onToggle={() => toggleListItem(activeList.id, item.id)}
                    onRemove={() => undefined}
                    onChangeQty={() => undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {checked.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAsk('apply')}
                className="h-10 rounded-xl bg-leaf text-sm font-semibold text-white"
              >
                Pôr em casa
              </button>
              <button
                type="button"
                onClick={() => setAsk('clear')}
                className="h-10 rounded-xl bg-sand text-sm font-semibold text-ink"
              >
                Limpar marcados
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setView('lista')}
            className="text-xs font-medium text-muted"
          >
            Voltar para montar a lista
          </button>
        </section>
      )}

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
          if (ask === 'apply') applyPurchasesToStock(activeList.id)
          if (ask === 'clear') clearCheckedItems(activeList.id)
          setAsk(null)
        }}
      />
    </div>
  )
}
