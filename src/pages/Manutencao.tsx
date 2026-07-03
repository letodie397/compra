import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { paths } from '../firebase/paths'
import { markEquipmentDelivered, unmarkEquipmentDelivered, getServiceData } from '../firebase/repository'
import {
  CheckCircle2,
  Clock,
  Package,
  Filter,
  Wrench,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  X,
} from 'lucide-react'
import type { EquipmentItem, MaterialItem } from '../types'

type FilterType = 'todos' | 'pendentes' | 'entregues'

const TYPE_LABEL: Record<string, string> = {
  AMPLIFICADOR: 'Amplificador',
  MESA_DE_SOM: 'Mesa de Som',
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt="Foto"
        className="max-w-full max-h-full rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function MaterialDetail({ item }: { item: MaterialItem }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {item.nome && (
        <div>
          <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Descrição</span>
          <p className="text-sm text-gray-800 mt-0.5">{item.nome}</p>
        </div>
      )}

      {item.justificativa && (
        <div>
          <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Justificativa</span>
          <p className="text-sm text-gray-700 mt-0.5">{item.justificativa}</p>
        </div>
      )}

      {(item.imagemAntigo || item.imagemNovo) && (
        <div className="grid grid-cols-2 gap-3">
          {item.imagemAntigo && (
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium block mb-1">
                Item Antigo
              </span>
              <div className="relative group">
                <img
                  src={item.imagemAntigo}
                  alt="Item antigo"
                  className="w-full h-28 object-cover rounded-xl border border-gray-200 cursor-zoom-in"
                  onClick={() => setLightbox(item.imagemAntigo)}
                />
                <button
                  type="button"
                  onClick={() => setLightbox(item.imagemAntigo)}
                  className="absolute top-1.5 left-1.5 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>
          )}
          {item.imagemNovo && (
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium block mb-1">
                Item Novo
              </span>
              <div className="relative group">
                <img
                  src={item.imagemNovo}
                  alt="Item novo"
                  className="w-full h-28 object-cover rounded-xl border border-gray-200 cursor-zoom-in"
                  onClick={() => setLightbox(item.imagemNovo)}
                />
                <button
                  type="button"
                  onClick={() => setLightbox(item.imagemNovo)}
                  className="absolute top-1.5 left-1.5 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!item.nome && !item.justificativa && !item.imagemAntigo && !item.imagemNovo && (
        <p className="text-xs text-gray-400 italic">Nenhum detalhe adicional registrado.</p>
      )}
    </div>
  )
}

