import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ImagePlus, X, Package, Loader2, Tag, ZoomIn, CheckCircle2 } from 'lucide-react'
import { uploadImage, deleteImage } from '../../utils/upload-image'
import { reserveEquipmentCode, commitEquipmentCode, deleteEquipmentItem } from '../../firebase/repository'
import { useAuth } from '../../contexts/AuthContext'
import type { MaterialItem, MaterialItemTipo, Order } from '../../types'

const TIPOS: { value: MaterialItemTipo; label: string }[] = [
  { value: 'AMPLIFICADOR', label: 'Amplificador' },
  { value: 'MESA_DE_SOM', label: 'Mesa de Som' },
  { value: 'MICROFONE', label: 'Microfone' },
  { value: 'CAIXAS_DE_SOM', label: 'Caixas de Som' },
  { value: 'OUTRO', label: 'Outro' },
]

const NEEDS_CODE: MaterialItemTipo[] = ['AMPLIFICADOR', 'MESA_DE_SOM']

interface MaterialTabProps {
  orderId: string
  order: Order
  materiais: MaterialItem[]
  saving: boolean
  onSave: (materiais: MaterialItem[]) => Promise<void>
}

function newItem(): MaterialItem {
  return {
    id: crypto.randomUUID(),
    tipo: 'OUTRO',
    nome: '',
    quantidade: 1,
    codigo: undefined,
    imagemAntigo: null,
    imagemNovo: null,
    justificativa: '',
  }
}

type UploadingKey = `${string}-antigo` | `${string}-novo`

