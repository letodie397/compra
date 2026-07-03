import { useState, useEffect, type FormEvent } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { ref, remove } from 'firebase/database'
import { auth, database } from '../firebase/config'
import { saveUserProfile, listUserProfiles } from '../firebase/repository'
import { useFirebaseContext } from '../firebase/FirebaseProvider'
import { useAuth } from '../contexts/AuthContext'
import {
  UserPlus, Users, Shield, Wrench, Settings, AlertCircle,
  CheckCircle2, RefreshCw, Pencil, Trash2, X, Save,
} from 'lucide-react'
import type { UserProfile, Sector, Technician } from '../types'

const SECTOR_OPTIONS: { value: Sector; label: string; icon: React.ElementType }[] = [
  { value: 'instalador', label: 'Instalador', icon: Settings },
  { value: 'setor_som', label: 'Setor de Som', icon: Users },
  { value: 'manutencao', label: 'Manutenção', icon: Wrench },
  { value: 'admin', label: 'Administrador', icon: Shield },
]

const SECTOR_COLORS: Record<Sector, string> = {
  instalador: 'bg-blue-100 text-blue-700',
  setor_som: 'bg-purple-100 text-purple-700',
  manutencao: 'bg-orange-100 text-orange-700',
  admin: 'bg-icm-red-100 text-icm-red-700',
}

