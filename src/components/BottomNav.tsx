import { motion } from 'framer-motion'
import { Package, ShoppingCart } from 'lucide-react'
import type { AppView } from '../types'

interface BottomNavProps {
  view: AppView
  onChange: (view: AppView) => void
  listCount: number
  lowStockCount: number
}

const items: {
  id: AppView
  label: string
  icon: typeof Package
}[] = [
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'lista', label: 'Lista', icon: ShoppingCart },
]

export function BottomNav({
  view,
  onChange,
  listCount,
  lowStockCount,
}: BottomNavProps) {
  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/80">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 pt-2">
        {items.map((item) => {
          const active = view === item.id
          const Icon = item.icon
          const badge =
            item.id === 'estoque'
              ? lowStockCount
              : item.id === 'lista'
                ? listCount
                : 0

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className="relative flex min-w-24 flex-col items-center gap-1 rounded-2xl px-4 py-2 transition"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-moss"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon
                  size={20}
                  className={active ? 'text-leaf' : 'text-muted'}
                  strokeWidth={active ? 2.4 : 2}
                />
                {badge > 0 && (
                  <span className="rounded-full bg-warn px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span
                className={`relative z-10 text-xs font-semibold ${
                  active ? 'text-leaf' : 'text-muted'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
