import { LoaderCircle } from 'lucide-react'
import { BottomNav } from './components/BottomNav'
import { useAppSync } from './hooks/useAppSync'
import { useAppStore } from './store/useAppStore'
import { InventoryView } from './views/InventoryView'
import { ListEditView } from './views/ListEditView'
import { ShopView } from './views/ShopView'

export default function App() {
  useAppSync()

  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const products = useAppStore((s) => s.products) ?? []
  const hydrated = useAppStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-ink">Compra</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={14} className="animate-spin" />
            Abrindo...
          </p>
        </div>
      </div>
    )
  }

  const lowStockCount = products.filter((p) => p.quantity <= p.minQuantity).length
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null
  const listCount = activeList?.items?.filter((i) => !i.checked).length ?? 0

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-5 pb-24">
      <main>
        {view === 'estoque' ? (
          <InventoryView />
        ) : view === 'comprar' ? (
          <ShopView />
        ) : (
          <ListEditView />
        )}
      </main>
      <BottomNav
        view={view}
        onChange={setView}
        listCount={listCount}
        lowStockCount={lowStockCount}
      />
    </div>
  )
}