export function Manutencao() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pendentes')
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  // Cache de materiais carregados: orderId → MaterialItem[]
  const [materialCache, setMaterialCache] = useState<Map<string, MaterialItem[]>>(new Map())
  const [loadingDetail, setLoadingDetail] = useState<Set<string>>(new Set())

  useEffect(() => {
    const equipRef = ref(database, paths.equipmentItems)
    const unsub = onValue(equipRef, (snap) => {
      if (!snap.exists()) {
        setItems([])
      } else {
        const data = snap.val() as Record<string, EquipmentItem>
        const list = Object.values(data).sort((a, b) => {
          if (a.entregue !== b.entregue) return a.entregue ? 1 : -1
          return b.code.localeCompare(a.code)
        })
        setItems(list)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleToggleEntrega(item: EquipmentItem) {
    setActionLoading((prev) => new Set(prev).add(item.code))
    try {
      if (item.entregue) {
        await unmarkEquipmentDelivered(item.code)
      } else {
        await markEquipmentDelivered(item.code)
      }
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev)
        next.delete(item.code)
        return next
      })
    }
  }

  async function handleExpand(item: EquipmentItem) {
    if (expandedCode === item.code) {
      setExpandedCode(null)
      return
    }
    setExpandedCode(item.code)

    // Carrega materiais se ainda não estiver no cache
    if (!materialCache.has(item.orderId)) {
      setLoadingDetail((prev) => new Set(prev).add(item.code))
      try {
        const data = await getServiceData(item.orderId)
        const mats: MaterialItem[] = data?.materiais ?? []
        setMaterialCache((prev) => new Map(prev).set(item.orderId, mats))
      } finally {
        setLoadingDetail((prev) => {
          const next = new Set(prev)
          next.delete(item.code)
          return next
        })
      }
    }
  }

  function getMaterialItem(item: EquipmentItem): MaterialItem | null {
    const mats = materialCache.get(item.orderId) ?? []
    return mats.find((m) => m.codigo === item.code) ?? null
  }

  const filtered = items.filter((i) => {
    if (filter === 'pendentes') return !i.entregue
    if (filter === 'entregues') return i.entregue
    return true
  })

  const pendentes = items.filter((i) => !i.entregue).length
  const entregues = items.filter((i) => i.entregue).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-icm-red-700 to-icm-red-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">Setor de Manutenção</h1>
              <p className="text-icm-red-200 text-sm">Rastreamento de equipamentos trocados</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-5 py-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{items.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="px-5 py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{pendentes}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pendentes</p>
          </div>
          <div className="px-5 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{entregues}</p>
            <p className="text-xs text-gray-500 mt-0.5">Entregues</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter size={15} className="text-gray-400 shrink-0" />
        {(['todos', 'pendentes', 'entregues'] as FilterType[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-icm-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-icm-red-300'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'pendentes' ? 'Pendentes' : 'Entregues'}
            {f === 'pendentes' && pendentes > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === f ? 'bg-white/20' : 'bg-red-100 text-red-600'
              }`}>{pendentes}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-icm-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-600 font-semibold">
            {filter === 'pendentes' ? 'Nenhum equipamento pendente' : 'Nenhum equipamento encontrado'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {filter === 'pendentes' ? 'Todos os equipamentos foram entregues!' : 'Ajuste os filtros acima'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isPending = !item.entregue
            const isActing = actionLoading.has(item.code)
            const isExpanded = expandedCode === item.code
            const isLoadingDet = loadingDetail.has(item.code)
            const matItem = getMaterialItem(item)

            return (
              <div
                key={item.code}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${
                  isPending ? 'border-red-200' : 'border-emerald-200'
                }`}
              >
                <div className="flex">
                  <div className={`w-1.5 shrink-0 ${isPending ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleExpand(item)}
                        className="flex-1 min-w-0 text-left"
                      >
                        {/* Código e tipo */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-base font-mono font-bold ${
                            isPending ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {item.code}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {TYPE_LABEL[item.type] ?? item.type}
                          </span>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-500">
                              <Clock size={11} />
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                              <CheckCircle2 size={11} />
                              Entregue
                            </span>
                          )}
                          <span className="ml-auto text-gray-400">
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </span>
                        </div>

                        {/* Informações do pedido */}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-gray-600">
                          <div>
                            <span className="text-gray-400">Pedido: </span>
                            <span className="font-semibold">#{item.orderNumero}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Igreja: </span>
                            <span className="font-medium truncate">{item.nomeIgreja}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Instalador: </span>
                            <span className="font-medium">{item.instaladorName}</span>
                          </div>
                        </div>

                        {item.entregueEm && (
                          <p className="mt-1.5 text-[11px] text-emerald-600">
                            Entrada em {new Date(item.entregueEm).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </button>

                      {/* Botão ação */}
                      <button
                        type="button"
                        onClick={() => handleToggleEntrega(item)}
                        disabled={isActing}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isPending
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isActing ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isPending ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        {isActing ? '...' : isPending ? 'Dar Entrada' : 'Desfazer'}
                      </button>
                    </div>

                    {/* Detalhe expandido */}
                    {isExpanded && (
                      isLoadingDet ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-3.5 h-3.5 border-2 border-icm-red-500 border-t-transparent rounded-full animate-spin" />
                          Carregando detalhes...
                        </div>
                      ) : matItem ? (
                        <MaterialDetail item={matItem} />
                      ) : (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 italic">
                            Nenhum detalhe disponível para este equipamento.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
