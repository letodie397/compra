import { useState, useEffect, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { saveUserProfile, listUserProfiles, getUserProfile } from '../firebase/repository'
import { useFirebaseContext } from '../firebase/FirebaseProvider'
import { UserPlus, Users, Shield, Wrench, Settings, AlertCircle, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react'
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

export function Admin() {
  const { technicians } = useFirebaseContext()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sector, setSector] = useState<Sector>('setor_som')
  const [companyId, setCompanyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

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

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    if (sector === 'instalador' && !companyId) {
      setFormError('Selecione a empresa (prestador) vinculada ao instalador.')
      return
    }
    setSubmitting(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const profile: UserProfile = {
        uid: cred.user.uid,
        name: name.trim(),
        sector,
        ...(sector === 'instalador' ? { companyId } : {}),
      }
      await saveUserProfile(profile)
      setFormSuccess(`Usuário "${name}" criado com sucesso!`)
      setName('')
      setEmail('')
      setPassword('')
      setSector('setor_som')
      setCompanyId('')
      setShowForm(false)
      await loadUsers()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/email-already-in-use') {
        setFormError('Este e-mail já está cadastrado.')
      } else if (code === 'auth/weak-password') {
        setFormError('A senha deve ter no mínimo 6 caracteres.')
      } else {
        setFormError('Erro ao criar usuário. Verifique os dados.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email)
      alert(`E-mail de redefinição enviado para ${email}`)
    } catch {
      alert('Erro ao enviar e-mail de redefinição.')
    }
  }

  async function handleUpdateProfile(uid: string, updates: Partial<UserProfile>) {
    const current = await getUserProfile(uid)
    if (!current) return
    await saveUserProfile({ ...current, ...updates })
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
          <h1 className="text-lg font-bold text-gray-900">Gerenciar Usuários</h1>
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
            onClick={() => { setShowForm(true); setFormError(null); setFormSuccess(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 transition-colors"
          >
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} />
          {formSuccess}
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Criar Novo Usuário</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nome da pessoa"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha inicial (mín. 6 caracteres)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500"
                />
              </div>
            </div>

            {/* Setor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Setor</label>
              <div className="flex flex-wrap gap-2">
                {SECTOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSector(opt.value); setCompanyId('') }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      sector === opt.value
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

            {/* Empresa vinculada (instalador) */}
            {sector === 'instalador' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Empresa vinculada (prestador) *
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 bg-white"
                >
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
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-icm-red-600 text-white rounded-xl text-sm font-semibold hover:bg-icm-red-700 disabled:opacity-50 transition-colors"
              >
                <UserPlus size={15} />
                {submitting ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
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
          <p className="text-gray-400 text-xs mt-1">Clique em "Novo Usuário" para começar</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {users.map((u) => {
              const sectorOpt = SECTOR_OPTIONS.find((s) => s.value === u.sector)
              return (
                <div key={u.uid} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SECTOR_COLORS[u.sector]}`}>
                        {sectorOpt?.label ?? u.sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="font-mono truncate">{u.uid.slice(0, 12)}…</span>
                      {u.sector === 'instalador' && u.companyId && (
                        <span>Empresa: <span className="font-medium text-gray-700">{getTechnicianName(u.companyId)}</span></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mudar setor rápido */}
                    <select
                      value={u.sector}
                      onChange={(e) => handleUpdateProfile(u.uid, { sector: e.target.value as Sector })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-icm-red-500"
                    >
                      {SECTOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {/* Redefinir senha */}
                    <button
                      type="button"
                      onClick={async () => {
                        const emailUser = prompt('E-mail do usuário para redefinição de senha:')
                        if (emailUser) await handleResetPassword(emailUser)
                      }}
                      title="Enviar redefinição de senha"
                      className="p-1.5 text-gray-400 hover:text-icm-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <KeyRound size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Aviso sobre configuração Firebase */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Configuração necessária no Firebase Console</p>
          <p className="text-xs mt-0.5 text-amber-700">
            Habilite o Firebase Authentication com provedor E-mail/Senha em{' '}
            <span className="font-mono">console.firebase.google.com → Authentication → Sign-in method</span>.
            Também configure as regras do Realtime Database para exigir autenticação.
          </p>
        </div>
      </div>
    </div>
  )
}
