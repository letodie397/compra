import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, ArrowLeft } from 'lucide-react'
import { useTechnicians, useOrders, updateOrder } from '../hooks/useData'
import { searchChurchLocations } from '../data/church-parser'
import { resolveChurchCoordinates } from '../data/maranata-churches'
import { DuplicateOrderError } from '../firebase/repository'
import { buildPatch, hasPatchChanges } from '../utils/patch-diff'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ConfidenceBadge } from '../components/ui/Badge'
import { LocationSuggestions } from '../components/LocationSuggestions'
import { PageContainer } from '../components/PageContainer'
import type {
  ChurchIdentification,
  ChurchIdentificationCandidate,
  Order,
  OrderStatus,
} from '../types'

export function EditOrder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const technicians = useTechnicians()
  const orders = useOrders()
  const order = orders?.find((o) => o.id === id)

  const [numeroPedido, setNumeroPedido] = useState('')
  const [nomeIgreja, setNomeIgreja] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [status, setStatus] = useState<OrderStatus>('pendente')
  const [observacoes, setObservacoes] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<ChurchIdentification | null>(null)
  const [baseline, setBaseline] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!order) return
    setBaseline(order)
    setNumeroPedido(order.numeroPedido)
    setNomeIgreja(order.nomeIgreja)
    setTechnicianId(order.technicianId ?? '')
    setStatus(order.status)
    setObservacoes(order.observacoes ?? '')
    if (order.bairroIdentificado && order.cidadeIdentificada) {
      setSelectedLocation({
        bairro: order.bairroIdentificado,
        cidade: order.cidadeIdentificada,
        confidence: 'alta',
        matchedFrom: order.nomeIgreja,
      })
    } else {
      setSelectedLocation(null)
    }
  }, [order?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const searchResult = useMemo(() => {
    if (!nomeIgreja.trim()) return null
    return searchChurchLocations(nomeIgreja)
  }, [nomeIgreja])

  const identification = useMemo<ChurchIdentification | null>(() => {
    if (selectedLocation) return selectedLocation
    if (!searchResult?.best) return null
    if (searchResult.needsSelection) return null
    return searchResult.best
  }, [selectedLocation, searchResult])

  const needsLocationSelection =
    searchResult !== null &&
    searchResult.suggestions.length > 0 &&
    (searchResult.needsSelection || !identification)

  function handleSelectLocation(candidate: ChurchIdentificationCandidate) {
    setSelectedLocation({
      bairro: candidate.bairro,
      cidade: candidate.cidade,
      bairroHistorico: candidate.bairroHistorico,
      codigoMaranata: candidate.codigoMaranata,
      nomeOficialMaranata: candidate.nomeOficialMaranata,
      lat: candidate.lat,
      lng: candidate.lng,
      confidence: candidate.confidence,
      matchedFrom: candidate.matchedFrom,
      matchType: candidate.matchType,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!order || !baseline) return
    if (!numeroPedido.trim() || !nomeIgreja.trim()) return
    if (needsLocationSelection) return

    setSaving(true)
    setSaveError(null)

    try {
      const tech = technicians?.find((t) => t.id === technicianId)
      const coords = identification ? resolveChurchCoordinates(identification) : undefined

      const next: Order = {
        ...baseline,
        numeroPedido: numeroPedido.trim(),
        nomeIgreja: nomeIgreja.trim(),
        bairroIdentificado: identification?.bairro,
        cidadeIdentificada: identification?.cidade,
        lat: coords?.lat,
        lng: coords?.lng,
        technicianId: technicianId || undefined,
        technicianName: tech?.name,
        status,
        observacoes: observacoes.trim() || undefined,
      }

      const patch = buildPatch(baseline, next, [
        'numeroPedido',
        'nomeIgreja',
        'bairroIdentificado',
        'cidadeIdentificada',
        'lat',
        'lng',
        'technicianId',
        'technicianName',
        'status',
        'observacoes',
      ])

      if (!hasPatchChanges(patch)) {
        navigate('/pedidos')
        return
      }

      await updateOrder(order.id, patch)
      navigate('/pedidos')
    } catch (error) {
      if (error instanceof DuplicateOrderError) {
        setSaveError(error.message)
      } else {
        setSaveError('Não foi possível salvar o pedido. Verifique a conexão e tente novamente.')
        console.error(error)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!orders) {
    return (
      <PageContainer size="narrow">
        <p className="text-gray-500">Carregando pedido...</p>
      </PageContainer>
    )
  }

  if (!order) {
    return (
      <PageContainer size="narrow" className="space-y-4">
        <p className="text-gray-700">Pedido não encontrado.</p>
        <Link to="/pedidos" className="text-icm-red-700 hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={16} />
          Voltar aos pedidos
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="narrow" className="space-y-6">
      <div>
        <Link
          to="/pedidos"
          className="text-sm text-gray-500 hover:text-icm-red-700 inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Editar Pedido #{order.numeroPedido}</h1>
        <p className="text-gray-500 mt-1">Altere apenas os campos necessários.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <Input
            label="Número do Pedido"
            value={numeroPedido}
            onChange={(e) => setNumeroPedido(e.target.value)}
            required
          />

          <Input
            label="Nome da Igreja"
            value={nomeIgreja}
            onChange={(e) => {
              setNomeIgreja(e.target.value)
              setSelectedLocation(null)
            }}
            required
          />

          {searchResult && searchResult.suggestions.length > 0 && (
            <LocationSuggestions
              suggestions={searchResult.suggestions}
              selected={selectedLocation}
              needsSelection={searchResult.needsSelection}
              onSelect={handleSelectLocation}
            />
          )}

          {identification && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <MapPin className="text-green-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {[identification.bairro, identification.cidade].filter(Boolean).join(', ')}
                </p>
                <ConfidenceBadge confidence={identification.confidence} />
              </div>
            </div>
          )}

          <Select
            label="Técnico responsável"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            options={(technicians ?? []).map((t) => ({
              value: t.id,
              label: t.companyName ? `${t.companyName} — ${t.name}` : t.name,
            }))}
            placeholder="Selecione um técnico"
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            options={[
              { value: 'pendente', label: 'Pendente' },
              { value: 'confirmado', label: 'Confirmado' },
              { value: 'em_andamento', label: 'Em andamento' },
              { value: 'concluido', label: 'Concluído' },
              { value: 'cancelado', label: 'Cancelado' },
            ]}
          />

          <Input
            label="Observações"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações adicionais"
          />
        </div>

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {saveError}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/pedidos')}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={needsLocationSelection}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