// Lightbox simples para exibir imagem em tela cheia
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
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
        alt={alt}
        className="max-w-full max-h-full rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function ImageUpload({
  label,
  value,
  uploading,
  onFile,
  onRemove,
}: {
  label: string
  value: string | null
  uploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const [lightbox, setLightbox] = useState(false)
  return (
    <div className="space-y-1">
      {lightbox && value && (
        <Lightbox src={value} alt={label} onClose={() => setLightbox(false)} />
      )}
      <span className="block text-xs font-medium text-gray-600">{label}</span>
      {value ? (
        <div className="relative group w-full">
          <img
            src={value}
            alt={label}
            className="w-full h-28 object-cover rounded-xl border border-gray-200 cursor-zoom-in"
            loading="lazy"
            onClick={() => setLightbox(true)}
          />
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute top-1.5 left-1.5 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 bg-white/80 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center h-28 w-full border-2 border-dashed rounded-xl transition-colors ${
          uploading
            ? 'border-icm-red-300 bg-red-50/40 cursor-wait'
            : 'border-gray-300 cursor-pointer hover:border-icm-red-400 hover:bg-red-50/30'
        }`}>
          {uploading ? (
            <>
              <Loader2 size={20} className="text-icm-red-500 animate-spin mb-1" />
              <span className="text-xs text-icm-red-500">Enviando...</span>
            </>
          ) : (
            <>
              <ImagePlus size={22} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Clique para adicionar</span>
            </>
          )}
          {!uploading && (
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
                e.target.value = ''
              }}
            />
          )}
        </label>
      )}
    </div>
  )
}

export function MaterialTab({ orderId, order, materiais: initialMateriais, saving, onSave }: MaterialTabProps) {
  const { profile } = useAuth()
  const [items, setItems] = useState<MaterialItem[]>(initialMateriais)
  const [dirty, setDirty] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState<Set<UploadingKey>>(new Set())
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState<Set<string>>(new Set())
  // Cache local: itemId → { tipo → código reservado } — nunca vai pro Firebase aqui
  const [codeCache, setCodeCache] = useState<Map<string, Partial<Record<MaterialItemTipo, string>>>>(new Map())
  // Códigos já commitados no Firebase: itemId → código persistido
  const [committedCodes, setCommittedCodes] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>()
    initialMateriais.forEach((item) => {
      if (item.codigo && NEEDS_CODE.includes(item.tipo as MaterialItemTipo)) m.set(item.id, item.codigo)
    })
    return m
  })

  // Sincroniza quando os dados chegam do Firebase pela primeira vez
  useEffect(() => {
    if (!dirty) {
      setItems(initialMateriais)
      const m = new Map<string, string>()
      initialMateriais.forEach((item) => {
        if (item.codigo && NEEDS_CODE.includes(item.tipo as MaterialItemTipo)) m.set(item.id, item.codigo)
      })
      setCommittedCodes(m)
    }
  }, [initialMateriais]) // eslint-disable-line react-hooks/exhaustive-deps

  function addItem() {
    const item = newItem()
    setItems((prev) => [...prev, item])
    setExpandedId(item.id)
    setDirty(true)
  }

  async function removeItem(id: string) {
    if (!confirm('Deseja remover este item?')) return
    const item = items.find((i) => i.id === id)
    if (item) {
      if (item.imagemAntigo) deleteImage(item.imagemAntigo).catch(console.warn)
      if (item.imagemNovo) deleteImage(item.imagemNovo).catch(console.warn)
      // Se havia código commitado no Firebase, remove
      const committed = committedCodes.get(id)
      if (committed) {
        deleteEquipmentItem(committed).catch(console.warn)
        setCommittedCodes((prev) => { const n = new Map(prev); n.delete(id); return n })
      }
    }
    const updated = items.filter((i) => i.id !== id)
    setItems(updated)
    setDirty(false)
    await onSave(updated)
  }

  function updateItem(id: string, field: keyof MaterialItem, value: unknown) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
    setDirty(true)
  }

  async function handleTipoChange(itemId: string, tipo: MaterialItemTipo) {
    const item = items.find((i) => i.id === itemId)
    if (!item || item.tipo === tipo) return

    if (NEEDS_CODE.includes(tipo)) {
      // Reutiliza código já reservado no cache para este tipo
      const cached = codeCache.get(itemId)?.[tipo]
      if (cached) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, tipo, codigo: cached } : i))
        )
        setDirty(true)
        return
      }

      // Reserva novo código — APENAS no contador do Firebase, sem criar item na manutenção
      setGeneratingCode((prev) => new Set(prev).add(itemId))
      try {
        const code = await reserveEquipmentCode(tipo as 'AMPLIFICADOR' | 'MESA_DE_SOM')
        setCodeCache((prev) => {
          const next = new Map(prev)
          next.set(itemId, { ...next.get(itemId), [tipo]: code })
          return next
        })
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, tipo, codigo: code } : i))
        )
      } catch {
        setUploadError('Erro ao reservar código do equipamento')
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, tipo } : i)))
      } finally {
        setGeneratingCode((prev) => {
          const next = new Set(prev)
          next.delete(itemId)
          return next
        })
      }
    } else {
      // Tipos sem código: limpa o código exibido
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, tipo, codigo: undefined } : i))
      )
    }
    setDirty(true)
  }

  async function handleImageUpload(
    itemId: string,
    field: 'imagemAntigo' | 'imagemNovo',
    file: File
  ) {
    const key: UploadingKey = `${itemId}-${field === 'imagemAntigo' ? 'antigo' : 'novo'}`
    setUploading((prev) => new Set(prev).add(key))
    setUploadError(null)
    try {
      const context = field === 'imagemAntigo' ? 'material-antigo' : 'material-novo'
      const url = await uploadImage(file, orderId, context)
      updateItem(itemId, field, url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setUploading((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  async function handleImageRemove(itemId: string, field: 'imagemAntigo' | 'imagemNovo') {
    const item = items.find((i) => i.id === itemId)
    const url = item?.[field]
    if (url) deleteImage(url).catch(console.warn)
    updateItem(itemId, field, null)
  }

  async function handleSave() {
    // Sincroniza itens de equipamento no Firebase antes de salvar
    const nextCommitted = new Map(committedCodes)

    for (const item of items) {
      const prev = committedCodes.get(item.id)

      if (NEEDS_CODE.includes(item.tipo as MaterialItemTipo) && item.codigo) {
        if (prev !== item.codigo) {
          // Deleta código antigo se mudou
          if (prev) await deleteEquipmentItem(prev).catch(console.warn)
          // Persiste o código atual no Firebase (manutenção)
          await commitEquipmentCode(
            item.codigo,
            item.tipo as 'AMPLIFICADOR' | 'MESA_DE_SOM',
            orderId,
            order.numeroPedido,
            order.nomeIgreja,
            profile?.name ?? 'Instalador'
          )
          nextCommitted.set(item.id, item.codigo)
        }
      } else if (prev) {
        // Tipo mudou para um sem código — remove da manutenção
        await deleteEquipmentItem(prev).catch(console.warn)
        nextCommitted.delete(item.id)
      }
    }

    setCommittedCodes(nextCommitted)
    await onSave(items)
    setDirty(false)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
  }

  const isBusy = uploading.size > 0 || generatingCode.size > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Materiais Substituídos</h3>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} item(s) registrado(s)</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-4 py-2 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 transition-colors"
        >
          <Plus size={16} />
          Adicionar Item
        </button>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-2 text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Package className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 text-sm">Nenhum material registrado</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar Item" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isExpanded = expandedId === item.id
            const upAntigo = uploading.has(`${item.id}-antigo`)
            const upNovo = uploading.has(`${item.id}-novo`)
            const isGenerating = generatingCode.has(item.id)
            const tipoLabel = TIPOS.find((t) => t.value === item.tipo)?.label ?? item.tipo

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-icm-red-100 text-icm-red-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.nome || tipoLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">Qtd: {item.quantidade}</span>
                        {item.codigo && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-icm-red-700 bg-red-50 px-1.5 py-0.5 rounded-md">
                            <Tag size={10} />
                            {item.codigo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4">
                    {/* Tipo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tipo de equipamento *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TIPOS.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleTipoChange(item.id, t.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              item.tipo === t.value
                                ? 'bg-icm-red-600 text-white border-icm-red-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-icm-red-400'
                            } disabled:opacity-50`}
                          >
                            {isGenerating && item.tipo === t.value ? (
                              <span className="flex items-center gap-1">
                                <Loader2 size={11} className="animate-spin" />
                                {t.label}
                              </span>
                            ) : t.label}
                          </button>
                        ))}
                      </div>
                      {/* Código gerado */}
                      {item.codigo && (
                        <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          <Tag size={14} className="text-amber-600 shrink-0" />
                          <div>
                            <p className="text-[11px] text-amber-700 font-medium">Código gerado (rastreamento)</p>
                            <p className="text-sm font-mono font-bold text-amber-800">{item.codigo}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Descrição adicional
                        </label>
                        <input
                          type="text"
                          value={item.nome}
                          onChange={(e) => updateItem(item.id, 'nome', e.target.value)}
                          placeholder={`Ex: marca, modelo...`}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantidade}
                          onChange={(e) => updateItem(item.id, 'quantidade', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ImageUpload
                        label="Foto do item ANTIGO"
                        value={item.imagemAntigo}
                        uploading={upAntigo}
                        onFile={(f) => handleImageUpload(item.id, 'imagemAntigo', f)}
                        onRemove={() => handleImageRemove(item.id, 'imagemAntigo')}
                      />
                      <ImageUpload
                        label="Foto do item NOVO"
                        value={item.imagemNovo}
                        uploading={upNovo}
                        onFile={(f) => handleImageUpload(item.id, 'imagemNovo', f)}
                        onRemove={() => handleImageRemove(item.id, 'imagemNovo')}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Justificativa da substituição
                      </label>
                      <textarea
                        value={item.justificativa}
                        onChange={(e) => updateItem(item.id, 'justificativa', e.target.value)}
                        placeholder="Descreva o motivo da substituição do item..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty || isBusy}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isBusy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {generatingCode.size > 0 ? 'Gerando código...' : 'Aguardando uploads...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {saving ? 'Salvando...' : dirty ? 'Salvar Materiais' : 'Salvar Materiais'}
            </>
          )}
        </button>

        {savedOk && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 animate-fade-in">
            <CheckCircle2 size={17} />
            Materiais salvos!
          </span>
        )}
      </div>
    </div>
  )
}
