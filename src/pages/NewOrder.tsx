import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Church, MapPin, User } from 'lucide-react'
import { useTechnicians, addOrder } from '../hooks/useData'
import { searchChurchLocations } from '../data/church-parser'
import { resolveChurchCoordinates } from '../data/maranata-churches'
import { DuplicateOrderError, WriteConflictError } from '../firebase/repository'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ConfidenceBadge } from '../components/ui/Badge'
import { LocationSuggestions } from '../components/LocationSuggestions'
import { PageContainer } from '../components/PageContainer'
import type { ChurchIdentification, ChurchIdentificationCandidate } from '../types'

export function NewOrder() {
  const navigate = useNavigate()
  const technicians = useTechnicians()

  const [numeroPedido, setNumeroPedido] = useState('')
  const [nomeIgreja, setNomeIgreja] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<ChurchIdentification | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const searchResult = useMemo(() => {
    if (!nomeIgreja.trim()) return null
    return searchChurchLocations(nomeIgreja)
  }, [nomeIgreja])

  useEffect(() => {
    setSelectedLocation(null)
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
    if (!numeroPedido.trim() || !nomeIgreja.trim()) return
    if (needsLocationSelection) return

    setSaving(true)
    setSaveError(null)
    try {
      const tech = technicians?.find((t) => t.id === technicianId)
      const coords = identification ? resolveChurchCoordinates(identification) : undefined

      await addOrder({
        numeroPedido: numeroPedido.trim(),
        nomeIgreja: nomeIgreja.trim(),
        bairroIdentificado: identification?.bairro,
        cidadeIdentificada: identification?.cidade,
        lat: coords?.lat,
        lng: coords?.lng,
        technicianId: technicianId || undefined,
        technicianName: tech?.name,
        status: 'pendente',
        observacoes: observacoes.trim() || undefined,
      })
      navigate('/pedidos')
    } catch (error) {
      if (error instanceof DuplicateOrderError) {
        setSaveError(error.message)
      } else if (error instanceof WriteConflictError) {
        setSaveError(error.message)
      } else {
        setSaveError('Não foi possível salvar o pedido. Verifique a conexão e tente novamente.')
        console.error(error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer size="narrow" className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Novo Pedido</h1>
        <p className="text-gray-500 mt-1">
          Cadastre um pedido informando o número e o nome da igreja
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-icm-red-100 rounded-xl flex items-center justify-center">
              <Church className="text-icm-red-700" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dados do Pedido</h2>
              <p className="text-sm text-gray-500">Informações básicas</p>
            </div>
          </div>

          <Input
            label="Número do Pedido"
            value={numeroPedido}
            onChange={(e) => setNumeroPedido(e.target.value)}
            placeholder="Ex: 12345"
            required
          />

          <Input
            label="Nome da Igreja"
            value={nomeIgreja}
            onChange={(e) => setNomeIgreja(e.target.value)}
            placeholder="Ex: Normilia 1, Ipiranga 2, Jardim da Penha I"
            hint="Digite o início do nome do bairro + número. Se houver várias opções, escolha a correta."
            required
            autoComplete="off"
            enterKeyHint="next"
          />

          {searchResult && searchResult.suggestions.length > 0 && (
            <LocationSuggestions
              suggestions={searchResult.suggestions}
              selected={selectedLocation ?? identification}
              needsSelection={searchResult.needsSelection}
              onSelect={handleSelectLocation}
            />
          )}

          {identification && nomeIgreja.trim() && (
            <div className="p-4 bg-icm-red-50 rounded-xl border border-icm-red-100">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="text-icm-red-600" size={18} />
                <span className="font-medium text-icm-red-900">Localização Confirmada</span>
                <ConfidenceBadge confidence={identification.confidence} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-icm-red-600 text-xs uppercase tracking-wide">Bairro</p>
                  <p className="font-medium text-icm-red-900">
                    {identification.bairro ?? 'Não identificado'}
                  </p>
                </div>
                <div>
                  <p className="text-icm-red-600 text-xs uppercase tracking-wide">Cidade</p>
                  <p className="font-medium text-icm-red-900">
                    {identification.cidade ?? 'Não identificada'}
                  </p>
                </div>
              </div>
              {identification.matchType === 'maranata' && identification.nomeOficialMaranata && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5 mt-3">
                  Cadastro oficial ICM: <strong>{identification.nomeOficialMaranata}</strong>
                  {identification.codigoMaranata && (
                    <span className="text-emerald-600"> ({identification.codigoMaranata})</span>
                  )}
                </p>
              )}
            </div>
          )}

          {needsLocationSelection && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Selecione o bairro correto na lista acima para continuar.
            </div>
          )}

          {nomeIgreja.trim().length >= 3 && searchResult?.suggestions.length === 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
              Nenhum bairro encontrado para "{searchResult.query}". Verifique a grafia ou use o nome completo.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="text-blue-700" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Técnico Responsável</h2>
              <p className="text-sm text-gray-500">Opcional — pode ser atribuído depois</p>
            </div>
          </div>

          <Select
            label="Prestador de Serviço"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            options={(technicians ?? []).map((t) => ({
              value: t.id,
              label: t.companyName ? `${t.companyName} — ${t.name}` : t.name,
            }))}
            placeholder="Selecione um técnico (opcional)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre o pedido..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500 resize-none"
            />
          </div>
        </div>

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {saveError}
          </div>
        )}

        <div className="flex gap-3 sticky bottom-20 lg:static lg:bottom-auto z-20 bg-gray-50 py-3 -mx-4 px-4 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent safe-bottom">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px]"
            onClick={() => navigate('/pedidos')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[48px]"
            loading={saving}
            disabled={needsLocationSelection}
          >
            Salvar Pedido
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
