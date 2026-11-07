import { AnimatePresence, motion } from 'framer-motion'
import { Cloud, CloudOff, LoaderCircle } from 'lucide-react'
import { BottomNav } from './components/BottomNav'
import { useFirebaseSync } from './hooks/useFirebaseSync'
import { useAppStore } from './store/useAppStore'
import { InventoryView } from './views/InventoryView'
import { ShoppingView } from './views/ShoppingView'

export default function App() {
  useFirebaseSync()

  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const lists = useAppStore((s) => s.lists) ?? []
  const activeListId = useAppStore((s) => s.activeListId)
  const products = useAppStore((s) => s.products) ?? []
  const hydrated = useAppStore((s) => s.hydrated)
  const syncing = useAppStore((s) => s.syncing)
  const syncError = useAppStore((s) => s.syncError)

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Compra
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={14} className="animate-spin" />
            Sincronizando com o Firebase...
          </p>
        </div>
      </div>
    )
  }

  const lowStockCount = products.filter((p) => p.quantity <= p.minQuantity)
    .length
  const activeList =
    lists.find((l) => l.id === activeListId) ?? lists[0] ?? null
  const listCount =
    activeList?.items?.filter((i) => !i.checked).length ?? 0

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4">
      <div className="safe-top sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between gap-2 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-line backdrop-blur">
          {syncError ? (
            <>
              <CloudOff size={12} className="text-warn" />
              Offline / erro
            </>
          ) : syncing ? (
            <>
              <LoaderCircle size={12} className="animate-spin text-leaf" />
              Salvando...
            </>
          ) : (
            <>
              <Cloud size={12} className="text-leaf" />
              Firebase sync
            </>
          )}
        </span>
        {syncError && (
          <span className="truncate text-[11px] font-medium text-warn">
            {syncError}
          </span>
        )}
      </div>

      <main className="pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {view === 'estoque' ? <InventoryView /> : <ShoppingView />}
          </motion.div>
        </AnimatePresence>
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
