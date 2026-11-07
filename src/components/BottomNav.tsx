import { ClipboardList, Home, ShoppingCart } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AppView } from '../types'

interface BottomNavProps {
  view: AppView
  onChange: (view: AppView) => void
  listCount: number
  lowStockCount: number
}

export function BottomNav({
  view,
  onChange,
  listCount,
  lowStockCount,
}: BottomNavProps) {
  return (
    <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3">
      <div className="pointer-events-auto mb-2 flex w-full max-w-sm items-center gap-1 rounded-full bg-ink p-1 shadow-xl shadow-ink/20">
        <NavButton
          active={view === 'estoque'}
          label="Casa"
          count={lowStockCount}
          icon={<Home size={15} />}
          onClick={() => onChange('estoque')}
        />
        <NavButton
          active={view === 'lista'}
          label="Lista"
          count={listCount}
          icon={<ClipboardList size={15} />}
          onClick={() => onChange('lista')}
        />
        <NavButton
          active={view === 'comprar'}
          label="Mercado"
          count={listCount}
          icon={<ShoppingCart size={15} />}
          onClick={() => onChange('comprar')}
        />
      </div>
    </nav>
  )
}

function NavButton({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-full text-xs font-semibold ${
        active ? 'bg-white text-ink' : 'text-white/75'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 text-[10px] font-bold ${
            active ? 'bg-warn-soft text-warn' : 'bg-white/15 text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
