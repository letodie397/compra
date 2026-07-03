import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Church, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { signIn, signOut } from '../firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { APP_VERSION, APP_BUILD } from '../config/version'

/** Converte "admin" → "admin@icm.com" | "foo@bar.com" → "foo@bar.com" */
function toEmail(login: string): string {
  const v = login.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@icm.com`
}

export function Login() {
  const { user, profile, loading } = useAuth()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Aguarda verificação de auth
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-icm-red-700">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Já logado com perfil → redireciona
  if (user && profile) {
    const dest = profile.sector === 'manutencao' ? '/manutencao' : '/'
    return <Navigate to={dest} replace />
  }

  // Logado mas sem perfil → mostra erro de conta sem acesso
  if (user && !profile) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-icm-red-800 to-icm-red-600 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
              <Church className="text-icm-red-700" size={32} />
            </div>
            <h1 className="text-white text-2xl font-bold">ICM Pedidos</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-7 text-center space-y-4">
            <AlertCircle className="mx-auto text-amber-500" size={36} />
            <div>
              <h2 className="font-semibold text-gray-800">Conta sem perfil configurado</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sua conta existe mas ainda não tem um setor atribuído.
                Peça ao administrador para configurar seu acesso.
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 bg-icm-red-600 hover:bg-icm-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Sair e tentar outro login
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const email = toEmail(login)
      await signIn(email, password)
      // AuthContext detecta o login e redireciona via Navigate acima
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Login ou senha incorretos.')
      } else if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else if (code === 'auth/invalid-email') {
        setError('Login inválido.')
      } else {
        setError('Erro ao entrar. Verifique sua conexão.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-icm-red-800 to-icm-red-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Church className="text-icm-red-700" size={32} />
          </div>
          <h1 className="text-white text-2xl font-bold">ICM Pedidos</h1>
          <p className="text-icm-red-200 text-sm mt-1">Espírito Santo</p>
        </div>

        {/* Versão */}
        <p className="text-center text-icm-red-300 text-[11px] mb-3 font-mono">
          v{APP_VERSION} · build {APP_BUILD}
        </p>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-7">
          <h2 className="text-gray-900 text-lg font-semibold mb-5">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                autoCapitalize="none"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Use o nome de usuário ou e-mail completo
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-icm-red-600 hover:bg-icm-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={17} className="animate-spin" /> : null}
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
