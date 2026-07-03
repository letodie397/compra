import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Church, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn } from '../firebase/auth'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      // AuthContext vai atualizar profile; redirecionar após sign in
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.')
      } else if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setError('Erro ao entrar. Verifique sua conexão.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Já logado — redireciona
  if (profile) {
    navigate('/', { replace: true })
    return null
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-7">
          <h2 className="text-gray-900 text-lg font-semibold mb-5">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-icm-red-500 focus:border-icm-red-500"
              />
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
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-icm-red-600 hover:bg-icm-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
