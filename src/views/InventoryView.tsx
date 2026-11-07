import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { ProductCard } from '../components/ProductCard'
import { ProductForm } from '../components/ProductForm'
import { CATEGORIES } from '../data/categories'
import { useAppStore } from '../store/useAppStore'
import type { CategoryId, Product } from '../types'

export function InventoryView() {
  const products = useAppStore((s) => s.products)
  const addProduct = useAppStore((s) => s.addProduct)
  const updateProduct = useAppStore((s) => s.updateProduct)
  const deleteProduct = useAppStore((s) => s.deleteProduct)
  const adjustQuantity = useAppStore((s) => s.adjustQuantity)
  const generateListFromLowStock = useAppStore((s) => s.generateListFromLowStock)
  const getLowStockProducts = useAppStore((s) => s.getLowStockProducts)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const lowStock = getLowStockProducts()

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (category !== 'all' && p.category !== category) return false
        if (showLowOnly && p.quantity > p.minQuantity) return false
        if (!query.trim()) return true
        return p.name.toLowerCase().includes(query.toLowerCase())
      })
      .sort((a, b) => {
        const aLow = a.quantity <= a.minQuantity ? 0 : 1
        const bLow = b.quantity <= b.minQuantity ? 0 : 1
        if (aLow !== bLow) return aLow - bLow
        return a.name.localeCompare(b.name, 'pt-BR')
      })
  }, [products, category, showLowOnly, query])

  return (
    <div className="space-y-5">
      <header className="animate-float-in space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
              Armário de casa
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
              Compra
            </h1>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Controle limpeza, higiene e o que faltar — e transforme em lista
              de compras.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-leaf text-white shadow-lg shadow-leaf/30 transition hover:bg-leaf-bright"
            aria-label="Adicionar produto"
          >
            <Plus size={22} />
          </button>
        </div>

        {lowStock.length > 0 && (
          <motion.button
            type="button"
            onClick={() => generateListFromLowStock()}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center gap-3 rounded-3xl bg-ink px-4 py-3.5 text-left text-white shadow-xl shadow-ink/15"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-bright/20 text-leaf-bright">
              <Sparkles size={20} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-bold">
                Gerar lista de reposição
              </span>
              <span className="text-xs text-white/70">
                {lowStock.length}{' '}
                {lowStock.length === 1 ? 'item baixo' : 'itens baixos'} no
                estoque
              </span>
            </span>
            <AlertTriangle size={18} className="text-warn" />
          </motion.button>
        )}
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no estoque..."
            className="w-full rounded-2xl border border-line bg-white/80 py-3 pr-4 pl-10 text-sm outline-none ring-leaf/25 focus:ring-2"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <FilterChip
            active={category === 'all' && !showLowOnly}
            onClick={() => {
              setCategory('all')
              setShowLowOnly(false)
            }}
            label="Tudo"
          />
          <FilterChip
            active={showLowOnly}
            onClick={() => {
              setShowLowOnly(true)
              setCategory('all')
            }}
            label={`Baixo (${lowStock.length})`}
            warn
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id && !showLowOnly}
              onClick={() => {
                setCategory(c.id)
                setShowLowOnly(false)
              }}
              label={c.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-lg font-bold text-ink">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'produto' : 'produtos'}
          </h2>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-line bg-white/50 px-6 py-12 text-center"
            >
              <p className="font-display text-xl font-bold text-ink">
                Nada por aqui
              </p>
              <p className="mt-1 text-sm text-muted">
                Adicione um produto ou limpe os filtros.
              </p>
            </motion.div>
          ) : (
            filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onAdjust={(delta) => adjustQuantity(product.id, delta)}
                onEdit={() => {
                  setEditing(product)
                  setFormOpen(true)
                }}
                onDelete={() => {
                  if (confirm(`Excluir “${product.name}”?`)) {
                    deleteProduct(product.id)
                  }
                }}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={formOpen}
        title={editing ? 'Editar produto' : 'Novo produto'}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      >
        <ProductForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          submitLabel={editing ? 'Atualizar' : 'Adicionar ao estoque'}
          onSubmit={(data) => {
            if (editing) {
              updateProduct(editing.id, data)
            } else {
              addProduct(data)
            }
            setFormOpen(false)
            setEditing(null)
          }}
        />
      </Modal>
    </div>
  )
}

function FilterChip({
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
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
        active
          ? warn
            ? 'bg-warn text-white'
            : 'bg-ink text-white'
          : 'bg-white/80 text-ink-soft ring-1 ring-line hover:bg-moss'
      }`}
    >
      {label}
    </button>
  )
}
