import { useState } from 'react'
import { Plus, Phone, Mail, Trash2, Edit2, Building2 } from 'lucide-react'
import {
  useTechnicians,
  addTechnician,
  updateTechnician,
  deleteTechnician,
} from '../hooks/useData'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Technician } from '../types'

export function Technicians() {
  const technicians = useTechnicians()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setName('')
    setCompanyName('')
    setPhone('')
    setEmail('')
    setModalOpen(true)
  }

  function openEdit(tech: Technician) {
    setEditing(tech)
    setName(tech.name)
    setCompanyName(tech.companyName ?? '')
    setPhone(tech.phone)
    setEmail(tech.email ?? '')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const patch: Partial<Technician> = {}
        if (name.trim() !== editing.name) patch.name = name.trim()
        if ((companyName.trim() || undefined) !== editing.companyName) patch.companyName = companyName.trim() || undefined
        if (phone.trim() !== editing.phone) patch.phone = phone.trim()
        if ((email.trim() || undefined) !== editing.email) patch.email = email.trim() || undefined
        if (Object.keys(patch).length > 0) await updateTechnician(editing.id, patch)
      } else {
        await addTechnician({
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
        })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Deseja excluir este prestador?')) {
      await deleteTechnician(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Prestadores de Serviço</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie as empresas e técnicos instaladores</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Novo Prestador
        </Button>
      </div>

      {!technicians || technicians.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="font-semibold text-gray-900">Nenhum prestador cadastrado</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Cadastre as empresas e técnicos que realizam as instalações.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={18} />
            Cadastrar Prestador
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-icm-red-100 rounded-xl flex items-center justify-center text-icm-red-700 font-bold text-lg">
                  {(tech.companyName ?? tech.name).charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(tech)}
                    className="p-2 rounded-lg text-gray-400 hover:text-icm-red-700 hover:bg-icm-red-50"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tech.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {tech.companyName && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 size={13} className="text-icm-red-400" />
                  <span className="text-sm text-icm-red-700 font-semibold">{tech.companyName}</span>
                </div>
              )}
              <h3 className="font-medium text-gray-700 text-sm">{tech.name}</h3>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  {tech.phone}
                </div>
                {tech.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    {tech.email}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Prestador' : 'Novo Prestador'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Empresa / Instaladora"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Instaladora ICM Vitória"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do responsável"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do técnico"
              required
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(27) 99999-9999"
              required
            />
          </div>
          <Input
            label="E-mail (opcional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
