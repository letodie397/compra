import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Menu,
  X,
  Church,
  Wrench,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { APP_VERSION } from '../config/version'
import { SyncIndicator } from './SyncIndicator'
import { SyncErrorBanner } from './SyncErrorBanner'
import { useAuth } from '../contexts/AuthContext'
import type { Sector } from '../types'

const SECTOR_LABEL: Record<Sector, string> = {
  instalador: 'Instalador',
  setor_som: 'Setor de Som',
  manutencao: 'Manutenção',
  admin: 'Administrador',
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  sectors: Sector[]
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', sectors: ['instalador', 'setor_som', 'admin'] },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos', sectors: ['instalador', 'setor_som', 'admin'] },
  { to: '/prestadores', icon: Users, label: 'Prestadores', sectors: ['setor_som', 'admin'] },
  { to: '/manutencao', icon: Wrench, label: 'Manutenção', sectors: ['manutencao', 'admin'] },
  { to: '/admin', icon: Settings, label: 'Admin', sectors: ['admin'] },
]

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/pedidos/novo')) return 'Novo Pedido'
  if (pathname.startsWith('/pedidos')) return 'Pedidos'
  if (pathname.startsWith('/prestadores')) return 'Prestadores'
  if (pathname.startsWith('/manutencao')) return 'Manutenção'
  if (pathname.startsWith('/admin')) return 'Administração'
  return 'ICM Pedidos'
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const { profile, signOut } = useAuth()

  const sector = profile?.sector ?? 'setor_som'
  const visibleNav = navItems.filter((item) => item.sectors.includes(sector))

  return (
    <div className="flex min-h-dvh bg-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 lg:self-start inset-y-0 left-0 z-50 w-64 lg:w-52 bg-icm-red-800 text-white transform transition-transform duration-300 lg:translate-x-0 shrink-0 flex flex-col h-dvh max-h-dvh overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 pb-4 border-b border-icm-red-700 sidebar-safe-top">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
            <Church className="text-icm-red-700" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm leading-snug">ICM Pedidos</h1>
            <p className="text-icm-red-200 text-[11px] leading-snug mt-0.5">Espírito Santo</p>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 -mr-1 shrink-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-icm-red-800 shadow-sm'
                    : 'text-icm-red-100 hover:bg-icm-red-700 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className="leading-snug">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="shrink-0 px-3 pt-3 pb-2 border-t border-icm-red-700 sidebar-safe-bottom space-y-2">
          {profile && (
            <div className="bg-icm-red-700/50 rounded-xl px-3 py-2">
              <p className="text-white text-xs font-semibold truncate">{profile.name}</p>
              <p className="text-icm-red-300 text-[11px]">{SECTOR_LABEL[profile.sector]}</p>
            </div>
          )}
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-icm-red-200 hover:bg-icm-red-700 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
          <div className="flex items-center justify-between px-1 pb-1">
            <SyncIndicator inverted />
            <span className="text-icm-red-300/80 text-[11px]">v{APP_VERSION}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-dvh bg-gray-50/60">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 safe-top shrink-0">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
            <button
              type="button"
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {pageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <SyncIndicator />
              {profile && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    <span className="font-medium truncate max-w-[100px]">{profile.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {SECTOR_LABEL[profile.sector]}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                        <button
                          type="button"
                          onClick={() => { setUserMenuOpen(false); signOut() }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut size={15} />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <span className="hidden sm:inline text-[10px] text-gray-400">v{APP_VERSION}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 lg:py-6 max-w-[1400px]">
            <SyncErrorBanner />
            <Outlet />
          </div>
        </main>

        {/* Bottom nav mobile — apenas itens visíveis do setor (max 4) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom">
          <div className={`grid max-w-lg mx-auto`} style={{ gridTemplateColumns: `repeat(${Math.min(visibleNav.length, 4)}, 1fr)` }}>
            {visibleNav.slice(0, 4).map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-medium transition-colors ${
                    isActive ? 'text-icm-red-700' : 'text-gray-500 active:text-icm-red-600'
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