/** "admin" → "admin@icm.com" (mesmo mapeamento do Login.tsx) */
function toEmail(login: string): string {
  const v = login.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@icm.com`
}

interface EditState {
  uid: string
  name: string
  sector: Sector
  companyId: string
}

export function Admin() {
  const { technicians } = useFirebaseContext()
  const { profile: myProfile, reloadProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Novo usuário
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newSector, setNewSector] = useState<Sector>('setor_som')
  const [newCompanyId, setNewCompanyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const list = await listUserProfiles()
      setUsers(list)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function openForm() {
    setShowForm(true)
    setEditState(null)
    setFormError(null)
    setFormSuccess(null)
    setNewLogin('')
    setNewPassword('')
    setNewName('')
    setNewSector('setor_som')
    setNewCompanyId('')
  }

  function openEdit(u: UserProfile) {
    setEditState({ uid: u.uid, name: u.name, sector: u.sector, companyId: u.companyId ?? '' })
    setShowForm(false)
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    if (newSector === 'instalador' && !newCompanyId) {
      setFormError('Selecione a empresa vinculada ao instalador.')
      return
    }
    setSubmitting(true)
    try {
      const email = toEmail(newLogin)
      const cred = await createUserWithEmailAndPassword(auth, email, newPassword)
      const profile: UserProfile = {
        uid: cred.user.uid,
        name: newName.trim(),
        sector: newSector,
        ...(newSector === 'instalador' ? { companyId: newCompanyId } : {}),
      }
      await saveUserProfile(profile)
      setFormSuccess(`Usuário "${newName}" criado! Login: ${newLogin} / Senha: ${newPassword}`)
      setShowForm(false)
      await loadUsers()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/email-already-in-use') {
        setFormError('Este login já está em uso.')
      } else if (code === 'auth/weak-password') {
        setFormError('A senha deve ter no mínimo 6 caracteres.')
      } else {
        setFormError('Erro ao criar usuário.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveEdit() {
    if (!editState) return
    setSubmitting(true)
    try {
      const profile: UserProfile = {
        uid: editState.uid,
        name: editState.name,
        sector: editState.sector,
        ...(editState.sector === 'instalador' && editState.companyId
          ? { companyId: editState.companyId }
          : {}),
      }
      await saveUserProfile(profile)
      // Se editou o próprio perfil, atualiza o contexto
      if (editState.uid === myProfile?.uid) await reloadProfile()
      setEditState(null)
      setFormSuccess('Usuário atualizado!')
      await loadUsers()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(u: UserProfile) {
    if (!confirm(`Remover acesso de "${u.name}"? A conta Firebase continua existindo mas o usuário não conseguirá mais entrar.`)) return
    await remove(ref(database, `icm/users/${u.uid}`))
    setFormSuccess(`Acesso de "${u.name}" removido.`)
    await loadUsers()
  }

  function getTechnicianName(id: string) {
    return technicians?.find((t: Technician) => t.id === id)?.name ?? id
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Gerenciar Acessos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Recarregar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={openForm}
            className="flex items-center gap-2 px-4 py-2 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 transition-colors"
          >
            <UserPlus size={16} />
            Novo Acesso
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {formSuccess}
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Criar Novo Acesso</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Nome da pessoa"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Login</label>
                <input type="text" value={newLogin} onChange={(e) => setNewLogin(e.target.value)} required placeholder="ex: joao"
                  autoCapitalize="none"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500" />
                <p className="text-[11px] text-gray-400 mt-0.5">Username ou e-mail completo</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha (mín. 6 caracteres)</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="••••••"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Setor</label>
              <div className="flex flex-wrap gap-2">
                {SECTOR_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { setNewSector(opt.value); setNewCompanyId('') }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      newSector === opt.value
                        ? 'bg-icm-red-600 text-white border-icm-red-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-icm-red-400'
                    }`}
                  >
                    <opt.icon size={13} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {newSector === 'instalador' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Empresa vinculada *</label>
                <select value={newCompanyId} onChange={(e) => setNewCompanyId(e.target.value)} required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 bg-white">
                  <option value="">Selecione um prestador...</option>
                  {(technicians ?? []).map((t: Technician) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm flex items-center gap-2">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 disabled:opacity-50 transition-colors">
                <UserPlus size={15} />
                {submitting ? 'Criando...' : 'Criar Acesso'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      {loadingUsers ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-icm-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <Users className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-600 font-semibold">Nenhum usuário cadastrado</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Novo Acesso" para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const sectorOpt = SECTOR_OPTIONS.find((s) => s.value === u.sector)
            const isEditing = editState?.uid === u.uid
            const isMe = u.uid === myProfile?.uid

            return (
              <div key={u.uid} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Visualização */}
                {!isEditing ? (
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                        {isMe && <span className="text-[11px] text-icm-red-600 font-semibold">(você)</span>}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SECTOR_COLORS[u.sector]}`}>
                          {sectorOpt?.label ?? u.sector}
                        </span>
                      </div>
                      {u.sector === 'instalador' && u.companyId && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Empresa: <span className="font-medium text-gray-700">{getTechnicianName(u.companyId)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => openEdit(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button type="button" onClick={() => handleDelete(u)}
                        disabled={isMe}
                        title={isMe ? 'Não é possível excluir sua própria conta' : 'Remover acesso'}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulário de edição inline */
                  <div className="px-5 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">Editando: {u.name}</p>
                      <button type="button" onClick={() => setEditState(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                        <input type="text" value={editState.name}
                          onChange={(e) => setEditState((s) => s && { ...s, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500" />
                      </div>
                      {editState.sector === 'instalador' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Empresa vinculada</label>
                          <select value={editState.companyId}
                            onChange={(e) => setEditState((s) => s && { ...s, companyId: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 bg-white">
                            <option value="">Selecione...</option>
                            {(technicians ?? []).map((t: Technician) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Setor</label>
                      <div className="flex flex-wrap gap-2">
                        {SECTOR_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setEditState((s) => s && { ...s, sector: opt.value, companyId: '' })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              editState.sector === opt.value
                                ? 'bg-icm-red-600 text-white border-icm-red-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-icm-red-400'
                            }`}
                          >
                            <opt.icon size={13} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={handleSaveEdit} disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 disabled:opacity-50 transition-colors">
                        <Save size={14} />
                        {submitting ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button type="button" onClick={() => setEditState(null)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
        <div>
          <p className="font-semibold">Login padrão do administrador</p>
          <p className="text-xs mt-0.5 text-amber-700">
            Login: <span className="font-mono font-bold">admin</span> — equivale ao e-mail{' '}
            <span className="font-mono">admin@icm.com</span> no Firebase Authentication.
            Certifique-se de que esta conta existe com esse e-mail no Console do Firebase.
          </p>
        </div>
      </div>
    </div>
  )
}
